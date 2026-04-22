import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SearchResult, CustomSource } from './types';
import { SparkAI_Search } from './lib/search';
import { generateAnswer } from './lib/reasoning';
import { ChatInput } from './components/ChatInput';
import { MessageItem } from './components/MessageItem';
import { SourceManager } from './components/SourceManager';
import { Sparkles, History, Search as SearchIcon, Cpu, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [customSources, setCustomSources] = useState<CustomSource[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
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
      setIsAtBottom(isBottom);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check if Puter is loaded, if not, wait
    const checkPuter = setInterval(() => {
      if ((window as any).puter) {
        setStatus(null);
        clearInterval(checkPuter);
      } else {
        setStatus("Waiting for Spark Engine...");
      }
    }, 500);
    return () => clearInterval(checkPuter);
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom('auto');
    }
  }, [messages, status]);

  const handleSend = async (query: string) => {
    if (!(window as any).puter) {
      alert("Spark AI is still initializing. Please wait a moment.");
      return;
    }
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStatus("Initiating Spark Pipeline...");

    try {
      // 1. Staged Search Phase
      const { sources, context, summary, media, queries: expandedQueries } = await SparkAI_Search(query, customSources, (stage) => {
        setStatus(stage);
      });
      
      const referenceCount = sources.filter(s => s.category === 'Reference').length;
      const webCount = sources.filter(s => s.category === 'Web').length;
      
      setStatus(`Refining ${referenceCount} Reference & ${webCount} Web insights...`);

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
      setStatus("Reasoning...");

      // 3. Reasoning Phase (Puter/Vayu)
      await generateAnswer(query, context, messages, ({ content, thought, status: assistantStatus }) => {
        setMessages((prev) => 
          prev.map((msg) => {
            if (msg.id === assistantMessage.id) {
              const updatedThoughts = thought 
                ? [...(msg.thoughts || []), thought] 
                : msg.thoughts;
              return { 
                ...msg, 
                content: content !== undefined ? content : msg.content,
                thoughts: updatedThoughts,
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
        content: `Error: ${error.message || "Something went wrong during the search process."}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStatus(null);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col w-full overflow-x-hidden">
      {/* Header */}
      <header className="nav-blur px-4 sm:px-8 py-4 sm:py-5 flex justify-between items-center group">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="p-2 bg-gradient-to-tr from-brand to-brand-dark rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:rotate-12 transition-transform duration-300">
            <Sparkles size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold font-display tracking-tight text-white leading-none mb-1">Spark AI</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Network Active</span>
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
            <button className="p-2 sm:p-2.5 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white border border-transparent hover:border-white/10">
              <History size={18} className="sm:w-5 sm:h-5" />
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
                 <ChatInput onSend={handleSend} isLoading={isLoading} isHome={true} />
              </div>

              {/* Perplexity style suggestions below the search box */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full max-w-2xl">
                 {[
                   { label: 'Future of Nuclear Fusion', icon: Sparkles },
                   { label: 'James Webb Space Discovery', icon: SearchIcon },
                   { label: 'History of Renaissance Art', icon: Cpu },
                   { label: 'Benefits of Deep Learning', icon: History }
                 ].map(({ label, icon: Icon }) => (
                   <button 
                     key={label}
                     onClick={() => handleSend(label)}
                     className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand/30 rounded-full py-2 px-4 transition-all text-slate-300 text-xs sm:text-sm"
                   >
                     <Icon size={14} className="text-slate-500" />
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
      {messages.length > 0 && <ChatInput onSend={handleSend} isLoading={isLoading} isHome={false} />}
    </div>
  );
}
