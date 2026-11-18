import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

interface Conversation {
  id: number;
  title: string;
  created_at: string;
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await apiService.getConversations();
        const list = Array.isArray(res) ? res : (res?.data ?? res?.results ?? []);
        if (!cancelled) setConversations(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load conversations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Conversations</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {loading ? 'Loading…' : `${sorted.length} conversations across all workspaces`}
      </p>

      {loading ? (
        <p className="mt-10 text-center text-slate-500 dark:text-slate-400">Loading conversations…</p>
      ) : error ? (
        <div className="mt-10 rounded-xl border border-red-300 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <p className="mt-2 text-xs text-red-400 dark:text-red-500">
            If this says 404, your apiService has no getConversations() method — paste your
            services/api.ts and the list endpoint will be wired to the right URL.
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="mt-10 rounded-xl border-2 border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            No conversations yet. Open a workspace and click "+ New Chat" to start asking questions
            about your documents.
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 21l1.9-3.6A7.92 7.92 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {c.title || 'Untitled chat'}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  Created {formatRelativeTime(c.created_at)}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{formatRelativeTime(c.created_at)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}