import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api'; // Adjust path if needed


const Conversations: React.FC = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();
  
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // 1. Fetch conversations for this specific workspace
  const { data, isLoading } = useQuery({
    queryKey: ['conversations', workspaceId],
    queryFn: () => apiService.getConversations(Number(workspaceId)),
    enabled: !!workspaceId, // Don't run if we don't have a workspace ID
  });

  // Extract array from Django pagination
  const conversations = data?.results || [];

  // 2. Create new conversation mutation
  const createMutation = useMutation({
    mutationFn: (title: string) =>
      apiService.createConversation({ title, workspace: Number(workspaceId) }),
    onSuccess: () => {
      setShowModal(false);
      setNewTitle('');
      queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] });
    },
    onError: (error: any) => {
      console.error("Failed to create conversation:", error.response?.data);
      alert("Failed to create conversation.");
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      createMutation.mutate(newTitle.trim());
    }
  };

  if (isLoading) return <div className="max-w-5xl mx-auto px-6 py-8 text-gray-500">Loading conversations...</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Conversations</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Dynamic Empty State or List */}
      {conversations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations yet</h3>
          <p className="mt-1 text-sm text-gray-500">Start a chat with your AI workspace to see conversation history here.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden divide-y divide-gray-200">
          {conversations.map((convo: any) => (
            <div 
              key={convo.id} 
              onClick={() => navigate(`/workspaces/${workspaceId}/conversations/${convo.id}`)}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">{convo.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Created {new Date(convo.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className="text-blue-600 text-sm font-medium hover:text-blue-900">Open</span>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">New Conversation</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                autoFocus
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Analyze Q3 Report"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Conversations;