import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import ChatBar from '../components/ai/ChatBar';

interface Conversation {
  id: number;
  title?: string;
  created_at: string;
  workspace?: number;
  workspace_id?: number;
  last_message?: { text?: string; role?: string; created_at?: string } | null;
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      />
    </svg>
  );
}

export default function ConversationPage() {
  const { conversationId } = useParams();
  const convoId = Number(conversationId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const conversationQuery = useQuery({
    queryKey: ['conversation', convoId],
    queryFn: () => apiService.api.get(`/conversations/${convoId}/`).then((r) => r.data),
    enabled: !!convoId,
  });
  const conversation = conversationQuery.data as Conversation | undefined;

  // ADAPT: field name for the workspace on your Conversation model
  const workspaceId = conversation?.workspace ?? conversation?.workspace_id;

  const workspaceQuery = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => apiService.api.get(`/workspaces/${workspaceId}/`).then((r) => r.data),
    enabled: !!workspaceId,
  });

  const conversationsQuery = useQuery({
    queryKey: ['conversations', workspaceId],
    queryFn: () =>
      apiService.api.get('/conversations/', { params: { workspace: workspaceId } }).then((r) => r.data),
    enabled: !!workspaceId,
  });
  const conversations: Conversation[] = Array.isArray(conversationsQuery.data)
    ? conversationsQuery.data
    : conversationsQuery.data?.results ?? [];

  // Most recently active chat first (needs the last_message serializer field; falls back to created_at)
  const sorted = [...conversations].sort((a, b) => {
    const ta = new Date(a.last_message?.created_at ?? a.created_at).getTime();
    const tb = new Date(b.last_message?.created_at ?? b.created_at).getTime();
    return tb - ta;
  });

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

  const saveRename = () => {
    const target = sorted.find((c) => c.id === renamingId);
    const trimmed = renameValue.trim();
    setRenamingId(null);
    if (!target || !trimmed || trimmed === (target.title || 'New Chat')) return;
    apiService.updateConversation(target.id, { title: trimmed })
      .then(() => queryClient.invalidateQueries())
      .catch(() => alert('Could not rename the chat.'));
  };

  const handleDeleteConversation = (c: Conversation) => {
    const ok = window.confirm(`Delete "${c.title || 'New Chat'}"? Its messages will be removed.`);
    if (!ok) return;
    apiService.deleteConversation(c.id)
      .then(() => {
        queryClient.invalidateQueries();
        if (c.id === convoId) navigate('/conversations');
      })
      .catch(() => alert('Could not delete the chat.'));
  };

  if (conversationQuery.isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chat...</div>;
  }

  if (conversationQuery.isError || !conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">This conversation could not be loaded.</p>
        <Link to="/conversations" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Back to conversations
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* ChatGPT-style chat switcher */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-blue-100 bg-blue-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-blue-100 px-4 py-4 dark:border-slate-800">
          <Link
            to={`/workspaces/${workspaceId}`}
            className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            &larr; Back to workspace
          </Link>
          <button
            onClick={handleNewChat}
            disabled={creating}
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {creating ? 'Creating...' : '+ New Chat'}
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          {sorted.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No chats yet. Start one above.
            </p>
          )}
          <div className="space-y-1">
            {sorted.map((c) => {
              const active = c.id === convoId;
              return (
                <div
                  key={c.id}
                  className={`group relative rounded-lg ${active ? 'bg-indigo-600 shadow-sm' : ''}`}
                >
                  {renamingId === c.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={saveRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveRename();
                        }
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className="w-full rounded-lg border border-indigo-400 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  ) : (
                    <button
                      onClick={() => navigate(`/conversations/${c.id}`)}
                      className={`w-full px-3 py-2 text-left ${active ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{c.title || 'New Chat'}</p>
                        <span
                          className={`shrink-0 text-[10px] group-hover:hidden ${
                            active ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {formatRelativeTime(c.last_message?.created_at ?? c.created_at)}
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 truncate text-xs ${
                          active ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {c.last_message?.text
                          ? `${c.last_message.role === 'user' ? 'You: ' : ''}${c.last_message.text}`
                          : 'No messages yet'}
                      </p>
                    </button>
                  )}

                  {/* hover actions: rename + delete */}
                  {renamingId !== c.id && (
                    <div
                      className={`absolute right-2 top-2 hidden items-center gap-1 group-hover:flex ${
                        active ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <button
                        title="Rename"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameValue(c.title || '');
                          setRenamingId(c.id);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(c);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Chat area */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-blue-100 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {conversation.title || 'New Chat'}
          </h1>
          {workspaceId && (
            <Link
              to={`/workspaces/${workspaceId}`}
              className="shrink-0 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {workspaceQuery.data?.name ?? 'Workspace'}
            </Link>
          )}
        </header>
        <div className="min-h-0 flex-1">
          {/* SWAP POINT: this becomes <ChatInterface .../> once I see your WebSocket code */}
          <ChatBar key={convoId} conversationId={convoId} />
        </div>
      </section>
    </div>
  );
}