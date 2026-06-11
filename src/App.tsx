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
import { Sparkles, History, Search as SearchIcon, Cpu, ArrowDown, ArrowUp, ArrowRight, User, LogOut, Layers, Shield, Zap, Globe, ChevronDown, Terminal, Activity, Database, Server, Lock, Compass } from 'lucide-react';
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
  const [swiperCompleted, setSwiperCompleted] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Custom interactive routing configurations for impressive landing login page
  const [selectedRoutingNode, setSelectedRoutingNode] = useState<'us-east' | 'eu-central' | 'apac-edge'>('us-east');
  const [nodeMoniker, setNodeMoniker] = useState('spark-secure-node');
  const [selectedSpeed, setSelectedSpeed] = useState<number>(2.8); // Million nodes/sec
  const [selectedTemperature, setSelectedTemperature] = useState<number>(0.7);
  const [activePreTab, setActivePreTab] = useState<'sandbox' | 'gateway'>('sandbox');
  
  // Automated state logs simulation for cybernetic terminal visualizer
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] SECURE CORE LOADED - OK",
    "[IP-TUNNEL] LOCAL ENCLAVE GENERATED AT 127.0.0.1",
    "[FABRIC] SPARK SEED CRYPTO SHIELDS ENGAGED",
    "[TUNNEL] ACTIVE ROUTE AT HIGH-FREQUENCY CHANNELS",
  ]);

  // Simulated regional latency centroids
  const [selectedLatencies, setSelectedLatencies] = useState<{ [key: string]: string }>({
    'us-east': '12ms',
    'eu-central': '28ms',
    'apac-edge': '44ms'
  });
  const [isMeasuringLatency, setIsMeasuringLatency] = useState(false);

  // Simulation states for the interactive landing homepage preview
  const [demoQuery, setDemoQuery] = useState('');
  const [demoStatus, setDemoStatus] = useState<string | null>(null);
  const [demoResponse, setDemoResponse] = useState<string | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isDemoStreaming, setIsDemoStreaming] = useState(false);
  const [isSuggestionsDropdownOpen, setIsSuggestionsDropdownOpen] = useState(false);
  const [selectedDemoTab, setSelectedDemoTab] = useState<'reasoning' | 'sources' | 'privacy'>('reasoning');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const swipeConstraintsRef = useRef<HTMLDivElement>(null);
  
  const [maxDragDistance, setMaxDragDistance] = useState(280);
  const [dragPercentage, setDragPercentage] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (swipeConstraintsRef.current) {
        const containerWidth = swipeConstraintsRef.current.offsetWidth;
        // Padding is 6px on each side (p-1.5) = 12px, handle is 50px wide.
        setMaxDragDistance(Math.max(100, containerWidth - 50 - 12));
      }
    };
    
    // Run initially
    handleResize();
    
    // Run after a tiny layout timeout to ensure correct container sizing
    const timer = setTimeout(handleResize, 100);
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

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

  const handleRandomizeMoniker = () => {
    const prefixes = ['quantum', 'nexus', 'aurora', 'hyper', 'plasma', 'spark', 'vector', 'matrix', 'orbital', 'cyber'];
    const suffixes = ['phoenix', 'spectre', 'tracker', 'pioneer', 'glide', 'comet', 'falcon', 'shield', 'vortex', 'core'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    const nextMoniker = `${p}-${s}-${num}`;
    setNodeMoniker(nextMoniker);
    toast.success("Cryptographic moniker compiled!", {
      description: `Target descriptor node moniker designated as: ${nextMoniker}`,
    });
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

  // Simulation for live high-precision cybernetic terminal ticks
  useEffect(() => {
    if (isAuthed) return;

    const phrases = [
      "COMPILING WEB NODES IN SILICON VALLEY centroids...",
      "TUNING INFERENCE DEVIATION STANDARD FOR GEMINI...",
      "REALLOCATING COMPACT QUANT INDEX BLOCKS...",
      "SYNC ENGINE STATEFUL HEARTBEAT: HEALTHY",
      "SECURE SHADOW SANDBOX HANDSHAKE ESTABLISHED",
      "ENCRYPTING COLD GRAPH STATE-RELATIONS...",
      "SPARK HIGH-PRECISION DECODE PROTOCOL OK",
    ];

    const logInterval = setInterval(() => {
      setTerminalLogs(prev => {
        const nextPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        const timeStr = new Date().toLocaleTimeString();
        const newLog = `[${timeStr}] ${nextPhrase}`;
        return [...prev.slice(-3), newLog]; // Keep last 4 logs
      });
    }, 4000);

    const latencyInterval = setInterval(() => {
      setSelectedLatencies(prev => {
        const fluctuate = (msStr: string) => {
          const num = parseInt(msStr);
          const diff = Math.floor(Math.random() * 5) - 2; // -2 to +2
          const next = Math.max(5, num + diff);
          return `${next}ms`;
        };
        return {
          'us-east': fluctuate(prev['us-east']),
          'eu-central': fluctuate(prev['eu-central']),
          'apac-edge': fluctuate(prev['apac-edge']),
        };
      });
    }, 3500);

    return () => {
      clearInterval(logInterval);
      clearInterval(latencyInterval);
    };
  }, [isAuthed]);

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
    setLoginError(null);
    try {
      await loadPuter();
      const puter = (window as any).puter;
      if (!puter) throw new Error("Connection provider (Puter script) failed to load. Please inspect network headers.");
      
      await puter.auth.signIn();
      const currentUser = await puter.auth.getUser();
      
      const sessionDisplayName = nodeMoniker.trim() ? nodeMoniker.trim() : "spark-node";
      const customizedUser = {
        ...currentUser,
        username: currentUser.username ? `${currentUser.username} [${sessionDisplayName}]` : `Client [${sessionDisplayName}]`,
        routingNode: selectedRoutingNode
      };
      
      setUser(customizedUser);
      setProtocolType('user');
    } catch (e: any) {
      console.error("Sign in failed", e);
      const errorMsg = e?.message || "Failed to establish Workspace connection session.";
      setLoginError(errorMsg);
      setSwiperCompleted(false);
      setDragPercentage(0);
      toast.error("Protocol Error", { description: errorMsg });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuestLogin = async () => {
    setProtocolType('guest');
    const sessionDisplayName = nodeMoniker.trim() ? nodeMoniker.trim() : "spark-guest";
    setUser({ 
      username: `Guest@${sessionDisplayName}`, 
      isGuest: true,
      routingNode: selectedRoutingNode
    });
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
    setSwiperCompleted(false);
    setDragPercentage(0);
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
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#000000] text-slate-100 relative overflow-hidden selection:bg-brand/20 selection:text-white font-sans p-4">
        {/* Background Premium Animated Cosmic Radiance Filters */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-brand/5 to-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-indigo-500/5 to-brand-light/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 z-0 opacity-[0.015] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }} 
        />

        <AnimatePresence>
          {protocolType && (
            <ProtocolOverlay type={protocolType} onComplete={finishProtocol} />
          )}
        </AnimatePresence>

        {/* Central Master Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-zinc-950/70 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.8)] relative overflow-hidden text-center z-10"
        >
          {/* Subtle top edge glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />

          {/* Logo Brand Header */}
          <div className="flex flex-col items-center gap-3.5 mb-8 select-none">
            <div className="p-3 bg-white/[0.02] border border-white/[0.08] rounded-2xl shadow-inner relative group">
              <Logo size={46} className="text-white group-hover:scale-105 duration-300 transition-transform" />
              <div className="absolute inset-0 rounded-2xl bg-brand/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">Spark Search</h1>
              <p className="text-xs text-slate-400 tracking-wide">Secure Client Ingest Node</p>
            </div>
          </div>

          {/* Error Panel in case of authentication failure */}
          {loginError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-2xl border border-rose-500/15 bg-rose-950/10 text-left text-xs text-rose-300/90 leading-relaxed flex items-start gap-2.5"
            >
              <Shield className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-rose-200 mb-0.5">Authorization Failed</span>
                {loginError}
              </div>
            </motion.div>
          )}

          {/* Credential Customizers */}
          <div className="space-y-4 mb-8 text-left">
            {/* Moniker Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Descriptor Moniker</span>
                <button
                  type="button"
                  onClick={handleRandomizeMoniker}
                  className="text-[9px] hover:text-white text-indigo-400 uppercase font-bold flex items-center gap-1 cursor-pointer hover:underline focus:outline-none transition-colors"
                >
                  <span>🎲 Randomize</span>
                </button>
              </div>
              <div className="relative rounded-xl bg-white/[0.015] border border-white/[0.06] focus-within:border-brand/40 focus-within:bg-white/[0.03] transition-all p-2.5 flex items-center gap-2">
                <span className="font-mono text-[10px] text-brand-light/50 uppercase select-none font-medium">NAME:</span>
                <input
                  type="text"
                  value={nodeMoniker}
                  onChange={(e) => {
                    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                    setNodeMoniker(clean);
                  }}
                  placeholder="spark-node-alias"
                  maxLength={24}
                  className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-700 text-xs font-mono py-0.5 focus:ring-0"
                />
              </div>
            </div>

            {/* Region/Centroid selection */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">System Routing Centroid</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'us-east', name: 'US-EAST', ping: '12ms' },
                  { id: 'eu-central', name: 'EU-CENT', ping: '28ms' },
                  { id: 'apac-edge', name: 'APAC-EDGE', ping: '44ms' }
                ].map((node) => {
                  const isSelected = selectedRoutingNode === node.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedRoutingNode(node.id as any)}
                      className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer text-left focus:outline-none select-none
                        ${isSelected 
                          ? 'bg-brand/10 border-brand/40 shadow-[0_0_12px_rgba(59,130,246,0.12)]' 
                          : 'bg-white/[0.01] border-white/[0.05] hover:border-white/10 hover:bg-white/[0.02]'}`}
                    >
                      <span className={`text-[10px] font-bold font-mono tracking-wide ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                        {node.name}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 mt-0.5">{node.ping}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Core Interactive iOS Swipe component */}
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div ref={swipeConstraintsRef} className="relative w-full h-[62px] bg-zinc-950 border border-white/[0.08] hover:border-white/[0.12] rounded-full flex items-center p-1.5 overflow-hidden select-none transition-colors">
                
                {/* Tech background track progress fill bar */}
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand/10 to-brand/35 transition-all duration-75 pointer-events-none rounded-l-full z-0"
                  style={{ width: `${Math.max(12, dragPercentage)}%` }}
                />

                {/* Rolling background shimmer text indicator */}
                <div className="absolute inset-x-12 inset-y-0 flex items-center justify-center pointer-events-none text-xs text-white/40 tracking-wider font-mono select-none z-0">
                  <span className="animate-pulse bg-gradient-to-r from-slate-400 via-white to-slate-400 bg-clip-text text-transparent select-none font-medium">
                    {isLoggingIn ? "Authorizing..." : "Slide to Authorize Node ▸"}
                  </span>
                </div>

                {/* Framer motion draggable absolute handle button */}
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: maxDragDistance }}
                  dragElastic={0.1}
                  dragMomentum={false}
                  onDrag={(event, info) => {
                    setDragPercentage(Math.min(100, Math.max(0, (info.offset.x / maxDragDistance) * 100)));
                  }}
                  onDragEnd={(event, info) => {
                    if (info.offset.x > maxDragDistance * 0.70 && !isLoggingIn) {
                      setSwiperCompleted(true);
                      setDragPercentage(100);
                      handleLogin();
                    } else {
                      setSwiperCompleted(false);
                      setDragPercentage(0);
                    }
                  }}
                  animate={{ x: swiperCompleted ? maxDragDistance : 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 26 }}
                  className={`absolute left-1.5 z-10 w-[50px] h-[50px] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_4px_16px_rgba(0,0,0,0.55)] border transition-all duration-150
                    ${isLoggingIn 
                      ? 'bg-zinc-800 border-zinc-700 text-slate-500' 
                      : swiperCompleted 
                        ? 'bg-emerald-500 border-emerald-400 text-white' 
                        : 'bg-white border-white hover:bg-slate-100 text-black'}`}
                >
                  {isLoggingIn ? (
                    <Cpu className="w-5 h-5 animate-spin text-brand" />
                  ) : swiperCompleted ? (
                    <Cpu className="w-5 h-5 text-white animate-pulse" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-black" />
                  )}
                </motion.div>
                
              </div>
            </div>

            {/* Direct fallback trigger button */}
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold font-mono border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-slate-300 hover:text-white transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              Configure standard Puter connection instead
            </button>
            
            {/* Guest Action trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGuestLogin}
                className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 cursor-pointer font-medium focus:outline-none transition-colors"
              >
                Launch Offline sandbox session as guest
              </button>
            </div>
          </div>

          {/* Secure disclaimer */}
          <div className="mt-8 border-t border-white/[0.05] pt-4 flex items-center justify-center gap-1.5 text-[9px] font-mono text-slate-600 uppercase tracking-widest select-none">
            <Lock className="w-3 h-3" />
            <span>AES-256 Cloud Shield Protection Active</span>
          </div>

        </motion.div>
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
