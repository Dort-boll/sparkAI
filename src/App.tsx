import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SearchResult, CustomSource, RAGSettings } from './types';
import { SparkAI_Search } from './lib/search';
import { generateAnswer } from './lib/reasoning';
import { ChatInput } from './components/ChatInput';
import { MessageItem } from './components/MessageItem';
import { SourceManager } from './components/SourceManager';
import { Sparkles, History, Search as SearchIcon, Cpu, ArrowDown, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [customSources, setCustomSources] = useState<CustomSource[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAuthed, setIsAuthed] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDeepMode, setIsDeepMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addCustomSource = (source: Omit<CustomSource, 'id'>) => {
    setCustomSources(prev => [...prev, { ...source, id: Date.now().toString() }]);
  };

  const removeCustomSource = (id: string) => {
    setCustomSources(prev => prev.filter(s => s.id !== id));
  };

  // Scroll visibility handler
  useEffect(() => {
    const handleScroll = () => {
      const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 150;
      const scrolled = window.scrollY > 10;
      setIsAtBottom(isBottom);
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async () => {
    setIsAuthed(true);
  };

  const handleLogout = async () => {
    setIsAuthed(false);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom('auto');
    }
  }, [messages, status]);

  const handleSend = async (query: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStatus("Initiating Spark Pipeline...");

    // Deep Mode is now always available
    const effectiveDeepMode = isDeepMode;

    try {
      // 1. Intelligence Retrieval Phase
      const { sources, context, summary, media, queries: expandedQueries } = await SparkAI_Search(
        query, 
        customSources, 
        (stage) => setStatus(stage),
        effectiveDeepMode
      );
      
      if (!sources || sources.length === 0) {
        throw new Error("No intelligence signals retrieved.");
      }
      
      setStatus(`Refining Multi-Dataset Intelligence...`);

      // 2. Initialize Assistant Message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        summary: summary || undefined,
        sources: sources,
        media: media,
        thoughts: [],
        relatedQueries: expandedQueries.filter(q => q.toLowerCase() !== query.toLowerCase()),
        status: 'thinking',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 3. Synthesis Phase
      await generateAnswer(query, context, [...messages, userMessage], ({ content, thought, status: assistantStatus }) => {
        setMessages((prev) => 
          prev.map((msg) => {
            if (msg.id === assistantMessage.id) {
              return { 
                ...msg, 
                content: content !== undefined ? content : msg.content,
                status: assistantStatus || msg.status
              };
            }
            return msg;
          })
        );
      });

    } catch (error: any) {
      console.error("Spark AI Pipeline Error:", error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `### 🚀 Spark AI Pipeline Distruption\n\n**Search Phase Collision Detected:** ${error.message || "Unknown Search Error"}\n\nThe continuous reasoning engine encountered a bottleneck while gathering signals. Please check your network or try an alternative query.`,
        timestamp: Date.now(),
        status: 'complete'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStatus(null);
    }
  };

  if (isLoading && messages.length === 0) {
    return (
       <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
         <Sparkles size={48} className="text-brand animate-pulse mb-6" />
         <div className="flex items-center gap-3">
           <Cpu size={18} className="text-brand animate-spin" />
           <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">{status || "Initializing Intelligence..."}</span>
         </div>
       </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col w-full overflow-x-hidden selection:bg-brand/30">
      {/* Header */}
      <header className={`nav-blur px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center group transition-all duration-500 ${isScrolled ? 'scrolled shadow-2xl py-2 sm:py-3 border-white/10' : 'border-white/5'}`}>
        <div className="flex items-center gap-3 cursor-pointer group/logo">
          <div className="p-2 bg-gradient-to-tr from-brand via-brand-light to-brand-dark rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover/logo:scale-110 group-hover/logo:rotate-3 transition-all duration-500">
            <Sparkles size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold font-display tracking-tight text-white leading-none mb-1 group-hover/logo:text-brand-light transition-colors">Spark AI</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)] animate-pulse" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Research Terminal</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <AnimatePresence>
            {status && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="hidden md:flex items-center gap-2.5 text-[10px] font-bold text-brand-light bg-brand/10 border border-brand/20 px-4 py-2 rounded-full shadow-lg"
              >
                <Cpu size={14} className="animate-spin duration-3000" />
                <span className="uppercase tracking-[0.1em]">{status}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2">
            <button className="p-2 sm:p-2.5 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white border border-transparent hover:border-white/10" title="History">
              <History size={18} className="sm:w-5 sm:h-5" />
            </button>
            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />
            <button className="p-2 sm:p-2.5 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white border border-transparent hover:border-white/10" title="Profile">
              <User size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col w-full relative">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center px-4 w-full min-h-[75vh]"
            >
              <div className="mb-6 relative">
                 <Sparkles size={48} className="text-brand mx-auto mb-4" />
                 <h2 className="text-4xl sm:text-5xl font-display font-medium tracking-tight text-slate-200">
                   What do you want to know?
                 </h2>
              </div>
              
              <div className="w-full relative z-20">
                 <ChatInput 
              onSend={handleSend} 
              isLoading={isLoading} 
              isHome={true} 
              isDeepMode={isDeepMode}
              setIsDeepMode={setIsDeepMode}
              isAuthed={isAuthed}
              onLogin={handleLogin}
            />
              </div>

              {/* Perplexity style suggestions below the search box */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full max-w-3xl">
                 {[
                   { label: 'Latest AI Breakthroughs', icon: Sparkles },
                   { label: 'Market Trends 2026', icon: SearchIcon },
                   { label: 'Geopolitical Updates', icon: Cpu },
                   { label: 'Physics Discoveries', icon: History }
                 ].map(({ label, icon: Icon }) => (
                   <button 
                     key={label}
                     onClick={() => handleSend(label)}
                     className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-brand/40 rounded-full py-2.5 px-5 transition-all duration-300 text-slate-300 text-xs sm:text-sm shadow-lg hover:shadow-brand/10 hover:-translate-y-0.5 group"
                   >
                     <Icon size={14} className="text-slate-500 group-hover:text-brand transition-colors" />
                     {label}
                   </button>
                 ))}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col w-full pb-48 sm:pb-56">
              {messages.map((message) => (
                <MessageItem key={message.id} message={message} onSend={handleSend} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Scroll to Bottom Arrow */}
      <AnimatePresence>
        {!isAtBottom && messages.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={() => scrollToBottom('smooth')}
            className="fixed bottom-[100px] sm:bottom-[120px] left-1/2 -translate-x-1/2 z-[60] bg-brand/20 hover:bg-brand/40 border border-brand/30 text-white p-2.5 rounded-full shadow-lg backdrop-blur-md transition-colors"
          >
            <ArrowDown size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Fixed Output Input */}
      {messages.length > 0 && (
        <ChatInput 
          onSend={handleSend} 
          isLoading={isLoading} 
          isHome={false} 
          isDeepMode={isDeepMode}
          setIsDeepMode={setIsDeepMode}
          isAuthed={isAuthed}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}
