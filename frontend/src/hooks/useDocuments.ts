import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

export const useDocuments = (workspaceId: number) => {
  const queryClient = useQueryClient();

  const uploadDocumentMutation = useMutation({
    mutationFn: (file: File) => apiService.uploadDocument(workspaceId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: number) => apiService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
    },
  });

  return {
    uploadDocument: uploadDocumentMutation,
    deleteDocument: deleteDocumentMutation,
  };
};