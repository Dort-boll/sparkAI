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
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

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
            {isAssistant ? 'Spark Intelligence' : 'You'}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-8 pl-0 sm:pl-14">
        {!isAssistant && (
          <p className="text-xl sm:text-2xl font-medium text-slate-100 leading-tight italic">
            "{message.content}"
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
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-brand rounded-full animate-ping" />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand uppercase tracking-[0.2em] animate-pulse">
                      Synthesizing Research Dossier...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isAssistant && (
               <>
                 {/* Intelligence Vectors Button & Collapsible */}
                 {message.status === 'complete' && message.sources && message.sources.length > 0 && (
                   <div className="mb-6">
                     <button 
                       onClick={() => setIsSourcesOpen(!isSourcesOpen)}
                       className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl py-2.5 px-5 text-xs transition-all group"
                     >
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isSourcesOpen ? 'bg-brand/20 text-brand' : 'bg-white/10 text-slate-400'}`}>
                         <Layers size={10} />
                       </div>
                       <span className={`font-bold uppercase tracking-widest ${isSourcesOpen ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                         {message.sources.length} Intelligence Vectors
                       </span>
                       <ChevronDown size={14} className={`ml-2 transition-transform duration-300 ${isSourcesOpen ? "rotate-180 text-brand" : "text-slate-500"}`} />
                     </button>

                     <AnimatePresence>
                       {isSourcesOpen && (
                         <motion.div 
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           exit={{ opacity: 0, height: 0 }}
                           className="overflow-hidden mt-4"
                         >
                           <div className="p-1">
                             <SourceList sources={message.sources} />
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 )}

                 {/* Media Discovery Row */}
                 {message.status === 'complete' && message.media && message.media.length > 0 && (
                   <div className="mb-8 mt-2">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
                       <ImageIcon size={14} className="text-brand-light" /> Visual Archive Results
                     </div>
                     <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                       {message.media.map((media, idx) => (
                         <a 
                           key={idx} 
                           href={media.url} 
                           target="_blank" 
                           rel="noreferrer"
                           className="relative w-44 h-32 rounded-xl overflow-hidden group border border-white/10 bg-black/50"
                         >
                           <img 
                             src={media.thumbnail || media.url} 
                             alt={media.source}
                             loading="lazy"
                             className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                             <p className="text-[9px] font-bold text-white/90 uppercase tracking-wider truncate">{media.source}</p>
                           </div>
                         </a>
                       ))}
                     </div>
                   </div>
                 )}

                 {message.summary && message.status === 'complete' && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-brand/5 border border-brand/20 p-6 rounded-2xl text-slate-300 text-sm leading-relaxed mb-8 shadow-2xl relative overflow-hidden group"
                   >
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                       <SearchIcon size={64} />
                     </div>
                     <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-brand-light uppercase tracking-[0.2em]">
                       <SearchIcon size={14} />
                       Primary Intelligence Marker
                     </div>
                     <div className="opacity-90 markdown-body text-sm relative z-10">
                       <ReactMarkdown>{message.summary}</ReactMarkdown>
                     </div>
                   </motion.div>
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
