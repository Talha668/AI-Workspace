import React from 'react';
import { useNavigate } from 'react-router-dom';

// Using your dummy data pattern from the Dashboard
const Workspaces: React.FC = () => {
  const navigate = useNavigate();
  const workspaces = [
    { id: 1, name: 'AI Research', description: 'Research papers and AI documentation', documents_count: 12, created_at: '2024-01-15' },
    { id: 2, name: 'Project Alpha', description: 'Product requirements and specs', documents_count: 8, created_at: '2024-01-20' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">All Workspaces</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          New Workspace
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
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
            {workspaces.map((ws) => (
              <tr 
                key={ws.id} 
                onClick={() => navigate(`/workspaces/${ws.id}`)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-blue-600">{ws.name}</div>
                  <div className="text-sm text-gray-500">{ws.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ws.documents_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ws.created_at}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <span className="text-blue-600 hover:text-blue-900">Open</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Workspaces;