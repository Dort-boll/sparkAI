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
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onSend }) => {
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Spark AI Analysis: ' + (message.content.substring(0, 50) + '...'),
        text: message.content,
        url: window.location.href
      }).then(() => {
        toast.success('Successfully shared');
      }).catch(console.error);
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8, 
        ease: [0.23, 1, 0.32, 1],
        layout: { duration: 0.4 }
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
              {/* Perplexity Style Source Pills - Always show if available */}
              {message.sources && message.sources.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-2"
                >
                  <div className="w-full flex items-center gap-2 mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Layers size={12} className="text-brand-light" /> Reference Sources
                  </div>
                  {message.sources.slice(0, 5).map((s, idx) => (
                    <motion.a 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + (idx * 0.05), duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      href={s.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full py-1.5 px-3 text-[10px] transition-all group hover:border-brand/40"
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand/20">
                        <SearchIcon size={8} className="text-slate-400 group-hover:text-brand" />
                      </div>
                      <span className="truncate max-w-[100px] text-slate-400 group-hover:text-white font-medium">{s.title}</span>
                    </motion.a>
                  ))}
                  {message.sources.length > 5 && (
                    <motion.button 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      onClick={() => setIsSourcesOpen(!isSourcesOpen)}
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full py-1.5 px-3 text-[10px] text-slate-500 hover:text-white transition-all"
                    >
                      +{message.sources.length - 5} more
                    </motion.button>
                  )}
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
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="relative group/content"
                ref={containerRef}
              >
                <div ref={contentRef} className="markdown-body text-slate-100 text-base sm:text-lg leading-relaxed selection:bg-brand/30">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
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

              {/* Thinking/Reasoning Indicator */}
              <AnimatePresence mode="wait">
                {message.status !== 'complete' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                    className="glass-card !p-5 !rounded-2xl border-brand/20 bg-brand/[0.02] mb-6 overflow-hidden relative shadow-[0_0_40px_rgba(59,130,246,0.05)]"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand animate-pulse" />
                    <div className="flex items-center gap-3 mb-4 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles size={14} className="text-brand animate-pulse" />
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-brand uppercase tracking-[0.2em] animate-pulse">
                          Spark Analytical Engine
                        </span>
                      </div>
                      <div className="px-2.5 py-1 bg-brand/10 border border-brand/20 rounded-lg text-[9px] font-bold text-brand-light uppercase tracking-tighter">
                         Nvidia Nemotron Active
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2.5 relative">
                      <div className="absolute left-[7px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-brand/40 to-transparent" />
                      {message.thoughts && message.thoughts.length > 0 && message.thoughts.slice(-3).map((thought, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center gap-3 text-[11px] font-medium text-slate-400 pl-6 relative"
                        >
                          <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#020617] border border-brand/40 flex items-center justify-center z-10">
                            <div className="w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                          </div>
                          <span className="text-slate-200 line-clamp-2 md:line-clamp-none">{thought}</span>
                        </motion.div>
                      ))}
                      {message.status !== 'complete' && (
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 animate-pulse mt-2 pl-6 italic">
                          <div className="w-1.5 h-1.5 bg-brand/30 rounded-full mr-2" />
                          <span>Generating synthesis...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Post-completion Detail Sections */}
              {message.status === 'complete' && (
                <div className="flex flex-col gap-10 mt-4">
                  {/* Reasoning Path (Toggleable) */}
                  {message.thoughts && message.thoughts.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <button 
                        onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors w-fit"
                      >
                        <Sparkles size={14} className={isThinkingOpen ? "text-brand" : ""} />
                        {isThinkingOpen ? "Hide Strategy" : "View Reasoning Path"}
                        <ChevronDown size={14} className={`transition-transform duration-300 ${isThinkingOpen ? "rotate-180" : ""}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isThinkingOpen && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden"
                          >
                            <div className="p-5 flex flex-col gap-3 relative">
                              <div className="absolute left-7 top-6 bottom-6 w-[1px] bg-gradient-to-b from-brand/40 to-transparent" />
                              {message.thoughts.map((thought, idx) => (
                                <div key={idx} className="flex items-start gap-4 text-xs font-medium text-slate-400 pl-2">
                                  <div className="mt-1 w-2 h-2 rounded-full bg-[#020617] border border-brand/40 flex items-center justify-center flex-shrink-0 z-10 relative">
                                    <div className="w-1 h-1 bg-brand rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                  </div>
                                  <span className="leading-relaxed">{thought}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Summary / Digest */}
                  {message.summary && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.7 }}
                      className="bg-brand/5 border-l-2 border-brand/40 p-6 rounded-r-2xl"
                    >
                      <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-brand-light uppercase tracking-[0.2em]">
                        <SearchIcon size={14} /> Knowledge Synthesis
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed italic">
                        {message.summary}
                      </p>
                    </motion.div>
                  )}

                  {/* Knowledge Map (Collapsed by default) */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <div 
                        onClick={() => setIsSourcesOpen(!isSourcesOpen)}
                        className="flex items-center justify-between group cursor-pointer select-none px-4 py-3 border border-white/5 bg-white/[0.01] rounded-2xl transition-all hover:bg-white/[0.03] hover:border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <Layers size={14} className="text-slate-500" />
                          <h3 className="text-xs font-bold text-slate-400 tracking-tight flex items-center gap-2">
                            Comprehensive Knowledge Map
                            <span className="text-[10px] text-slate-600 font-bold bg-white/5 px-2 py-0.5 rounded-full">{message.sources.length}</span>
                          </h3>
                        </div>
                        <div className={`w-6 h-6 rounded-full border border-white/5 flex items-center justify-center text-slate-500 transition-all duration-500 ${isSourcesOpen ? 'rotate-180 text-white' : ''}`}>
                          <ChevronDown size={14} />
                        </div>
                      </div>

                      <AnimatePresence>
                        {isSourcesOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 border border-white/5 bg-white/[0.005] rounded-2xl">
                               <SourceList sources={message.sources} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Related Queries */}
                  {message.relatedQueries && message.relatedQueries.length > 0 && (
                    <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                         <Layers size={14} /> Explore Further
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {message.relatedQueries.map((rq, idx) => (
                           <button 
                             key={idx} 
                             onClick={() => onSend && onSend(rq)}
                             className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-4 hover:bg-brand/10 hover:border-brand/30 transition-all text-xs text-slate-400 group"
                           >
                              {rq}
                              <ArrowRight size={12} className="text-slate-600 group-hover:text-brand" />
                           </button>
                         ))}
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
