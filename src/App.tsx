import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SearchResult, CustomSource } from './types';
import { SparkSearch } from './lib/search';
import { generateAnswer } from './lib/reasoning';
import { ChatInput } from './components/ChatInput';
import { MessageItem } from './components/MessageItem';
import { SourceManager } from './components/SourceManager';
import { ActionTooltip } from './components/ActionTooltip';
import { Logo } from './components/Brand';
import { ProtocolOverlay } from './components/ProtocolOverlay';
import { Sparkles, History, Search as SearchIcon, Cpu, ArrowDown, ArrowUp, User, LogOut, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

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
  const [protocolType, setProtocolType] = useState<'guest' | 'user' | null>(null);
  
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
        setStatus("Configuring Spark Edge...");
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
      setProtocolType('user');
    } catch (e) {
      console.error("Sign in failed", e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuestLogin = () => {
    setProtocolType('guest');
    setUser({ username: "Guest User", isGuest: true });
    // Reset messages when switching to guest mode to ensure reference-only context
    setMessages([]);
  };

  const finishProtocol = () => {
    setIsGuest(protocolType === 'guest');
    setIsAuthed(true);
    setProtocolType(null);
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

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear your current session? This cannot be undone.")) {
      setMessages([]);
      scrollToTop();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    if (isAtBottom && messages.length > 0 && isLoading) {
      // Only auto-scroll while loading/streaming
      const handle = requestAnimationFrame(() => {
        scrollToBottom('auto');
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [messages, status, isLoading]);

  const handleSend = async (query: string) => {
    if (!(window as any).puter) {
      toast.error("Spark Search is still initializing", {
        description: "Please wait a moment while we configure the Edge Mesh."
      });
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
    setStatus("Spark Pipeline Active...");

    try {
      // 1. Staged Search Phase
      const { sources, context, summary, media, queries: expandedQueries } = await SparkSearch(query, customSources, (stage) => {
        setStatus(stage);
      }, isGuest);
      
      const referenceCount = sources.filter(s => s.category === 'Reference').length;
      const webCount = sources.filter(s => s.category === 'Web').length;
      
      setStatus(`Refining ${referenceCount} Reference & ${webCount} Web insights...`);

      // Artificial Delay for "Thinking" effect as requested (2 seconds)
      await new Promise(r => setTimeout(r, 2000));

      // 2. Initialize Assistant Message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        summary: summary || undefined,
        sources: sources,
        media: media,
        thoughts: [
          `Initializing Spark Protocol for query: "${query}"`,
          `Edge Mesh searching for: "${query}"`,
          `Scanning ${sources.length} intelligence nodes for authoritative fragments...`,
          `Synthesizing real-time data nexus...`
        ],
        relatedQueries: expandedQueries.filter(q => q.toLowerCase() !== query.toLowerCase()),
        status: 'thinking',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (isGuest) {
        // Guest mode: Strictly Reference Library summary ONLY.
        // Add a small delay for "Reasoning" effect in guest mode too
        await new Promise(r => setTimeout(r, 1500));
        
        setMessages((prev) => 
          prev.map((msg) => {
            if (msg.id === assistantMessage.id) {
              return { 
                ...msg, 
                content: summary || "Knowledge retrieval complete. Review sources below.",
                thoughts: [
                  `Indexing Reference Library entries for "${query}"...`, 
                  `Synthesizing digest summary...`, 
                  `Finalizing knowledge map...`
                ],
                status: 'complete' 
              };
            }
            return msg;
          })
        );
        setIsLoading(false);
        setStatus(null);
        return;
      }

      setStatus("Spark Reasoning Core Active...");

      // 3. Reasoning Phase (Only for non-guests)
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
      console.error("Critical Spark Intelligence Failure:", error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `### 🔮 Intelligence Protocol Divergence\n\nThe Spark Mesh encountered an unexpected disruption while synthesizing data for your request. \n\n**Common causes:**\n- Temporary cloud network latency\n- Highly specific queries with limited public context\n- Search provider rate limiting\n\n**Diagnostic Trace:** ${error.message || "Unknown synthesis interrupt."}\n\n*Please try refining your query or re-submitting in a few moments.*`,
        timestamp: Date.now(),
        status: 'complete'
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Pipeline Protocol Interrupted", {
        description: "Viewing diagnostic report in latest assistant response."
      });
    } finally {
      setIsLoading(false);
      setStatus(null);
    }
  };

  if (!isReady) {
    return (
       <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-[#020617]">
         <motion.div
           animate={{ 
             scale: [0.9, 1.1, 0.9],
             opacity: [0.5, 1, 0.5] 
           }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           className="relative"
         >
           <Logo size={80} className="mb-6" />
           <div className="absolute inset-0 bg-brand/30 blur-3xl rounded-full -z-10" />
         </motion.div>
         <div className="flex flex-col items-center gap-4">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">{status || "Configuring Spark Edge"}</span>
           </div>
         </div>
       </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#020617]">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand/5 blur-[160px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 blur-[160px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none mix-blend-overlay" />

        {/* Ambient Grid */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,1) 1px, transparent 0)', backgroundSize: '48px 48px' }} 
        />

        <AnimatePresence>
          {protocolType && (
            <ProtocolOverlay type={protocolType} onComplete={finishProtocol} />
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="flex flex-col items-center justify-center text-center max-w-2xl w-full relative z-10"
        >
           <motion.div 
             initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
             animate={{ scale: 1, opacity: 1, rotate: 0 }}
             transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
             className="relative mb-12"
           >
              <Logo size={100} />
              <div className="absolute -inset-4 bg-brand/20 blur-3xl rounded-full -z-10 animate-pulse" />
           </motion.div>
           
           <div className="overflow-hidden mb-6">
           <motion.h1 
               initial={{ y: 100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
               className="text-7xl sm:text-9xl font-display font-bold text-white tracking-tighter mb-4"
             >
               Spark
             </motion.h1>
             <motion.div
               initial={{ width: 0 }}
               animate={{ width: '100%' }}
               transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
               className="h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-50 mb-8"
             />
           </div>
           
           <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.5, duration: 0.8 }}
             className="text-lg sm:text-2xl text-slate-400 font-medium leading-relaxed mb-16 px-8 max-w-lg mx-auto"
           >
             Synthesize the world's <span className="text-white">knowledge</span> in real-time. Powered by the <span className="text-brand-light font-bold">Spark Edge Mesh</span>.
           </motion.p>
           
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.7, duration: 0.8 }}
             className="flex flex-col sm:flex-row gap-5 w-full px-8"
           >
             <button 
               onClick={handleLogin}
               disabled={isLoggingIn}
               className="flex-1 relative group overflow-hidden bg-white text-slate-900 font-bold text-base rounded-[1.25rem] py-5 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl hover:shadow-brand/40 duration-500 disabled:opacity-70 disabled:pointer-events-none"
             >
               <span className="relative z-10 flex items-center justify-center gap-3">
                  {isLoggingIn ? <Cpu className="animate-spin" size={20} /> : <User size={20} />}
                  {isLoggingIn ? "Syncing..." : "Enter Workspace"}
               </span>
               <div className="absolute inset-0 bg-gradient-to-r from-brand-light/20 to-transparent translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-700" />
             </button>
 
             <button 
               onClick={handleGuestLogin}
               disabled={isLoggingIn}
               className="flex-1 relative group overflow-hidden bg-white/5 border border-white/10 text-white font-bold text-base rounded-[1.25rem] py-5 transition-all hover:scale-[1.02] active:scale-[0.98] hover:bg-white/10 hover:border-white/20 duration-500 disabled:opacity-70 disabled:pointer-events-none backdrop-blur-md"
             >
               <span className="relative z-10 flex items-center justify-center gap-3">
                  <SearchIcon size={20} className="text-brand-light group-hover:text-white transition-colors duration-500" />
                  Continue as Guest
               </span>
               <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             </button>
           </motion.div>
 
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 1.2, duration: 1.5 }}
             className="mt-20 flex flex-col items-center gap-4"
           >
              <div className="text-[10px] uppercase tracking-[0.6em] font-bold text-slate-600 mb-2">Technological stack</div>
              <div className="flex items-center gap-8 px-8 py-3 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <span className="text-xs font-black text-slate-300 tracking-tighter">SPARK_MESH</span>
                <div className="h-4 w-[1px] bg-white/10" />
                <span className="text-xs font-black text-slate-300 tracking-tighter">EDGE_SYNC</span>
              </div>
           </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] mesh-bg grid-pattern flex flex-col w-full overflow-x-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 to-[#020617] pointer-events-none" />
      
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-dark/10 blur-[120px] rounded-full pointer-events-none opacity-50" />

      {/* Header */}
      <header className="nav-blur px-4 sm:px-8 py-4 sm:py-5 flex justify-between items-center group relative z-[100]">
        <div className="flex items-center gap-3 cursor-pointer">
          <Logo size={40} className="group-hover:rotate-12 transition-transform duration-300" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold font-display tracking-tight text-white leading-none mb-1">Spark Search</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{isGuest ? "Guest Access" : "Spark Edge Mesh Active"}</span>
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
            <ActionTooltip text="Clear Session">
              <button 
                onClick={handleClearChat}
                className="p-2 sm:p-2.5 hover:bg-red-500/10 rounded-xl transition-all text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20"
              >
                <History size={18} className="sm:w-5 sm:h-5" />
              </button>
            </ActionTooltip>
            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />
            <ActionTooltip text="Sign Out">
              <button 
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-red-400 border border-transparent hover:border-red-400/20 px-3 py-2"
              >
                <span className="text-xs font-bold whitespace-nowrap max-w-[100px] truncate">{user?.username || "Spark User"}</span>
                <LogOut size={16} />
              </button>
            </ActionTooltip>
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
                 <Logo size={64} className="mx-auto mb-4" />
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

      {/* Floating Scroll Controls */}
      <div className="fixed bottom-32 sm:bottom-40 right-6 sm:right-12 z-[60] flex flex-col gap-3">
        <AnimatePresence>
          {messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ActionTooltip text="Scroll to Top">
                <button
                  onClick={scrollToTop}
                  className="bg-brand/10 hover:bg-brand/30 border border-brand/20 text-white p-3 rounded-2xl shadow-2xl backdrop-blur-xl transition-all hover:scale-110 active:scale-95"
                >
                  <ArrowUp size={20} />
                </button>
              </ActionTooltip>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isAtBottom && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ActionTooltip text="Scroll to Bottom">
                <button
                  onClick={() => scrollToBottom('smooth')}
                  className="bg-brand/10 hover:bg-brand/30 border border-brand/20 text-white p-3 rounded-2xl shadow-2xl backdrop-blur-xl transition-all hover:scale-110 active:scale-95"
                >
                  <ArrowDown size={20} />
                </button>
              </ActionTooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Output Input */}
      {messages.length > 0 && <ChatInput onSend={handleSend} isLoading={isLoading} isHome={false} />}
      
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#f8fafc',
            borderRadius: '16px',
          },
        }}
      />
    </div>
  );
}
