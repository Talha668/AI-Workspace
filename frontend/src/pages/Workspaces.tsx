import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';


const Workspaces: React.FC = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });

  // 1. Fetch real workspaces
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => apiService.getWorkspaces(),
  });

  // Extract the array from Django's pagination object
  const workspaces = data?.results || [];

  // 2. Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => apiService.createWorkspace(data),
    onSuccess: () => {
      setShowModal(false);
      setNewWorkspace({ name: '', description: '' });
    },
    onError: (error: any) => {
      console.error("🔥 Workspace Create Error:", error.response?.data);
      alert("Failed to create workspace. Are you logged in?");
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newWorkspace);
  };

  // Loading state
  if (isLoading) return <div className="max-w-5xl mx-auto px-6 py-8 text-center text-gray-500">Loading workspaces...</div>;
  
  // Error state (Usually means user is not logged in / 401 Unauthorized)
  if (isError) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center">
        <p className="text-red-500 mb-4">Failed to load workspaces. Make sure you are logged in.</p>
        <p className="text-sm text-gray-400">Error: {(error as any)?.response?.data?.detail || 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">All Workspaces</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          New Workspace
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create New Workspace</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. AI Research"
                value={newWorkspace.name}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="What is this workspace for?"
                value={newWorkspace.description}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed">
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {workspaces.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No workspaces yet. Click "New Workspace" to get started!
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workspaces.map((ws: any) => (
                <tr 
                  key={ws.id} 
                  onClick={() => navigate(`/workspaces/${ws.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">{ws.name}</div>
                    <div className="text-sm text-gray-500">{ws.description || 'No description'}</div>
                  </td>
                  {/* Safely check if documents_count exists, fallback to 0 */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ws.documents_count ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ws.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className="text-blue-600 hover:text-blue-900">Open</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Workspaces;