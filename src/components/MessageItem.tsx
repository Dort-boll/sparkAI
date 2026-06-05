import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';
import { SourceList } from './SourceList';
import { motion, AnimatePresence } from 'motion/react';
import { ActionTooltip } from './ActionTooltip';
import { Sparkles, User, Search as SearchIcon, Image as ImageIcon, ChevronDown, Layers, ArrowRight, Copy, Check, Share2, ThumbsUp, ThumbsDown, MessageSquarePlus, Cpu, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { AILoader } from './AILoader';

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
    let selectionTimeout: any = null;

    const handleSelection = () => {
      if (selectionTimeout) clearTimeout(selectionTimeout);
      
      // Delay slightly to allow selection handles and coordinates to settle on mobile
      selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
          setSelectionRange(null);
          return;
        }

        try {
          const range = selection.getRangeAt(0);
          const isWithinContent = contentRef.current?.contains(range.commonAncestorContainer);
          
          if (isWithinContent) {
            const rect = range.getBoundingClientRect();
            const containerRect = containerRef.current?.getBoundingClientRect();
            
            if (containerRect && rect.width > 0) {
              const centerX = rect.left - containerRect.left + rect.width / 2;
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
        } catch (e) {
          setSelectionRange(null);
        }
      }, 100);
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    return () => {
      if (selectionTimeout) clearTimeout(selectionTimeout);
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
          title: 'Spark Search Analysis: ' + (message.content.substring(0, 50) + '...'),
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

                  <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-4 gap-3">
                    {message.sources.slice(0, isSourcesOpen ? 12 : 4).map((s, idx) => {
                      let displaySource = s.source;
                      if (!displaySource && s.url) {
                        try {
                          if (s.url.startsWith('http')) {
                            displaySource = new URL(s.url).hostname;
                          } else {
                            displaySource = 'Internal';
                          }
                        } catch (e) {
                          displaySource = 'Reference';
                        }
                      }
                      
                      return (
                        <motion.a 
                          key={idx}
                          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          transition={{ delay: 0.15 + (idx * 0.05), duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                          href={s.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex flex-col justify-between gap-2.5 p-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-brand/30 rounded-xl transition-all group min-h-[92px]"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-brand/20">
                                <span className="text-[8px] font-bold text-slate-500 group-hover:text-brand">{idx + 1}</span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase truncate group-hover:text-white">{displaySource || 'Reference'}</span>
                            </div>
                            <h4 className="text-[11px] font-semibold text-slate-200 line-clamp-2 leading-snug group-hover:text-brand-light">{s.title}</h4>
                          </div>
                          {s.url && s.url !== '#' && (
                            <span className="text-[9px] text-slate-500 font-mono truncate group-hover:text-slate-300 block pt-1 border-t border-white/5 mt-auto">
                              {s.url.replace(/^https?:\/\/(www\.)?/, '')}
                            </span>
                          )}
                        </motion.a>
                      );
                    })}
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
              {/* Collapsible Deep Reasoning Block shown during writing/complete status */}
              {message.thoughts && message.thoughts.length > 0 && message.status !== 'thinking' && (
                <div className="border border-white/5 bg-[#ffffff]/[0.015] rounded-2xl overflow-hidden transition-all max-w-3xl shadow-xl hover:border-brand/20 duration-300">
                  <button 
                    onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                    className="flex items-center justify-between w-full p-4.5 hover:bg-white/[0.03] transition-all text-xs font-bold text-slate-400 hover:text-slate-200 select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-brand" />
                        <div className="absolute w-4.5 h-4.5 rounded-full border border-brand/50 animate-ping opacity-30 pointer-events-none" style={{ animationDuration: '3.s' }} />
                      </div>
                      <span className="uppercase tracking-[0.14em] font-display text-slate-300">
                        {message.status === 'writing' ? 'Synthesizing knowledge engine...' : 'Thought process completed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-slate-500 font-mono bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded">
                        {message.thoughts.length} stages verified
                      </span>
                      <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isThinkingOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isThinkingOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t border-white/5"
                      >
                        <div className="p-5 bg-black/50 flex flex-col gap-4 font-mono text-[11px] leading-relaxed text-slate-400">
                          {message.thoughts.map((thought, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.25, delay: idx * 0.04 }}
                              className="flex items-start gap-3.5 border-b border-white/[0.02] last:border-0 pb-2.5 last:pb-0"
                            >
                              <div className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 font-sans text-[8px] font-bold">✓</div>
                              <span className="text-slate-300" dangerouslySetInnerHTML={{ __html: thought }} />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Streaming Content */}
              <motion.div 
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative group/content"
                ref={containerRef}
              >
                <div ref={contentRef} className={`markdown-body ${message.status === 'writing' ? 'streaming' : ''} text-slate-100 text-base sm:text-lg leading-relaxed selection:bg-brand/30 min-h-[2em]`}>
                  {message.content ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : message.status === 'writing' ? (
                    <div className="flex flex-col gap-4 p-5 sm:p-6 border border-white/5 bg-white/[0.015] rounded-2xl max-w-md shadow-xl backdrop-blur-md relative overflow-hidden animate-fade-in">
                      <AILoader states={[
                        "Initializing secure pipeline...",
                        "Formatting web response stream...",
                        "Running high-precision synthesis...",
                        "Securing intelligence pipeline..."
                      ]} />
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
                        Ask Spark Search
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

              {/* Thinking Indicator (Advanced Spark Real-Time Web Search & Reasoning) */}
              <AnimatePresence mode="wait">
                {message.status === 'thinking' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25 } }}
                    className="flex flex-col gap-6 mb-12 w-full max-w-3xl border border-white/5 bg-gradient-to-b from-[#ffffff]/[0.02] to-transparent p-5 sm:p-6 rounded-[1.5rem] shadow-xl backdrop-blur-md relative"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-10 h-10 rounded-xl bg-brand/5 border border-brand/20 flex items-center justify-center text-brand shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                          <SearchIcon className="w-4.5 h-4.5 animate-pulse" />
                          <div className="absolute inset-0 rounded-xl border border-brand/40 animate-ping opacity-25 pointer-events-none" style={{ animationDuration: '3.5s' }} />
                        </div>
                        <div>
                          <h4 className="text-sm font-display font-bold text-white tracking-tight leading-none mb-1">
                            Active Synthesis Protocol
                          </h4>
                          <p className="text-[10px] text-slate-400 leading-none">
                            Analyzing domains, tracking live web nodes, and preparing context
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-[9px] font-black text-brand tracking-widest uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                          LIVE WEB RESEARCHING
                        </span>
                      </div>
                    </div>

                    <div className="relative pl-6 sm:pl-8 py-1">
                      {/* Vertical Progress Line with dynamic glow */}
                      <div className="absolute left-[3px] sm:left-[6px] top-0 bottom-0 w-[1.5px] bg-white/[0.04] overflow-hidden rounded-full">
                        <motion.div 
                          animate={{ 
                            top: ['-100%', '100%']
                          }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                          className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-brand to-transparent shadow-[0_0_10px_#3b82f6]"
                        />
                      </div>

                      <div className="flex flex-col gap-4.5">
                        {message.thoughts && message.thoughts.length > 0 && message.thoughts.map((thought, idx) => {
                          const isLatest = idx === message.thoughts.length - 1;
                          return (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4 }}
                              className="flex items-start gap-3.5"
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 font-sans ${isLatest ? 'bg-brand/10 border border-brand/35 text-brand shadow-[0_0_12px_rgba(59,130,246,0.2)]' : 'bg-emerald-500/10 border border-emerald-500/15 text-emerald-400'}`}>
                                {isLatest ? (
                                  <div className="w-1.5 h-1.5 bg-brand rounded-full animate-ping" />
                                ) : (
                                  <Check size={10} className="stroke-[3px]" />
                                )}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className={`text-[12px] font-medium leading-relaxed font-mono ${isLatest ? 'text-white' : 'text-slate-400'}`} dangerouslySetInnerHTML={{ __html: thought }} />
                                {isLatest && (
                                  <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase animate-pulse">Running high-precision compute step...</span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                        
                        {/* Interactive dynamic step that coordinates thinking progress */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-3.5 pl-0.5"
                        >
                          <div className="w-4 h-4 rounded bg-brand/5 border border-brand/15 flex items-center justify-center shrink-0">
                            <div className="w-2 h-2 border-[1.5px] border-brand/25 border-t-brand rounded-full animate-spin" />
                          </div>
                          <span className="text-[10px] font-bold text-brand/80 uppercase tracking-[0.16em] font-display">
                            Spark Reasoning Core Processing Web Insights...
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
                             Intelligence synthesized via Spark Search Mesh
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
