import React from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../hooks/useWorkspaces';
import { useDocuments } from '../hooks/useDocuments';
import DocumentUpload from '../components/documents/DocumentUpload';
import DocumentList from '../components/documents/DocumentList';

const WorkspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const workspaceId = parseInt(id || '0');
  const { data: workspace, isLoading } = useWorkspace(workspaceId);
  const { deleteDocument } = useDocuments(workspaceId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!workspace) {
    return <div>Workspace not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{workspace.name}</h1>
        <p className="mt-1 text-sm text-gray-500">{workspace.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Documents</h2>
          <DocumentList
            documents={workspace.documents}
            onDelete={(docId) => deleteDocument.mutate(docId)}
          />
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h2>
          <DocumentUpload workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDetail;