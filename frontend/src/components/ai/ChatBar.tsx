import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export default function ChatBar({ conversationId }: { conversationId: number }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);

  // Auto-scroll anchor
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMutation = useMutation({
    mutationFn: (content: string) => apiService.sendMessage(conversationId, content),
    onSuccess: (data) => {
      const aiResponseText = data?.ai_message?.content || 'AI responded successfully.';
      setMessages((prev) => [...prev, { role: 'ai', text: aiResponseText }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Error: Failed to get response from AI.' }]);
    },
  });

  // Scrolls the panel to the latest message whenever anything changes
  // (new message sent, AI response arrives, "thinking..." indicator appears)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, sendMutation.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || sendMutation.isPending) return;

    const userText = query;
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setQuery('');
    sendMutation.mutate(userText);
  };

  return (
    <div className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {messages.length > 0 && (
        <div className="max-h-48 space-y-3 overflow-y-auto border-b border-slate-200/70 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {sendMutation.isPending && (
            <div className="flex justify-start">
              <div className="animate-pulse rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                AI is thinking...
              </div>
            </div>
          )}
          {/* invisible anchor — this is what auto-scrolls */}
          <div ref={messagesEndRef} />
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-3 p-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask AI about your documents..."
          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          disabled={sendMutation.isPending}
        />
        <button
          type="submit"
          disabled={sendMutation.isPending || !query.trim()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}