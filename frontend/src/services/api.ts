import axios, { type AxiosInstance } from 'axios'

const API_BASE_URL = import.meta.env.Vite_API_URL || 'http://localhost:8000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && originalRequest) {
          const refreshToken = localStorage.getItem('refresh_token');
          
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                refresh: refreshToken,
              });
              
              const { access } = response.data;
              localStorage.setItem('access_token', access);
              
              originalRequest.headers.Authorization = `Bearer ${access}`;
              return this.api(originalRequest);
            } catch (refreshError) {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
            }
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login/', { email, password });
    return response.data;
  }

  async register(userData: {
    email: string;
    username: string;
    password: string;
    password2: string;
    first_name: string;
    last_name: string;
  }) {
    const response = await this.api.post('/auth/register/', userData);
    return response.data;
  }

  async getProfile() {
    const response = await this.api.get('/auth/profile/');
    return response.data;
  }

  // Workspace endpoints
  async getWorkspaces() {
    const response = await this.api.get('/workspaces/');
    return response.data;
  }

  async createWorkspace(data: { name: string; description: string }) {
    const response = await this.api.post('/workspaces/', data);
    return response.data;
  }

  async getWorkspace(id: number) {
    const response = await this.api.get(`/workspaces/${id}/`);
    return response.data;
  }

  async deleteWorkspace(id: number) {
    const response = await this.api.delete(`/workspaces/${id}/`);
    return response.data;
  }

  // Document endpoints
  async uploadDocument(workspaceId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.api.post(
      `/workspaces/${workspaceId}/upload_document/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async deleteDocument(documentId: number) {
    const response = await this.api.delete(`/documents/${documentId}/`);
    return response.data;
  }

  // Conversation endpoints
  async getConversations(workspaceId: number) {
    const response = await this.api.get(`/conversations/?workspace=${workspaceId}`);
    return response.data;
  }

  async createConversation(data: { title: string; workspace: number }) {
    const response = await this.api.post('/conversations/', data);
    return response.data;
  }

  async getConversation(id: number) {
    const response = await this.api.get(`/conversations/${id}/`);
    return response.data;
  }

  async sendMessage(conversationId: number, content: string) {
    const response = await this.api.post(`/conversations/${conversationId}/send_message/`, {
      content,
      message_type: 'user',
    });
    return response.data;
  }

  async queryAI(data: {quer: string; workspace_id: number }) {
    const response = await this.api.post('/ai/query/', data);
    return response.data;
  }
}

export const apiService = new ApiService();