import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Workspace } from '../types';

export const useWorkspaces = () => {
  const queryClient = useQueryClient();

  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => apiService.getWorkspaces(),
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      apiService.createWorkspace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  return {
    workspaces: workspacesQuery.data,
    isLoading: workspacesQuery.isLoading,
    error: workspacesQuery.error,
    createWorkspace: createWorkspaceMutation,
    deleteWorkspace: deleteWorkspaceMutation,
  };
};

export const useWorkspace = (id: number) => {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: () => apiService.getWorkspace(id),
    enabled: !!id,
  });
};