import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';
import { SourceList } from './SourceList';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, User, Search as SearchIcon, Image as ImageIcon, ChevronDown, Layers, ArrowRight } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  onSend?: (query: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onSend }) => {
  const isAssistant = message.role === 'assistant';
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`flex flex-col gap-6 w-full max-w-4xl mx-auto py-8 px-4 sm:py-12 sm:px-6 ${isAssistant ? '' : 'border-b border-white/[0.03]'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${isAssistant ? 'bg-gradient-to-br from-brand to-brand-dark text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
          {isAssistant ? <Sparkles size={20} /> : <User size={20} />}
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg tracking-tight">
            {isAssistant ? 'Spark AI' : 'You'}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-8 pl-0 sm:pl-14">
        {!isAssistant && (
          <p className="text-xl sm:text-2xl font-medium text-slate-100 leading-tight">
            {message.content}
          </p>
        )}

        {isAssistant && (
          <>
            <AnimatePresence mode="wait">
              {isAssistant && message.status !== 'complete' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card !p-5 !rounded-2xl border-brand/20 bg-brand/[0.02] mb-6 overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand animate-pulse" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-brand rounded-full animate-ping" />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand uppercase tracking-[0.2em] animate-pulse">
                      Spark Reasoning Core
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2.5 relative">
                    <div className="absolute left-[7px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-brand/40 gap-4 to-transparent" />
                    {message.thoughts?.map((thought, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 text-[11px] font-medium text-slate-400 group overflow-hidden"
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-[#020617] border border-brand/40 flex items-center justify-center z-10 relative">
                          <div className="w-1 h-1 bg-brand rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                        </div>
                        <span className="group-hover:text-slate-200 transition-colors">{thought}</span>
                      </motion.div>
                    ))}
                    {message.status === 'thinking' && (
                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 animate-pulse mt-1 pl-6 italic">
                        <div className="w-3.5 h-3.5 flex items-center justify-center">
                          <div className="w-1 h-1 bg-brand/30 rounded-full" />
                        </div>
                        Cross-referencing indexed facts for depth...
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isAssistant && (
               <>
                 {/* Perplexity Style Source Pills */}
                 {message.status === 'complete' && message.sources && message.sources.length > 0 && (
                   <div className="flex flex-wrap gap-2 mb-6">
                     {message.sources.map((s, idx) => (
                       <a key={idx} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full py-1.5 px-3 text-xs transition-colors group">
                         <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand/20">
                           <SearchIcon size={8} className="text-slate-400 group-hover:text-brand" />
                         </div>
                         <span className="truncate max-w-[120px] sm:max-w-[180px] text-slate-300 group-hover:text-white font-medium">{s.title}</span>
                       </a>
                     ))}
                   </div>
                 )}

                 {/* Collapsible Completed Thinking Block */}
                 {message.status === 'complete' && message.thoughts && message.thoughts.length > 0 && (
                   <div className="mb-6">
                     <button 
                       onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                       className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 uppercase tracking-widest transition-colors"
                     >
                       <Sparkles size={14} className={isThinkingOpen ? "text-brand" : ""} />
                       {isThinkingOpen ? "Hide Reasoning" : "View Reasoning"}
                       <ChevronDown size={14} className={`transition-transform duration-300 ${isThinkingOpen ? "rotate-180 text-brand" : ""}`} />
                     </button>
                     
                     <AnimatePresence>
                       {isThinkingOpen && (
                         <motion.div 
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           exit={{ opacity: 0, height: 0 }}
                           className="glass-card !p-4 !rounded-xl border-white/5 bg-white/[0.01] overflow-hidden mt-3"
                         >
                           <div className="flex flex-col gap-2 relative">
                             <div className="absolute left-[7px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-brand/40 gap-4 to-transparent" />
                             {message.thoughts.map((thought, idx) => (
                               <div key={idx} className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                                 <div className="w-3.5 h-3.5 rounded-full bg-[#020617] border border-brand/40 flex items-center justify-center z-10 relative flex-shrink-0">
                                   <div className="w-1 h-1 bg-brand rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                 </div>
                                 <span>{thought}</span>
                               </div>
                             ))}
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 )}

                 {/* Image / Media Row */}
                 {message.status === 'complete' && message.media && message.media.length > 0 && (
                   <div className="mb-6">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
                       <ImageIcon size={14} className="text-brand-light" /> Media Discovery
                     </div>
                     <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                       {message.media.map((media, idx) => (
                         <a 
                           key={idx} 
                           href={media.url} 
                           target="_blank" 
                           rel="noreferrer"
                           className="relative w-40 h-28 sm:w-48 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden group border border-white/10 bg-black/50"
                         >
                           <img 
                             src={media.thumbnail || media.url} 
                             alt={media.source}
                             loading="lazy"
                             className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                           />
                           <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                             <p className="text-[9px] font-bold text-white/80 uppercase tracking-wider truncate">{media.source}</p>
                           </div>
                         </a>
                       ))}
                     </div>
                   </div>
                 )}

                 {message.summary && message.status === 'complete' && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     className="bg-brand/5 border-l-2 border-brand/50 p-6 rounded-r-2xl text-slate-300 text-sm leading-relaxed mb-6 flex flex-col"
                   >
                     <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-brand-light uppercase tracking-[0.2em] shrink-0">
                       <SearchIcon size={14} />
                       Deep Instant Answer (Full Extracted Summary)
                     </div>
                     <div className="opacity-90 markdown-body text-sm relative">
                       <ReactMarkdown>{message.summary}</ReactMarkdown>
                     </div>
                   </motion.div>
                 )}

                 {message.sources && message.sources.length > 0 && (
                   <div className="flex flex-col gap-4 mb-8 mt-6 border-t border-white/5 pt-6">
                     <SourceList sources={message.sources} />
                   </div>
                 )}
               </>
            )}
            
            <div className="markdown-body">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            
            {isAssistant && message.status === 'writing' && message.content === '' && (
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-full bg-white/5 rounded shimmer" />
                  <div className="h-4 w-[90%] bg-white/5 rounded shimmer" />
                  <div className="h-4 w-[40%] bg-white/5 rounded shimmer" />
                </div>
              </div>
            )}
            
            {isAssistant && message.status === 'complete' && message.relatedQueries && message.relatedQueries.length > 0 && (
              <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                   <Layers size={14} /> Related
                </div>
                <div className="flex flex-col gap-2 relative z-10 w-full sm:max-w-2xl">
                   {message.relatedQueries.map((rq, idx) => (
                     <button 
                       key={idx} 
                       onClick={() => onSend && onSend(rq)}
                       className="flex items-center justify-between text-left w-full py-3 px-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-brand/30 transition-all text-sm text-slate-300 group"
                     >
                        {rq}
                        <ArrowRight size={14} className="text-slate-600 group-hover:text-brand" />
                     </button>
                   ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
