import React, { useState } from 'react';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

interface ChatBarProps {
  workspaceId: number;
}

const ChatBar: React.FC<ChatBarProps> = ({ workspaceId }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: 'user' as const, text: query };
    setMessages([...messages, userMessage]);
    setQuery('');
    setIsLoading(true);

    // TODO: Connect to your Daphne WebSocket for Gemini
    setTimeout(() => {
      const aiMessage = { role: 'ai' as const, text: `Gemini response for: "${userMessage.text}"` };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const renderMessages = () => {
    return messages.map((msg, i) => {
      const isUser = msg.role === 'user';
      const bgClass = isUser ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800';
      const alignClass = isUser ? 'justify-end' : 'justify-start';
      
      return (
        <div key={i} className={`flex ${alignClass}`}>
          <div className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${bgClass}`}>
            {msg.text}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-white border-t border-gray-200">
      {messages.length > 0 && (
        <div className="max-h-48 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {renderMessages()}
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
};

export default ChatBar;