import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';
import { SourceList } from './SourceList';
import { motion, AnimatePresence } from 'motion/react';
import { ActionTooltip } from './ActionTooltip';
import { Sparkles, User, Search as SearchIcon, Image as ImageIcon, ChevronDown, Layers, ArrowRight, Copy, Check, Share2, ThumbsUp, ThumbsDown, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';

interface MessageItemProps {
  message: ChatMessage;
  onSend?: (query: string) => void;
  isGuest?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onSend, isGuest }) => {
  const isAssistant = message.role === 'assistant';
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ x: number, y: number, text: string } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setSelectionRange(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const isWithinContent = contentRef.current?.contains(range.commonAncestorContainer);
      
      if (isWithinContent) {
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        
        if (containerRect) {
          // Calculate center X relative to container
          const centerX = rect.left - containerRect.left + rect.width / 2;
          // Calculate Y relative to container (top of the selection)
          const topY = rect.top - containerRect.top;
          
          setSelectionRange({
            x: centerX,
            y: topY,
            text: selection.toString().trim()
          });
        }
      } else {
        setSelectionRange(null);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    // Also handle touch for mobile
    document.addEventListener('touchend', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, []);

  const handleAskSpark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectionRange && onSend) {
      onSend(`[Deep Dive Request] Elaborate on this context: "${selectionRange.text}"`);
      setSelectionRange(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Response copied to clipboard', {
      icon: <Check size={16} className="text-emerald-400" />
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Spark AI Analysis: ' + (message.content.substring(0, 50) + '...'),
          text: message.content,
          url: window.location.href
        });
        toast.success('Successfully shared');
      } catch (error: any) {
        // AbortError means user cancelled the share dialog - we should ignore it
        if (error.name !== 'AbortError') {
          console.error('Sharing failed', error);
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.23, 1, 0.32, 1]
      }}
      className={`flex flex-col gap-6 w-full max-w-4xl mx-auto py-8 px-4 sm:py-12 sm:px-6 ${isAssistant ? '' : 'border-b border-white/[0.03]'} transition-all duration-700`}
    >
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="flex items-center gap-4"
      >
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${isAssistant ? 'bg-gradient-to-br from-brand to-brand-dark text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
          {isAssistant ? <Sparkles size={20} /> : <User size={20} />}
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg tracking-tight">
            {isAssistant ? 'Spark Search' : 'You'}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </motion.div>

      <div className="flex flex-col gap-8 pl-0 sm:pl-14 overflow-visible">
        {!isAssistant && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl sm:text-2xl font-medium text-slate-100 leading-tight"
          >
            {message.content}
          </motion.p>
        )}
        
        {isAssistant && (
          <div className="flex flex-col gap-8">
            {/* Top Row: Sources & Media (Foundation) */}
            <div className="flex flex-col gap-6">
              {/* Perplexity Style Source Pills & Cards - Always show if available */}
              {message.sources && message.sources.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                      <Layers size={14} className="text-brand-light" /> Reference Knowledge
                    </div>
                    {message.sources.length > 4 && (
                       <button 
                         onClick={() => setIsSourcesOpen(!isSourcesOpen)}
                         className="text-[10px] font-bold text-brand hover:text-brand-light transition-colors"
                       >
                         {isSourcesOpen ? 'Hide' : `View all ${message.sources.length}`}
                       </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {message.sources.slice(0, isSourcesOpen ? 12 : 4).map((s, idx) => (
                      <motion.a 
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + (idx * 0.05), duration: 0.4 }}
                        href={s.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex flex-col gap-2 p-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-brand/30 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-brand/20">
                            <span className="text-[8px] font-bold text-slate-500 group-hover:text-brand">{idx + 1}</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase truncate group-hover:text-white">{s.source || new URL(s.url).hostname}</span>
                        </div>
                        <h4 className="text-[11px] font-medium text-slate-200 line-clamp-2 leading-tight group-hover:text-brand-light">{s.title}</h4>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Image / Media Row */}
              {message.media && message.media.length > 0 && (
                <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex flex-col gap-3"
                >
                  <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {message.media.map((media, idx) => (
                      <a 
                        key={idx} 
                        href={media.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="relative w-40 h-28 sm:w-56 sm:h-36 flex-shrink-0 rounded-xl overflow-hidden group border border-white/10 bg-black/50 shadow-2xl transition-transform hover:scale-[1.02]"
                      >
                        <img 
                          src={media.thumbnail || media.url} 
                          alt={media.source}
                          loading="lazy"
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100" />
                        <div className="absolute inset-x-0 bottom-0 p-3 pt-6">
                          <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate drop-shadow-md">{media.source}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>


            {/* Answer Region */}
            <div className="flex flex-col gap-6">
              {/* Streaming Content */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative group/content"
                ref={containerRef}
              >
                <div ref={contentRef} className="markdown-body text-slate-100 text-base sm:text-lg leading-relaxed selection:bg-brand/30 min-h-[2em]">
                  {message.content ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (message.status === 'writing' || message.status === 'thinking') ? (
                    <div className="flex flex-col gap-4 animate-pulse">
                      <div className="h-4 bg-white/10 rounded-xl w-3/4" />
                      <div className="h-4 bg-white/10 rounded-xl w-5/6" />
                      <div className="h-4 bg-white/10 rounded-xl w-2/3" />
                    </div>
                  ) : null}
                </div>
                
                <AnimatePresence>
                  {selectionRange && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: -55, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      style={{ 
                        position: 'absolute',
                        left: `${selectionRange.x}px`,
                        top: `${selectionRange.y}px`,
                        transform: 'translateX(-50%)',
                        zIndex: 100
                      }}
                      className="pointer-events-auto"
                    >
                      <button 
                        onMouseDown={handleAskSpark}
                        className="flex items-center gap-2.5 bg-brand text-white px-5 py-2.5 rounded-full shadow-[0_15px_40px_rgba(59,130,246,0.6)] whitespace-nowrap font-bold text-xs hover:scale-110 active:scale-90 transition-all animate-shimmer bg-[linear-gradient(110deg,#3b82f6,45%,#60a5fa,55%,#3b82f6)] bg-[length:200%_100%] border border-white/30 backdrop-blur-sm"
                      >
                        <MessageSquarePlus size={16} />
                        Ask Spark Intelligence
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {message.status === 'complete' && (
                  <div className="flex flex-wrap items-center gap-2 mt-8 pt-5 border-t border-white/5">
                    <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 shadow-inner">
                      <ActionTooltip text={feedback === 'like' ? "Liked" : "Like Response"}>
                        <button 
                          onClick={() => {
                            const newFeedback = feedback === 'like' ? null : 'like';
                            setFeedback(newFeedback);
                            if (newFeedback === 'like') {
                              toast.success("Thanks! Hope you loved it.", {
                                description: "Your feedback helps us improve Spark Search.",
                              });
                            }
                          }}
                          className={`p-2.5 rounded-xl transition-all duration-300 ${feedback === 'like' ? 'bg-brand/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'}`}
                        >
                          <ThumbsUp size={18} />
                        </button>
                      </ActionTooltip>
                      <ActionTooltip text={feedback === 'dislike' ? "Disliked" : "Dislike Response"}>
                        <button 
                          onClick={() => {
                            const newFeedback = feedback === 'dislike' ? null : 'dislike';
                            setFeedback(newFeedback);
                            if (newFeedback === 'dislike') {
                              toast.info("We're sorry. We'll improve.", {
                                description: "Our team has been alerted to refine this response path.",
                              });
                            }
                          }}
                          className={`p-2.5 rounded-xl transition-all duration-300 ${feedback === 'dislike' ? 'bg-red-500/30 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'}`}
                        >
                          <ThumbsDown size={18} />
                        </button>
                      </ActionTooltip>
                    </div>

                    <div className="flex items-center gap-2">
                      <ActionTooltip text="Copy to clipboard">
                        <button 
                          onClick={handleCopy}
                          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest px-4 group"
                        >
                          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="group-hover:scale-110 transition-transform" />}
                          <span className={copied ? 'text-emerald-400' : ''}>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </ActionTooltip>
                      <ActionTooltip text="Share analysis">
                        <button 
                          onClick={handleShare}
                          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all group"
                        >
                          <Share2 size={18} className="group-hover:rotate-12 transition-transform" />
                        </button>
                      </ActionTooltip>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Thinking Indicator (Advanced Perplexity Style) */}
              <AnimatePresence mode="wait">
                {message.status !== 'complete' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
                    className="flex flex-col gap-6 mb-12"
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="w-10 h-10 rounded-full border-2 border-brand/10 border-t-brand shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div 
                             animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                             transition={{ duration: 2, repeat: Infinity }}
                             className="w-2.5 h-2.5 bg-brand rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-brand uppercase tracking-[0.4em] animate-pulse">
                            Spark Reasoning Engine
                          </span>
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-500 animate-pulse">
                            <div className="w-1 h-1 rounded-full bg-red-500" />
                            LIVE INTEL
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                             Neural Mesh active
                           </span>
                           <div className="w-1 h-1 rounded-full bg-slate-700" />
                           <span className="text-[10px] text-brand-light font-bold uppercase tracking-tighter">
                             Real-Time Verification
                           </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative pl-12">
                      {/* Vertical Progress Line with dynamic fill */}
                      <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-white/5 overflow-hidden rounded-full">
                        <motion.div 
                          animate={{ 
                            height: message.status === 'writing' ? '100%' : '50%',
                            opacity: [0.2, 0.5, 0.2]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-full bg-brand shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                        />
                      </div>

                      <div className="flex flex-col gap-5">
                        {message.thoughts && message.thoughts.length > 0 && message.thoughts.map((thought, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: -15, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="flex items-center gap-4"
                          >
                            <div className="w-6 h-6 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
                              <Check size={12} className="text-brand-light" />
                            </div>
                            <span className="text-sm text-slate-200 font-medium tracking-tight">
                              {thought}
                            </span>
                          </motion.div>
                        ))}
                        
                        {/* Thinking status indicator */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-4 pl-1"
                        >
                            <div className="w-4 h-4 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
                            <span className="text-xs text-brand font-black uppercase tracking-[0.3em] italic animate-pulse">
                              {message.status === 'thinking' ? 'Scanning Global Nodes...' : 'Crystallizing Final Logic...'}
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>

              {/* Post-completion Intel */}
              {message.status === 'complete' && (
                <div className="flex flex-col gap-10 mt-6">
                  {/* Summary / Digest - Move this higher if present? No, let's keep it here or remove if answer is enough */}
                  {message.summary && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-brand/5 border-l-2 border-brand/40 p-5 rounded-r-xl"
                    >
                      <p className="text-slate-400 text-sm leading-relaxed italic italic">
                        {message.summary}
                      </p>
                    </motion.div>
                  )}

                  {/* Related Queries */}
                  {message.relatedQueries && message.relatedQueries.length > 0 && (
                    <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                         <MessageSquarePlus size={14} className="text-brand-light" /> Further Discovery
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {message.relatedQueries.map((rq, idx) => (
                           <button 
                             key={idx} 
                             onClick={() => onSend && onSend(rq)}
                             className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 hover:bg-brand hover:text-white hover:border-brand transition-all text-xs font-medium group"
                           >
                              {rq}
                              <ArrowRight size={12} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                           </button>
                         ))}
                      </div>
                    </div>
                  )}

                  {/* Guest Mode Attribution */}
                  {isGuest && (
                    <div className="flex justify-center pt-8">
                       <div className="px-4 py-2 bg-white/[0.02] border border-white/5 rounded-full flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                             Intelligence synthesized via Spark Reference Library (Wikipedia Guest Access)
                          </span>
                       </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
