import React, { useState, useRef, useEffect } from 'react';
import { ActionTooltip } from './ActionTooltip';
import { Send, Search, Sparkles, Mic, Plus, X, FileText, MicOff, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ChatInputProps {
  onSend: (query: string) => void;
  isLoading: boolean;
  isHome?: boolean;
}

const COMMON_SUGGESTIONS = [
  "Latest AI breakthroughs & neural architecture",
  "How to optimize React with Concurrent Mode",
  "Global semiconductor supply chain analysis",
  "Explain quantum entanglement for beginners",
  "Future of fusion energy & ITER project",
  "Deep dive into the history of cryptography",
  "Comparison: SQL vs NoSQL for high-scale apps",
  "Mars colonization: technical challenges",
  "Philosophy of consciousness in digital age"
];

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, isHome }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (query.trim().length > 1) {
      const filtered = COMMON_SUGGESTIONS.filter(s => 
        s.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const finalQuery = overrideQuery || query;
    if ((finalQuery.trim() || selectedFile) && !isLoading) {
      // Create a comprehensive message that includes file context if present
      let message = finalQuery.trim();
      
      if (selectedFile) {
        if (!message) {
          message = `Analyze this file: ${selectedFile.name}`;
        } else {
          message = `${message}\n\n[Context: Attached file "${selectedFile.name}"]`;
        }
      }
      
      onSend(message);
      setQuery('');
      setSelectedFile(null);
      setShowSuggestions(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error("File constraint violation", { description: "Maximum payload for Spark Mesh is 15MB." });
        return;
      }
      setSelectedFile(file);
      toast.success("Intelligence Attached", { 
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB) primed for synthesis.` 
      });
      setShowSuggestions(false);
      textareaRef.current?.focus();
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Audio Mesh Unavailable", {
        description: "Your environment does not support real-time audio protocols."
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        toast.info("Voice Protocol Active", { description: "Capturing audio fragments..." });
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Audio Protocol Error:", event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          toast.error("Mic Access Denied", { description: "Please enable microphone permissions in your browser." });
        } else {
          toast.error("Voice Disruption", { description: event.error });
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to initialize recognition:", err);
      toast.error("Technical Fault", { description: "Could not initialize audio capture mesh." });
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query]);

  const innerForm = (
    <div className="relative" ref={containerRef}>
      <AnimatePresence>
        {showSuggestions && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 right-0 mb-4 bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-50 p-2"
          >
            <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suggestions</span>
              <button 
                onClick={() => setShowSuggestions(false)}
                className="p-1 hover:bg-white/5 rounded-lg text-slate-500"
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex flex-col">
              {suggestions.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between hover:bg-brand/10 transition-all rounded-xl mx-1.5 group/item cursor-pointer">
                  <button
                    onClick={() => handleSubmit(undefined, s)}
                    className="flex items-center gap-3 px-4 py-3 text-left flex-1"
                  >
                    <Search size={14} className="text-slate-500 group-hover/item:text-brand transition-colors" />
                    <span className="text-sm text-slate-300 group-hover/item:text-white truncate transition-colors">{s}</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuery(s);
                      setShowSuggestions(false);
                      textareaRef.current?.focus();
                    }}
                    className="p-3 mr-1 text-slate-500 hover:text-brand transition-all rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100"
                    title="Copy to search box"
                  >
                    <ArrowUp size={12} className="rotate-45" />
                    Fill
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative group w-full px-3 sm:px-0">
        {/* Advanced Google-Style Animated Glow Border */}
        <div className={`absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-[32px] blur-lg transition duration-1000 group-hover:duration-200 animate-pulse ${isHome ? 'opacity-20 group-focus-within:opacity-60' : 'opacity-30 group-focus-within:opacity-80'}`}></div>
        
        <form 
          onSubmit={handleSubmit}
          className="glass-card !bg-[#0f172a]/90 !p-1.5 sm:!p-2 flex flex-col shadow-xl relative w-full !rounded-[32px] border border-white/5"
        >
          {selectedFile && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-4 py-2 flex items-center gap-2"
            >
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 group/file">
                <FileText size={14} className="text-brand" />
                <span className="text-xs text-slate-300 truncate max-w-[150px]">{selectedFile.name}</span>
                <button 
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>
            </motion.div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 pl-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <ActionTooltip text="Attach Intelligence">
                <button 
                  type="button"
                  onClick={handleFileClick}
                  className="p-2.5 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-full transition-all"
                >
                  <Plus size={20} />
                </button>
              </ActionTooltip>
            </div>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                rows={1}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => query.trim().length > 1 && suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Ask spark anything..."
                className="w-full min-h-[44px] sm:min-h-[52px] leading-[24px] bg-transparent border-0 outline-none focus:outline-none focus:ring-0 shadow-none resize-none py-2.5 sm:py-3.5 text-sm sm:text-base text-slate-100 placeholder:text-slate-400 max-h-32 sm:max-h-48 scrollbar-none [&::-webkit-scrollbar]:hidden relative z-10 block"
              />
            </div>
            
            <div className="flex items-center gap-1 pr-1.5">
              <ActionTooltip text={isRecording ? "Stop Capture" : "Voice Protocol"}>
                <button 
                  type="button"
                  onClick={handleMicClick}
                  className={`p-2.5 transition-all rounded-full hidden sm:flex ${isRecording ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </ActionTooltip>

              <ActionTooltip text="Trigger Synthesis">
                <button
                  type="submit"
                  disabled={(!query.trim() && !selectedFile) || isLoading}
                  className={`
                    p-3 sm:p-3.5 rounded-full transition-all duration-300 flex items-center justify-center
                    ${(query.trim() || selectedFile) && !isLoading 
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
              </ActionTooltip>
            </div>
          </div>
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
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]" /> Spark Search
        </div>
      </div>
    </div>
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
