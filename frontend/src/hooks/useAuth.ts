import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';


export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiService.login(email, password),
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      navigate('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: any) => apiService.register(userData),
    onSuccess: () => {
      navigate('/login');
    },
    // Temporary print statement
    onError: (error: any) => {
      console.error("❌ Django Registration Error:", error.response?.data);
      console.error("❌ Status Code:", error.response?.Status);
    }
  });

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    queryClient.clear();
    navigate('/login');
  };

  return {
    login: loginMutation,
    register: registerMutation,
    logout,
    isAuthenticated: !!localStorage.getItem('access_token'),
  };
};