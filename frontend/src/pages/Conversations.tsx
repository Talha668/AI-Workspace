import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  workspace?: number;
  last_message?: { text: string; role: string; created_at: string } | null;
}

function formatRelativeTime(iso?: string) {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Conversations() {
  const navigate = useNavigate();
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res: any = await apiService.getConversations();
      return Array.isArray(res) ? res : res.data;
    },
  });

  const lastActivity = (c: Conversation) =>
    new Date(c.last_message?.created_at ?? c.created_at ?? 0).getTime() || 0;
  const sorted = [...conversations].sort((a, b) => lastActivity(b) - lastActivity(a));

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Conversations</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {sorted.length} conversations across all workspaces
      </p>

      {isLoading ? (
        <p className="mt-10 text-center text-slate-500 dark:text-slate-400">Loading…</p>
      ) : sorted.length === 0 ? (
        <div className="mt-10 rounded-xl border-2 border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            No conversations yet. Open a workspace and click "+ New Chat" to start asking questions about your documents.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl bg-white shadow ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          {sorted.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/conversations/${c.id}`)}
              className="flex w-full items-center gap-4 border-b border-slate-100 px-5 py-4 text-left transition last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10">
                <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 21l1.9-3.6A7.92 7.92 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {c.title || 'Untitled chat'}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {c.last_message
                    ? `${c.last_message.role === 'user' ? 'You' : 'AI'}: ${c.last_message.text}`
                    : 'No messages yet'}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {formatRelativeTime(c.last_message?.created_at ?? c.created_at)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}