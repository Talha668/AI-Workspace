// pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Get the token exactly how useAuth.ts stores it
  const token = localStorage.getItem('access_token'); 
  
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch workspaces from Django
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('http://localhost:8000/api/workspaces/', {
          headers: {
            'Authorization': `Bearer ${token}`, // <-- AUTH HEADER
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data.results || data); 
        } else if (response.status === 401) {
          // Token expired, force logout
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, [token, navigate]);

  // Create workspace in Django
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/workspaces/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // <-- AUTH HEADER
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description })
      });

      if (response.ok) {
        const newWorkspace = await response.json();
        setWorkspaces([...workspaces, newWorkspace]);
        setShowCreateModal(false);
        setName('');
        setDescription('');
      }
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  if (isLoading) {
    return <div className="max-w-5xl mx-auto px-12 py-8 text-gray-500">Loading workspaces...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-12 py-8">
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
                <span>{workspace.documents_count || 0} documents</span>
                <span className="mx-2">•</span>
                <span>{workspace.created_at?.split('T')[0]}</span>
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