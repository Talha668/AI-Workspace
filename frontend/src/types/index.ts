export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  created_at: string;
}

export interface Workspace {
  id: number;
  name: string;
  description: string;
  owner_email: string;
  documents_count: number;
  documents: Document[];
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  title: string;
  file: string;
  file_type: 'pdf' | 'docx' | 'txt';
  file_size: number;
  content_text: string;
  is_processed: boolean;
  uploaded_by_email: string;
  created_at: string;
  file_url: string;
}

export interface Conversation {
  id: number;
  title: string;
  workspace: number;
  created_by_email: string;
  messages: Message[];
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  content: string;
  message_type: 'user' | 'assistant';
  metadata: Record<string, any>;
  created_at: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}