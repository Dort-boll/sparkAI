import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (query: string) => void;
  isLoading: boolean;
  isHome?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, isHome }) => {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim() && !isLoading) {
      onSend(query.trim());
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query]);

  const innerForm = (
    <>
      <div className="relative group w-full px-3 sm:px-0">
        {/* Advanced Google-Style Animated Glow Border */}
        <div className={`absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-[32px] blur-lg transition duration-1000 group-hover:duration-200 animate-pulse ${isHome ? 'opacity-20 group-focus-within:opacity-60' : 'opacity-30 group-focus-within:opacity-80'}`}></div>
        
        <form 
          onSubmit={handleSubmit}
          className="glass-card !bg-[#0f172a]/90 !p-1.5 sm:!p-2 flex items-end gap-2 shadow-xl relative w-full !rounded-[32px] border border-white/5"
        >
          <div className="flex-1 relative pl-3 sm:pl-4">
            <textarea
              ref={textareaRef}
              rows={1}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask spark anything..."
              className="w-full min-h-[52px] sm:min-h-[56px] leading-[24px] bg-transparent border-0 outline-none focus:outline-none focus:ring-0 shadow-none resize-none py-3.5 sm:py-4 text-sm sm:text-base text-slate-100 placeholder:text-slate-400 max-h-32 sm:max-h-48 scrollbar-none [&::-webkit-scrollbar]:hidden relative z-10 block"
            />
          </div>
          
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className={`
              p-3.5 sm:p-4 rounded-full transition-all duration-300 flex items-center justify-center mb-1 mr-1
              ${query.trim() && !isLoading 
                ? 'bg-brand text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95' 
                : 'bg-white/5 text-slate-600 cursor-not-allowed'}
            `}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-brand rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
      
      <div className={`flex justify-center gap-4 sm:gap-8 mt-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] ${isHome ? 'opacity-80' : 'opacity-60'}`}>
        <div className="flex items-center gap-1.5">
          <Search size={12} /> <span className="hidden xs:inline">Multi-Source</span><span className="xs:hidden">Search</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} /> <span className="hidden xs:inline">Reasoning</span><span className="xs:hidden">AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]" /> Spark AI
        </div>
      </div>
    </>
  );

  if (isHome) {
    return (
      <div className="w-full max-w-2xl mx-auto relative z-20">
        {innerForm}
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-2 sm:px-4 pb-6 sm:pb-8 pt-10 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent" />
      <div className="relative w-full max-w-3xl mx-auto pointer-events-auto">
        {innerForm}
      </div>
    </div>
  );
}
