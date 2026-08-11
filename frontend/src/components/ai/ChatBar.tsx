import React, { useState } from 'react';

export default function ChatBar({ workspaceId }: { workspaceId: number }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, text: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setMessages([...messages, { role: 'user', text: userText }]);
    setQuery('');
    setIsLoading(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: "Gemini response for: " + userText }]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-white border-t border-gray-200">
      {messages.length > 0 && (
        <div className="max-h-48 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? "flex justify-end" : "flex justify-start"}>
              <div className={msg.role === 'user' ? "max-w-[70%] px-4 py-2 rounded-lg text-sm bg-blue-600 text-white" : "max-w-[70%] px-4 py-2 rounded-lg text-sm bg-white border border-gray-200 text-gray-800"}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-500 animate-pulse">
                Gemini is thinking...
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSend} className="p-4 flex items-center space-x-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask AI about your documents..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={isLoading || !query.trim()}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}