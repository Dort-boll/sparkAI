import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SearchResult, CustomSource } from './types';
import { SparkAI_Search } from './lib/search';
import { generateAnswer } from './lib/reasoning';
import { ChatInput } from './components/ChatInput';
import { MessageItem } from './components/MessageItem';
import { SourceManager } from './components/SourceManager';
import { Sparkles, History, Search as SearchIcon, Cpu, ArrowDown, User, LogOut, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [customSources, setCustomSources] = useState<CustomSource[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
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
    const checkPuter = setInterval(async () => {
      const puter = (window as any).puter;
      if (puter) {
        clearInterval(checkPuter);
        try {
          const signedIn = await puter.auth.isSignedIn();
          if (signedIn) {
            const currentUser = await puter.auth.getUser();
            setUser(currentUser);
            setIsAuthed(true);
          }
        } catch (e) {
          console.error("Auth check failed:", e);
        }
        setIsReady(true);
        setStatus(null);
      } else {
        setStatus("Waiting for Spark Engine...");
      }
    }, 500);
    return () => clearInterval(checkPuter);
  }, []);

  const handleLogin = async () => {
    const puter = (window as any).puter;
    if (!puter) return;
    setIsLoggingIn(true);
    try {
      await puter.auth.signIn();
      const currentUser = await puter.auth.getUser();
      setUser(currentUser);
      setIsAuthed(true);
    } catch (e) {
      console.error("Sign in failed", e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuestLogin = () => {
    setIsGuest(true);
    setIsAuthed(true);
    setUser({ username: "Guest User", isGuest: true });
    // Reset messages when switching to guest mode to ensure Wikipedia-only context
    setMessages([]);
  };

  const handleLogout = async () => {
    if (isGuest) {
      setIsAuthed(false);
      setIsGuest(false);
      setUser(null);
      setMessages([]); // Clear guest messages on logout
      return;
    }
    const puter = (window as any).puter;
    if (!puter) return;
    try {
      await puter.auth.signOut();
      setIsAuthed(false);
      setIsGuest(false);
      setUser(null);
      setMessages([]);
    } catch (e) {
      console.error("Sign out failed", e);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      const timeout = setTimeout(() => {
        scrollToBottom('smooth');
      }, 100);
      return () => clearTimeout(timeout);
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
      }, isGuest);
      
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
      }, isGuest);

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

  if (!isReady) {
    return (
       <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
         <Sparkles size={48} className="text-brand animate-pulse mb-6" />
         <div className="flex items-center gap-3">
           <Cpu size={18} className="text-brand animate-spin" />
           <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">{status || "Initializing..."}</span>
         </div>
       </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card flex flex-col items-center justify-center text-center p-8 sm:p-10 max-w-md w-full relative z-10"
        >
           <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand to-brand-dark flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)] mb-6">
              <Sparkles size={32} className="text-white" />
           </div>
           <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">Spark AI</h1>
           <p className="text-sm text-slate-400 leading-relaxed mb-8">
             Advanced real-time continuous reasoning engine. Please sign in securely via your Puter.js network pass.
           </p>
           
           <div className="flex flex-col gap-3 w-full">
             <button 
               onClick={handleLogin}
               disabled={isLoggingIn}
               className="w-full relative group overflow-hidden bg-white text-slate-900 font-bold text-sm rounded-xl py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] disabled:opacity-70 disabled:pointer-events-none"
             >
               <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoggingIn ? <Cpu className="animate-spin" size={16} /> : <User size={16} />}
                  {isLoggingIn ? "Authenticating Request..." : "Sign in to Continue"}
               </span>
               <div className="absolute inset-0 bg-gradient-to-r from-brand-light/20 to-purple-400/20 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500" />
             </button>

             <button 
               onClick={handleGuestLogin}
               disabled={isLoggingIn}
               className="w-full relative group overflow-hidden bg-white/5 border border-white/10 text-white font-bold text-sm rounded-xl py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98] hover:bg-white/10 hover:border-brand/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] disabled:opacity-70 disabled:pointer-events-none"
             >
               <span className="relative z-10 flex items-center justify-center gap-2">
                  <SearchIcon size={16} className="text-brand-light group-hover:scale-110 transition-transform" />
                  Continue as Guest
               </span>
               <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             </button>
           </div>
        </motion.div>
      </div>
    );
  }

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
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{isGuest ? "Guest Access" : "Network Active"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          {isGuest && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-wider">
              <Layers size={12} />
              Guest Mode
            </div>
          )}
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
            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />
            <button 
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-red-400 border border-transparent hover:border-red-400/20 px-3 py-2"
              title="Sign Out"
            >
              <span className="text-xs font-bold whitespace-nowrap max-w-[100px] truncate">{user?.username || "Puter User"}</span>
              <LogOut size={16} />
            </button>
            <button 
              onClick={handleLogout}
              className="sm:hidden p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-red-400"
            >
              <LogOut size={18} />
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
