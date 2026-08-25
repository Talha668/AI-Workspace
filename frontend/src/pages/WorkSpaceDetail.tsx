import React, { useState } from 'react';
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
  
  // State to track which con conversationsData?.results ||versation is active
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  // 1. Fetch workspace data
  const { data: workspace, isLoading: wsLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => apiService.getWorkspace(workspaceId),
    enabled: !!workspaceId,
  });

  // 2. Fetch documents for this workspace
  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['workspace-documents', workspaceId],
    queryFn: async () => {
      const response = await apiService.api.get(`/workspaces/${workspaceId}/documents/`);
      return response.data.results || response.data;
    },
    enabled: !!workspaceId,
  });

  // 3. Fetch Conversations for this workspace
  const { data: conversationsData, isLoading: convLoading } = useQuery({
    queryKey: ['conversations', workspaceId],
    queryFn: () => apiService.getConversations(workspaceId),
    enabled: !!workspaceId,
  });

  const documents = docsData || [];
  const conversations = conversationsData?.results || conversationsData || [];

  // 4. Mutation to create a new conversation
  const createChatMutation = useMutation({
    mutationFn: () => apiService.createConversation({ 
      title: `New Chat - ${new Date().toLocaleTimeString()}`, 
      workspace: workspaceId 
    }),
    onSuccess: (data) => {
      setActiveConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] });
    }
  });

  // 5. Delete Document Mutation
  const deleteMutation = useMutation({
    mutationFn: (docId: number) => apiService.deleteDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-documents', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
    }
  });

  if (wsLoading || docsLoading) return <div className="p-6 text-gray-500">Loading workspace...</div>;
  if (!workspace) return <div className="p-6 text-red-500">Workspace not found.</div>;

  return (
    <div className="flex h-screen -m-6">
      
      {/* LEFT SIDEBAR: Conversations List */}
      <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button 
            onClick={() => createChatMutation.mutate()} 
            disabled={createChatMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:bg-gray-400"
          >
            + New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {convLoading ? (
            <p className="text-xs text-gray-400 p-2">Loading chats...</p>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-gray-400 p-2">No chats yet. Create one!</p>
          ) : (
            conversations.map((conv: any) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors truncate ${
                  activeConversationId === conv.id 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {conv.title}
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT MAIN AREA: Documents & Chat */}
      <div className="flex-1 flex flex-col bg-white">
        
        {/* Top Section: Workspace Info & Documents */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{workspace.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{workspace.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <DocumentList documents={documents} onDelete={(docId) => deleteMutation.mutate(docId)} />
            </div>
            <div className="space-y-6">
              <DocumentUpload workspaceId={workspaceId} />
            </div>
          </div>
        </div>

        {/* Bottom Section: Chat Bar */}
        {activeConversationId ? (
          <ChatBar conversationId={activeConversationId} />
        ) : (
          <div className="p-6 text-center text-gray-400 bg-gray-50 border-t border-gray-200">
            <p>Select an existing chat or click "+ New Chat" to start asking questions about your documents.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default WorkspaceDetail;