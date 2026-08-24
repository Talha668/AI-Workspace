import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import DocumentUpload from '../components/documents/DocumentUpload';
import DocumentList from '../components/documents/DocumentList';
import ChatBar from '../components/ai/ChatBar';


const WorkspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const workspaceId = parseInt(id || '0');
  const queryClient = useQueryClient();

  // 1. Fetch real workspace data
  const { data: workspace, isLoading: wsLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => apiService.getWorkspace(workspaceId),
    enabled: !!workspaceId,
  });

  // 2. Fetch real documents for this workspace
  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['workspace-documents', workspaceId],
    // Note: based on your views.py, you have a custom action for this
    queryFn: async () => {
      const response = await apiService.api.get(`/workspaces/${workspaceId}/documents/`);
      return response.data.results || response.data;
    },
    enabled: !!workspaceId,
  });

  const documents = docsData || [];

  // 3. Delete Document Mutation
  const deleteMutation = useMutation({
    mutationFn: (docId: number) => apiService.deleteDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-documents', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] }); // Update document count
    }
  });

  if (wsLoading || docsLoading) return <div className="p-6 text-gray-500">Loading workspace...</div>;
  if (!workspace) return <div className="p-6 text-red-500">Workspace not found.</div>;

  return (
    <div className="flex flex-col h-full -m-6">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{workspace.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{workspace.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Passing real documents to your component */}
            <DocumentList documents={documents} onDelete={(docId) => deleteMutation.mutate(docId)} />
          </div>
          <div className="space-y-6">
            <DocumentUpload workspaceId={workspaceId} />
          </div>
        </div>
      </div>
      <ChatBar workspaceId={workspaceId} />
    </div>
  );
};

export default WorkspaceDetail;