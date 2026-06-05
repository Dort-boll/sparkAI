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
import { AILoader } from './components/AILoader';
import { Sparkles, History, Search as SearchIcon, Cpu, ArrowDown, ArrowUp, ArrowRight, User, LogOut, Layers, Shield, Zap, Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

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

  // Simulation states for the interactive landing homepage preview
  const [demoQuery, setDemoQuery] = useState('');
  const [demoStatus, setDemoStatus] = useState<string | null>(null);
  const [demoResponse, setDemoResponse] = useState<string | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isDemoStreaming, setIsDemoStreaming] = useState(false);
  const [isSuggestionsDropdownOpen, setIsSuggestionsDropdownOpen] = useState(false);
  const [selectedDemoTab, setSelectedDemoTab] = useState<'reasoning' | 'sources' | 'privacy'>('reasoning');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleDemoSearch = async (queryToSimulate: string) => {
    if (!queryToSimulate.trim() || isDemoLoading) return;
    setDemoQuery(queryToSimulate);
    setIsDemoLoading(true);
    setDemoResponse(null);
    setDemoStatus("Thinking");
    
    // Cycle simulated statuses
    const t1 = setTimeout(() => {
      setDemoStatus("Searching the web");
    }, 1500);

    const t2 = setTimeout(() => {
      setDemoStatus("Analyzing context");
    }, 3000);

    const t3 = setTimeout(() => {
      let simulatedText = `### 🔮 High-Precision Synthesis: "${queryToSimulate}"\n\n- **Edge Network Extraction**: Queried 24 decentralized public reference indices to synthesize state context.\n- **Neural Verification**: Real-time evaluation confirms state consistency under secure sandbox environments.\n- **Workspace Advantage**: Spark operates directly inside your secure container to preserve key anonymity.\n\n*To search the live web and unlock continuous infinite reasoning streams, connect your workspace securely below.*`;
      
      const qLower = queryToSimulate.toLowerCase();
      if (qLower.includes('genomic') || qLower.includes('crispr')) {
        simulatedText = `### 🧬 CRISPR Genomics Synthesis\n\n- **Target Enrichment Accuracy**: Recent breakthroughs in Cas9 base editing demonstrate a **99.8% precision rate** in high-density genomic arrays.\n- **Off-Target Mitigation**: Real-time structural analysis of sequence nodes reduces unexpected DNA cleavages by more than **85x** under laboratory conditions.\n- **Therapeutic Applications**: Ready clinical trials present customized therapeutic delivery avenues for ultra-rare metabolic disorders.\n\n*To search the live web and unlock continuous infinite reasoning streams, connect your workspace securely below.*`;
      } else if (qLower.includes('battery') || qLower.includes('solid-state') || qLower.includes('lithium')) {
        simulatedText = `### 🔋 Solid-State Polymer Lithium Synthesis\n\n- **Volumetric Density Peak**: Prototypes achieved **480 Wh/kg** using pristine silicon-dominant dendrite-suppressive anodes.\n- **Electrolyte Longevity**: High-temperature solid ceramic separators show stable performance past **1,200 continuous cycles** with negligible capacity degradation.\n- **Scalability Metrics**: Transitioning from pilot roll-to-roll production onto gigafactory lines is expected by Q3 2027.\n\n*To search the live web and unlock continuous infinite reasoning streams, connect your workspace securely below.*`;
      } else if (qLower.includes('exoplanet') || qLower.includes('kepler') || qLower.includes('habit')) {
        simulatedText = `### 🪐 Exoplanet Kepler-186f Habitability Index\n\n- **Radiative Balance State**: Sub-stellar radiation from its primary M-dwarf star corresponds to approximately **32% of Earth's solar constant**.\n- **Atmospheric Model**: Computer simulations predict stable greenhouse retention profiles, indicating high probability of localized surface liquid water states.\n- **Orbital Synchrony**: The orbital period is estimated at **129.9 terrestrial days**, suggesting low tidally locked core constraints.\n\n*To search the live web and unlock continuous infinite reasoning streams, connect your workspace securely below.*`;
      }

      setDemoResponse("");
      setIsDemoLoading(false);
      setDemoStatus(null);
      setIsDemoStreaming(true);

      // Stream the response word by word for absolute maximum visual smoothness
      const words = simulatedText.split(" ");
      let currentWordIndex = 0;
      let streamedString = "";
      
      const streamTimer = setInterval(() => {
        if (currentWordIndex < words.length) {
          streamedString += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex];
          setDemoResponse(streamedString);
          currentWordIndex++;
        } else {
          clearInterval(streamTimer);
          setIsDemoStreaming(false);
        }
      }, 15);
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

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

  // Global script error catcher to prevent crashes and reloads
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (
        msg.toLowerCase().includes('script error') || 
        msg.toLowerCase().includes('puter') ||
        event.filename?.includes('puter.com')
      ) {
        console.warn("Suppressed external script error to prevent app crash:", event);
        event.preventDefault();
        return true;
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || '';
      if (reason.toLowerCase().includes('puter') || reason.toLowerCase().includes('script error')) {
        console.warn("Suppressed unhandled promise rejection from external script:", event.reason);
        event.preventDefault();
        return true;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Restore session state on initial mount
  useEffect(() => {
    try {
      const persistedAuthed = localStorage.getItem('spark_isAuthed');
      const persistedGuest = localStorage.getItem('spark_isGuest');
      const persistedUser = localStorage.getItem('spark_user');
      const persistedMessages = localStorage.getItem('spark_messages');
      const persistedCustomSources = localStorage.getItem('spark_customSources');

      if (persistedAuthed === 'true' && persistedGuest !== 'true') {
        setIsAuthed(true);
        // Load Puter ONLY for Workspace sessions on recovery
        loadPuter().catch(err => console.error("Workspace recovery Puter load failed:", err));
      }
      if (persistedGuest === 'true') {
        setIsGuest(true);
      }
      if (persistedUser) {
        setUser(JSON.parse(persistedUser));
      }
      if (persistedMessages) {
        setMessages(JSON.parse(persistedMessages));
      }
      if (persistedCustomSources) {
        setCustomSources(JSON.parse(persistedCustomSources));
      }
    } catch (e) {
      console.error("Local storage recovery issue:", e);
    } finally {
      setIsReady(true);
    }
  }, []);

  // Save session state to localStorage on any state mutation
  useEffect(() => {
    if (isReady) {
      try {
        localStorage.setItem('spark_isAuthed', String(isAuthed));
        localStorage.setItem('spark_isGuest', String(isGuest));
        localStorage.setItem('spark_user', user ? JSON.stringify(user) : '');
        localStorage.setItem('spark_messages', JSON.stringify(messages));
        localStorage.setItem('spark_customSources', JSON.stringify(customSources));
      } catch (e) {
        console.error("Local storage write error:", e);
      }
    }
  }, [isAuthed, isGuest, user, messages, customSources, isReady]);

  const loadPuter = (): Promise<void> => {
    return new Promise((resolve) => {
      if ((window as any).puter) {
        resolve();
        return;
      }
      
      const existingScript = document.querySelector('script[src*="puter.com"]');
      if (existingScript) {
        let check = setInterval(() => {
          if ((window as any).puter) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          resolve();
        }, 3000);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        console.warn("External script blocked or failed to load. Spark will use its high-precision local fallback safely.");
        resolve();
      };
      document.head.appendChild(script);
    });
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loadPuter();
      const puter = (window as any).puter;
      if (!puter) throw new Error("Puter failed to load");
      
      await puter.auth.signIn();
      const currentUser = await puter.auth.getUser();
      setUser(currentUser);
      setProtocolType('user');
    } catch (e) {
      console.error("Sign in failed", e);
      toast.error("Protocol Error", { description: "Failed to initialize Spark Search Workspace." });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuestLogin = async () => {
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
    setIsAuthed(false);
    setIsGuest(false);
    setUser(null);
    setMessages([]);
    setCustomSources([]);
    
    // Clear session storage values on explicit logout
    try {
      localStorage.removeItem('spark_isAuthed');
      localStorage.removeItem('spark_isGuest');
      localStorage.removeItem('spark_user');
      localStorage.removeItem('spark_messages');
      localStorage.removeItem('spark_customSources');
    } catch (e) {
      console.error("Local storage logout cleanup issue:", e);
    }
    
    const puter = (window as any).puter;
    if (puter) {
      try {
        await puter.auth.signOut();
      } catch (e) {
        console.error("Sign out failed", e);
      }
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
    if (messages.length > 0 && isLoading) {
      // Synchronously check distance from bottom before scrolling
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const distanceFromBottom = scrollHeight - (scrollY + clientHeight);

      // Only auto-scroll if user is actively near the bottom (within 300px)
      if (distanceFromBottom < 300) {
        const handle = requestAnimationFrame(() => {
          scrollToBottom('auto');
        });
        return () => cancelAnimationFrame(handle);
      }
    }
  }, [messages, status, isLoading]);

  const handleSend = async (query: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    const assistantId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      sources: [],
      media: [],
      thoughts: [
        `Registering Spark Pipeline for query: "${query}"...`
      ],
      status: 'thinking',
      timestamp: Date.now() + 50,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    setStatus("Spark Pipeline Active...");

    try {
      // 1. Staged Search Phase with live dynamic thought injection
      const { sources, context, summary, media, queries: expandedQueries } = await SparkSearch(query, customSources, (stage) => {
        setStatus(stage);
        setMessages((prev) => {
          const index = prev.findIndex(m => m.id === assistantId);
          if (index === -1) return prev;
          const newMessages = [...prev];
          const msg = newMessages[index];
          const currentThoughts = msg.thoughts || [];
          if (!currentThoughts.includes(stage)) {
            newMessages[index] = {
              ...msg,
              thoughts: [...currentThoughts, stage]
            };
          }
          return newMessages;
        });
      }, isGuest);
      
      const referenceCount = sources.filter(s => s.category === 'Reference').length;
      const webCount = sources.filter(s => s.category === 'Web').length;
      
      setStatus(`Refining ${referenceCount} Reference & ${webCount} Web insights...`);

      setMessages((prev) => {
        const index = prev.findIndex(m => m.id === assistantId);
        if (index === -1) return prev;
        const newMessages = [...prev];
        const msg = newMessages[index];
        newMessages[index] = {
          ...msg,
          sources: sources,
          media: media,
          summary: summary || undefined,
          relatedQueries: expandedQueries.filter(q => q.toLowerCase() !== query.toLowerCase()),
          thoughts: [...(msg.thoughts || []), `Identified<sup>[mesh]</sup> ${referenceCount} authoritative reference nodes and ${webCount} web fragments.`]
        };
        return newMessages;
      });

      // Rapid sync effect
      await new Promise(r => setTimeout(r, 400));

      // 2. Reasoning Phase
      setStatus("Spark Reasoning Core Active...");
      const currentMessages = [...messages, userMessage];
      const result = await generateAnswer(query, context, currentMessages, ({ content, thought, status: assistantStatus }) => {
        setMessages((prev) => {
          const index = prev.findIndex(m => m.id === assistantId);
          if (index === -1) return prev;

          const newMessages = [...prev];
          const msg = newMessages[index];
          
          const updatedContent = content !== undefined ? content : msg.content;
          
          let newThoughts = msg.thoughts || [];
          if (thought && !newThoughts.includes(thought)) {
            newThoughts = [...newThoughts, thought];
          }
          
          newMessages[index] = {
            ...msg,
            content: updatedContent,
            thoughts: newThoughts,
            status: assistantStatus || msg.status
          };
          return newMessages;
        });
      }, isGuest, summary);

      if (result && typeof result === 'object' && result.relatedQueries) {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantId ? { ...msg, relatedQueries: result.relatedQueries } : msg
        ));
      }

    } catch (error: any) {
      console.error("Critical Spark Intelligence Failure:", error);
      const errorContent = `### 🔮 Intelligence Protocol Divergence\n\nThe Spark Mesh encountered an unexpected disruption while synthesizing data for your request. \n\n**Common causes:**\n- Temporary cloud network latency\n- Highly specific queries with limited public context\n- Search provider rate limiting\n\n**Diagnostic Trace:** ${error.message || "Unknown synthesis interrupt."}\n\n*Please try refining your query or re-submitting in a few moments.*`;
      
      setMessages((prev) => {
        const index = prev.findIndex(m => m.id === assistantId);
        if (index !== -1) {
          const newMessages = [...prev];
          newMessages[index] = {
            ...newMessages[index],
            content: errorContent,
            status: 'complete'
          };
          return newMessages;
        } else {
          return [...prev, {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: errorContent,
            timestamp: Date.now(),
            status: 'complete'
          }];
        }
      });
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
       <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-[#000000]">
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
           <div className="flex items-center gap-2.5">
             <Cpu size={14} className="animate-spin text-brand/70 shrink-0" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Initializing Spark Search</span>
           </div>
         </div>
       </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#000000] text-slate-100 relative overflow-x-hidden selection:bg-brand/20 selection:text-white">
        {/* Background Decorative Ambient Radials */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#3b82f6]/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #ffffff 1px, transparent 0)', backgroundSize: '36px 36px' }} 
        />

        <AnimatePresence>
          {protocolType && (
            <ProtocolOverlay type={protocolType} onComplete={finishProtocol} />
          )}
        </AnimatePresence>

        {/* Sticky Glassmorphic Header */}
        <header className="nav-blur px-6 sm:px-10 py-4 sm:py-5 flex justify-between items-center z-50 sticky top-0 w-full transition-all duration-300">
          <div className="flex items-center gap-3">
            <Logo size={36} className="text-white" />
            <div className="flex flex-col">
              <span className="text-lg font-bold font-display tracking-tight text-white">Spark Search</span>
              <span className="text-[9px] font-black tracking-widest text-brand-light uppercase">DECIDIOUS CORE</span>
            </div>
          </div>
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white tracking-wide transition-all active:scale-95 duration-200"
          >
            {isLoggingIn ? <Cpu className="animate-spin w-4 h-4" /> : <User className="w-4 h-4 text-brand-light" />}
            <span className="hidden sm:inline">Connect Workspace</span>
            <span className="sm:hidden">Connect</span>
          </button>
        </header>

        {/* Interactive Main Body container */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 sm:py-20 flex flex-col items-center justify-center relative z-10">
          
          {/* Main Hero Header */}
          <div className="text-center mb-12 sm:mb-16 select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand/10 to-brand-light/10 border border-brand/20 px-3 py-1.5 rounded-full mb-6 text-[10px] sm:text-xs font-bold tracking-wider text-brand-light uppercase"
            >
              <Sparkles size={12} className="text-brand" />
              INTELLIGENT EDGE SEARCH PROTOCOL
            </motion.div>
            
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 1.2 }}
              className="text-4xl min-[375px]:text-5xl sm:text-7xl font-bold tracking-tighter text-white font-display mb-6"
            >
              Ask Spark anything
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1.2 }}
              className="text-sm sm:text-xl text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto px-4"
            >
              Watch Spark coordinate live web indexers, stream recursive deep reasoning layers, and compile high-precision syntheses directly inside your private workspace.
            </motion.p>
          </div>

          {/* Search Box Sandbox Compartment */}
          {isSuggestionsDropdownOpen && (
            <div 
              className="fixed inset-0 z-20 cursor-default" 
              onClick={() => setIsSuggestionsDropdownOpen(false)}
            />
          )}

          <div className="w-full max-w-3xl mb-12 relative z-30 px-4 sm:px-0">
            <div className="glass-card bg-white/[0.03] backdrop-blur-3xl border border-brand/45 hover:border-brand/70 focus-within:border-brand rounded-[32px] p-2 flex flex-col gap-2 relative shadow-[0_20px_50px_rgba(0,0,0,0.8),_0_0_0_1px_rgba(59,130,246,0.35),_0_0_8px_rgba(59,130,246,0.22)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.8),_0_0_0_1px_rgba(59,130,246,0.5),_0_0_12px_rgba(59,130,246,0.32)] focus-within:shadow-[0_20px_50px_rgba(0,0,0,0.8),_0_0_0_1.5px_rgba(59,130,246,0.65),_0_0_16px_rgba(59,130,246,0.4)] transition-all duration-300">
              {/* Interactive Sandbox Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsSuggestionsDropdownOpen(false);
                  handleDemoSearch(demoQuery);
                }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <div className="pl-3 text-slate-500 group-focus-within:text-brand transition-colors">
                  <SearchIcon size={18} />
                </div>
                <input
                  type="text"
                  value={demoQuery}
                  onFocus={() => setIsSuggestionsDropdownOpen(true)}
                  onChange={(e) => setDemoQuery(e.target.value)}
                  placeholder="Ask Spark anything..."
                  className="flex-1 bg-transparent border-0 outline-none text-slate-100 placeholder:text-slate-500 py-3 sm:py-4 text-xs sm:text-base focus:ring-0 min-w-0"
                />
                
                {/* Suggestions Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSuggestionsDropdownOpen(prev => !prev);
                  }}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold text-slate-400 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/5 transition-all duration-200 shrink-0"
                >
                  <span className="hidden sm:inline">Suggested</span>
                  <ChevronDown size={14} className={`transform transition-transform duration-200 ${isSuggestionsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <button
                  type="submit"
                  disabled={isDemoLoading || !demoQuery.trim()}
                  className={`px-4 sm:px-5 py-2 sm:py-3 rounded-2xl text-[10px] sm:text-xs font-bold font-display tracking-wider transition-all duration-300 flex items-center gap-1.5 shrink-0
                    ${demoQuery.trim() && !isDemoLoading
                      ? 'bg-brand text-white shadow-lg hover:scale-105 active:scale-95'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed'}`}
                >
                  {isDemoLoading ? "Processing" : "Preview"}
                </button>
              </form>

              {/* Autocomplete Suggestions Dropdown inside Search Box Container */}
              <AnimatePresence>
                {isSuggestionsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 right-0 top-full mt-2 bg-slate-950/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-40 p-2 flex flex-col gap-1 max-h-[280px] overflow-y-auto"
                  >
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1 flex justify-between items-center select-none">
                      <span>Suggested Research Prompts</span>
                      <span className="text-[9px] font-medium text-slate-600 lowercase">click to preview</span>
                    </div>
                    {[
                      { label: '🧬 CRISPR Genomics', prompt: 'Analyze latest advancements in CRISPR genetic sequencing techniques.', desc: 'Target sequences & base editing breakthroughs' },
                      { label: '🔋 Solid-State Battery', prompt: 'Provide engineering status of solid-state lithium ceramic cells.', desc: 'Volumetric density peak & electrolyte longevity' },
                      { label: '🪐 Habitable Kepler', prompt: 'What are the habitability indicators of exoplanet Kepler-186f?', desc: 'M-dwarf stellar radiation & atmosphere models' }
                    ].map(({ label, prompt, desc }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setDemoQuery(prompt);
                          handleDemoSearch(prompt);
                          setIsSuggestionsDropdownOpen(false);
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-white/[0.05] active:bg-white/10 flex flex-col gap-0.5 transition-all text-slate-200 outline-none"
                      >
                        <span className="text-xs sm:text-sm font-bold text-slate-100">{label}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 line-clamp-1">{desc}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Interactive Live Stream Console Output Panel */}
          <AnimatePresence mode="wait">
            {isDemoLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl rounded-3xl p-8 mb-12 flex items-center justify-center animate-fade-in"
              >
                <AILoader />
              </motion.div>
            )}

            {demoResponse && (
              <motion.div
                key="response"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-2xl bg-white/[0.01] border border-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 mb-12 shadow-[0_10px_40px_rgba(37,99,235,0.05)] relative overflow-hidden"
              >
                {/* Micro Ambient Glow behind markdown output */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-3xl rounded-full" />
                
                <div className={`markdown-body ${isDemoStreaming ? 'streaming' : ''} text-slate-300 text-sm sm:text-base leading-relaxed`}>
                  <ReactMarkdown>{demoResponse}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* High-Fidelity Login Section Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-[#030712]/50 p-6 sm:p-10 rounded-[2rem] text-center shadow-2xl backdrop-blur-xl relative overflow-hidden group hover:border-brand/35 transition-all duration-500 animate-fade-in"
          >
            {/* Ambient Animated Corner Flare */}
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-brand/10 blur-3xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-blue-500/10 blur-3xl rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none" />

            <div className="mx-auto w-14 h-14 rounded-2xl bg-brand/5 border border-brand/20 flex items-center justify-center mb-6 text-brand shadow-[0_0_30px_rgba(59,130,246,0.15)] relative">
              <Shield className="w-6.5 h-6.5" />
              <div className="absolute inset-0 rounded-2xl border border-brand/40 animate-ping opacity-25 pointer-events-none" style={{ animationDuration: '3s' }} />
            </div>

            <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight leading-none mb-3">
              Power Premium Spark Search
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed mb-8">
              Connect via Puter Cloud Workspace for unconstrained real-time indexing, multi-agent reasoning, and zero data leakage.
            </p>

            {/* Feature Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left mb-8">
              <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0 mt-0.5">
                  <Globe size={11} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Continuous Live Querying</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Continuous crawling & deep indexes synthesis.</p>
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0 mt-0.5">
                  <Cpu size={11} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">High-Precision Models</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Deep multi-step reasoning capabilities.</p>
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0 mt-0.5">
                  <Shield size={11} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Sovereign Data Privacy</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Strictly runs inside secure sandboxed nodes.</p>
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0 mt-0.5">
                  <Zap size={11} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Always Free To Start</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Unlimited basic queries for personal research.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full sm:w-auto relative group overflow-hidden bg-white text-slate-950 font-black text-xs sm:text-sm px-8 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_15px_30px_rgba(255,255,255,0.08)] hover:shadow-brand/25 flex items-center justify-center gap-2.5 disabled:opacity-55 shrink-0 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <Cpu className="animate-spin w-4 h-4 text-brand" />
                    <span>Authorizing Workspace...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-brand fill-brand animate-pulse" />
                    <span>Connect Workspace</span>
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-light/35 to-transparent translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-700 pointer-events-none" />
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#ffffff]/[0.03] hover:bg-[#ffffff]/[0.07] border border-white/5 px-8 py-4 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-all active:scale-[0.98] duration-200 cursor-pointer"
              >
                <span>Continue as Guest</span>
                <ArrowRight size={14} className="text-slate-400 transition-transform group-hover:translate-x-1 duration-200" />
              </button>
            </div>
          </motion.div>

          {/* Interactive bento feature grid section */}
          <div className="mt-16 sm:mt-24 w-full">
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] text-center mb-8">
              Decentralized Architectural Pillars
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {[
                {
                  id: 'reasoning',
                  icon: Cpu,
                  title: 'Edge Reasoning',
                  shortDesc: 'Multi-layer sequential inference verified at client nodes.',
                  detail: 'Spark routes requests through non-linear reasoning, allowing self-correcting prompt synthesizers to extract optimal context representation.'
                },
                {
                  id: 'sources',
                  icon: Globe,
                  title: 'Live Synthesis',
                  shortDesc: 'Aggregated real-time indexing with deep integrity filters.',
                  detail: 'Every research query aggregates authoritative indices and academic networks concurrently, compiling pristine citations with zero hallucinated state.'
                },
                {
                  id: 'privacy',
                  icon: Shield,
                  title: 'Sovereign Privacy',
                  shortDesc: 'Decentralized local sandbox encryption with zero user-tracking.',
                  detail: 'Spark container architecture hosts processing logic completely stateless. No cookies, trackers, or centralized data logs are generated during execution.'
                }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedDemoTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedDemoTab(item.id as any)}
                    className={`flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-brand
                      ${isSelected
                        ? 'bg-brand/5 border-brand shadow-[0_0_30px_rgba(59,130,246,0.1)]'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}
                  >
                    <div className={`p-2.5 rounded-xl border flex items-center justify-center mb-4 transition-colors
                      ${isSelected
                        ? 'bg-brand/15 border-brand/20 text-brand-light'
                        : 'bg-white/5 border-white/10 text-slate-400'}`}
                    >
                      <Icon size={18} />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-snug mb-3">{item.shortDesc}</p>
                    
                    {isSelected && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-[11px] text-slate-500 leading-relaxed border-t border-brand/20 pt-3 mt-1"
                      >
                        {item.detail}
                      </motion.p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Technical Footer Stack */}
          <div className="mt-20 flex flex-col items-center gap-2 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
            <span>SPARK PROTOCOL VER 2.4.9 // HOST STACK : OK</span>
            <span>SECURED ENCRYPTED EDGE WORKSPACE</span>
          </div>

        </main>
      </div>
    );
  }

  return (
    <div id="app-root-container" className="min-h-[100dvh] mesh-bg grid-pattern flex flex-col w-full overflow-x-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#000000]/50 to-[#000000] pointer-events-none" />
      
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-dark/10 blur-[120px] rounded-full pointer-events-none opacity-50" />

      {/* Header */}
      <header id="app-header" className="nav-blur px-4 sm:px-8 py-4 sm:py-5 flex justify-between items-center group relative z-[100]">
        <div className="flex items-center gap-3 cursor-pointer">
          <Logo size={40} className="group-hover:rotate-12 transition-transform duration-300" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold font-display tracking-tight text-white leading-none mb-1">Spark Search</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isGuest ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]'}`} />
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 w-full min-h-[75vh]"
            >
              <div className="mb-8 relative select-none">
                 <Logo size={72} className="mx-auto mb-6 text-brand drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]" />
                 <h2 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-white mb-4">
                   Spark
                 </h2>
                 <p className="text-slate-400 text-xs sm:text-base max-w-lg mx-auto leading-relaxed">
                   Live web querying, deep sequential research reasoning, and sovereign container privacy combined instantly.
                 </p>
              </div>
              
              <div className="w-full relative z-20">
                 <ChatInput onSend={handleSend} isLoading={isLoading} isHome={true} />
              </div>

              {/* Suggestions below the search box */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full max-w-2xl px-2">
                 {[
                   { label: 'Future of Nuclear Fusion', icon: Sparkles },
                   { label: 'James Webb Space Discovery', icon: SearchIcon },
                   { label: 'History of Renaissance Art', icon: Cpu },
                   { label: 'Benefits of Deep Learning', icon: History }
                 ].map(({ label, icon: Icon }) => (
                   <button 
                     key={label}
                     onClick={() => handleSend(label)}
                     className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand/30 rounded-full py-2 px-3.5 sm:px-4.5 transition-all text-slate-300 text-xs sm:text-sm max-w-full truncate"
                   >
                     <Icon size={13} className="text-brand shrink-0" />
                     <span className="truncate">{label}</span>
                   </button>
                 ))}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col w-full pb-48 sm:pb-56">
              {messages.map((message) => (
                <MessageItem key={message.id} message={message} onSend={handleSend} isGuest={isGuest} />
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

      {/* Floating loading/status animation shown when generating answers */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 15, x: "-50%", scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: 10, x: "-50%", scale: 0.9 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed bottom-[88px] sm:bottom-[104px] left-1/2 -translate-x-1/2 z-[45] flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/85 backdrop-blur-2xl border border-brand/40 shadow-[0_10px_30px_rgba(59,130,246,0.25)] text-[10px] sm:text-xs font-bold text-brand-light tracking-wide uppercase whitespace-nowrap select-none"
          >
            <Cpu size={12} className="animate-spin text-brand shrink-0" />
            <span className="truncate">Search & synthesis active</span>
          </motion.div>
        )}
      </AnimatePresence>

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
