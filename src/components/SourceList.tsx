import React from 'react';
import { SearchResult } from '../types';
import { ExternalLink, Globe, Search, Link as LinkIcon, PlaySquare, Hash, BookOpen, Rss, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface SourceListProps {
  sources: SearchResult[];
}

export const SourceList: React.FC<SourceListProps> = ({ sources }) => {

  const getSourceIcon = (sourceName: string, category: string) => {
    const s = sourceName.toLowerCase();
    if (category === 'News') return <Rss size={8} />;
    if (s.includes('twitter') || s.includes('x ')) return <Hash size={8} />;
    if (s.includes('instagram')) return <Hash size={8} />;
    if (s.includes('youtube')) return <PlaySquare size={8} />;
    if (s.includes('official website')) return <LinkIcon size={8} />;
    if (s.includes('verified') || s.includes('reference')) return <BookOpen size={8} />;
    return category === 'Reference' ? <Search size={8} /> : <Globe size={8} />;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">
         <Layers size={14} className="text-slate-600" />
         Sources
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sources.map((source, idx) => (
          <motion.a
            key={idx}
            href={source.url}
            target="_blank"
            rel="no-referrer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.02 }}
            className="source-card group flex flex-col justify-between overflow-hidden bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 rounded-xl p-3 h-[90px]"
          >
            <div className="flex flex-col gap-1.5">
              <h4 className="text-[11px] font-bold text-slate-200 line-clamp-2 group-hover:text-brand transition-colors leading-[1.3]">
                {source.title}
              </h4>
            </div>
            
            <div className="flex items-center gap-2 mt-auto opacity-60 group-hover:opacity-100 transition-opacity">
              <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand transition-colors">
                {getSourceIcon(source.source, source.category || 'Web')}
              </div>
              <span className="text-[9px] font-medium text-slate-500 truncate">{source.source}</span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
};
