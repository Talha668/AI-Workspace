import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useWebSocket, type ChatMessage } from '../../hooks/useWebSocket';

interface ChatInterfaceProps {
  conversationId: number;
}

function SparklesIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
      />
    </svg>
  );
}

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [awaitingReply, setAwaitingReply] = useState(false);
  const { messages, isConnected, sendMessage } = useWebSocket(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, awaitingReply]);

  // Stop the "thinking" indicator once the assistant replies
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.message_type === 'assistant') setAwaitingReply(false);
  }, [messages]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || !isConnected) return;
    sendMessage(content);
    setInput('');
    setAwaitingReply(true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const renderBubble = (message: ChatMessage, index: number) => (
    <div
      key={message.id ?? index}
      className={`flex items-end gap-2 ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message.message_type !== 'user' && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
          <SparklesIcon />
        </div>
      )}
      <div
        className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          message.message_type === 'user'
            ? 'rounded-br-md bg-indigo-600 text-white'
            : 'rounded-bl-md bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100'
        }`}
      >
        <p>{message.content}</p>
        {message.metadata?.sources && message.metadata.sources.length > 0 && (
          <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sources</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {message.metadata.sources.map((source, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                >
                  {source.document_title ?? 'Document'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-blue-50 dark:bg-slate-900">
      {/* Connection status */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-blue-100 px-6 dark:border-slate-800">
        <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {isConnected ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && !awaitingReply && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
              Ask about your documents
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Answers are generated from the files uploaded to this workspace.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map(renderBubble)}

          {awaitingReply && (
            <div className="flex items-end gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                <SparklesIcon />
              </div>
              <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 dark:bg-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-blue-100 p-4 dark:border-slate-800">
        <div className="flex items-end gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? 'Ask about your documents...' : 'Waiting for connection...'}
            disabled={!isConnected}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
            className="inline-flex h-[42px] w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0 6.75 6.75M12 4.5 5.25 11.25" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
          Answers are generated from your uploaded documents and may be inaccurate.
        </p>
      </div>
    </div>
  );
}