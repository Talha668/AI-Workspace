// pages/Dashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [workspaces, setWorkspaces] = React.useState([
    {
      id: 1,
      name: 'AI Research',
      description: 'Research papers and AI documentation',
      documents_count: 12,
      created_at: '2024-01-15'
    },
    {
      id: 2,
      name: 'Project Alpha',
      description: 'Product requirements and specs',
      documents_count: 8,
      created_at: '2024-01-20'
    },
    {
      id: 3,
      name: 'Personal Notes',
      description: 'Meeting notes and ideas',
      documents_count: 5,
      created_at: '2024-01-25'
    }
  ]);

  // Mock create workspace function (just adds to local state)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newWorkspace = {
        id: workspaces.length + 1,
        name: name,
        description: description || 'New workspace',
        documents_count: 0,
        created_at: new Date().toISOString().split('T')[0]
      };
      
      setWorkspaces([...workspaces, newWorkspace]);
      setShowCreateModal(false);
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <button
          onClick={() => setShowCreateModal(true)} 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          New Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces?.map((workspace: any) => (
          <div
            key={workspace.id}
            onClick={() => navigate(`/workspaces/${workspace.id}`)}
            className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">{workspace.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{workspace.description}</p>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <span>{workspace.documents_count} documents</span>
                <span className="mx-2">•</span>
                <span>{workspace.created_at}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Create New Workspace</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;