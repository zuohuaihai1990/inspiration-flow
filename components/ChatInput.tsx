import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (text: string) => void;
  isProcessing: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isProcessing }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-10">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 blur"></div>
        <div className="relative flex items-center bg-black rounded-full border border-white/10 overflow-hidden">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Input your inspiration..."
            disabled={isProcessing}
            className="w-full bg-transparent text-white px-6 py-4 focus:outline-none text-lg placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="px-6 py-2 text-white hover:text-pink-400 transition-colors disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <Send />}
          </button>
        </div>
      </form>
    </div>
  );
};
