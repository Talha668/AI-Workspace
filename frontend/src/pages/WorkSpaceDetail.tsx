import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import DocumentList from '../components/documents/DocumentList';
import DocumentUpload from '../components/documents/DocumentUpload';

interface Workspace {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface Conversation {
  id: number;
  title?: string;
  created_at: string;
}

const inputClasses =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

export default function WorkSpaceDetail() {
  const { id } = useParams();
  const workspaceId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showEdit, setShowEdit] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  const workspaceQuery = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => apiService.api.get(`/workspaces/${workspaceId}/`).then((r) => r.data),
    enabled: !!workspaceId,
  });
  const workspace = workspaceQuery.data as Workspace | undefined;

  // ADAPT: if your current page fetches documents from a different URL, keep yours
  const documentsQuery = useQuery({
    queryKey: ['documents', workspaceId],
    queryFn: () => apiService.api.get(`/workspaces/${workspaceId}/documents/`).then((r) => r.data),
    enabled: !!workspaceId,
  });
  const documents: any[] = Array.isArray(documentsQuery.data)
    ? documentsQuery.data
    : documentsQuery.data?.results ?? [];

  // ADAPT: if your current page fetches conversations differently, keep yours
  const conversationsQuery = useQuery({
    queryKey: ['conversations', workspaceId],
    queryFn: () =>
      apiService.api.get('/conversations/', { params: { workspace: workspaceId } }).then((r) => r.data),
    enabled: !!workspaceId,
  });
  const conversations: Conversation[] = Array.isArray(conversationsQuery.data)
    ? conversationsQuery.data
    : conversationsQuery.data?.results ?? [];

  const openEdit = () => {
    if (!workspace) return;
    setName(workspace.name);
    setDescription(workspace.description ?? '');
    setShowEdit(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setSaving(true);
    apiService.updateWorkspace(workspaceId, { name, description })
      .then((res) => {
        queryClient.setQueryData(['workspace', workspaceId], res.data);
        queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        setShowEdit(false);
      })
      .catch(() => alert('Could not update the workspace. Please try again.'))
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!workspace) return;
    const ok = window.confirm(
      `Delete "${workspace.name}"? Its documents and conversations will also be removed. This cannot be undone.`
    );
    if (!ok) return;
    setDeleting(true);
    apiService.deleteWorkspace(workspaceId)
      .then(() => {
        queryClient.invalidateQueries();
        navigate('/workspaces');
      })
      .catch(() => alert('Could not delete the workspace. Please try again.'))
      .finally(() => setDeleting(false));
  };

  // ADAPT: match the payload your current "New Chat" button sends
  const handleNewChat = () => {
    if (!workspaceId) return;
    setCreating(true);
    apiService.api.post('/conversations/', { workspace: workspaceId, title: 'New Chat' })
      .then((res) => {
        queryClient.invalidateQueries();
        navigate(`/conversations/${res.data.id}`);
      })
      .catch(() => alert('Could not create a new chat. Please try again.'))
      .finally(() => setCreating(false));
  };

  const handleDeleteDocument = (documentId: number) => {
    apiService.deleteDocument(documentId)
      .then(() => queryClient.invalidateQueries())
      .catch((error: any) => alert(`Delete failed: ${error.response?.status}`));
  };

  return (
    <div className="flex h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Conversations panel — blue = chat zone */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-blue-100 bg-blue-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-blue-100 px-4 py-4 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Conversations
          </p>
          <button
            onClick={handleNewChat}
            disabled={creating}
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {creating ? 'Creating...' : '+ New Chat'}
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          {conversations.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No chats yet. Start one above.
            </p>
          )}
          <div className="space-y-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/conversations/${c.id}`)}
                className="w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-blue-100 dark:hover:bg-slate-800"
              >
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                  {c.title || 'New Chat'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(c.created_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main content — dimmed documents zone */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {workspace?.name ?? (workspaceQuery.isLoading ? 'Loading...' : 'Workspace')}
              </h1>
              {workspace?.description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{workspace.description}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {documents.length} document{documents.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openEdit}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !workspace}
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DocumentList documents={documents} onDelete={handleDeleteDocument} />
            </div>
            <div>
              <DocumentUpload workspaceId={workspaceId} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setShowEdit(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit workspace</h2>
            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClasses} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClasses} resize-none`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}