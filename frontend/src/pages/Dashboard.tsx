import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });

  // Fetch workspaces using apiService
  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => apiService.getWorkspaces(),
  });

  const workspaces = data?.results || [];

  // Create workspace using apiService
  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => apiService.createWorkspace(data),
    onSuccess: () => {
      setShowCreateModal(false);
      setNewWorkspace({ name: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] }); // Refresh list
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newWorkspace);
  };

  if (isLoading) {
    return <div className="max-w-5xl mx-auto px-12 py-8 text-gray-500">Loading workspaces...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-12 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          New Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace: any) => (
          <div key={workspace.id} onClick={() => navigate(`/workspaces/${workspace.id}`)} className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">{workspace.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{workspace.description || 'No description'}</p>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <span>{workspace.documents_count ?? 0} documents</span>
                <span className="mx-2">•</span>
                <span>{new Date(workspace.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Create New Workspace</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input type="text" required className="w-full border border-gray-300 rounded-md p-2" value={newWorkspace.name} onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea className="w-full border border-gray-300 rounded-md p-2" rows={3} value={newWorkspace.description} onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })} />
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-400">{createMutation.isPending ? 'Creating...' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;