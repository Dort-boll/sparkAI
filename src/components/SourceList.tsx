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
    if (s.includes('reference') || s.includes('library')) return <BookOpen size={8} />;
    return category === 'Reference' ? <Search size={8} /> : <Globe size={8} />;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {sources.map((source, idx) => (
          <motion.a
            key={idx}
            href={source.url}
            target="_blank"
            rel="no-referrer"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="group flex flex-col justify-between overflow-hidden bg-white/[0.02] backdrop-blur-md border border-white/5 hover:bg-white/[0.08] hover:border-brand/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all duration-500 rounded-2xl p-4 h-[100px] relative"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-col gap-1.5 relative z-10">
              <h4 className="text-[11px] font-bold text-slate-100 line-clamp-2 group-hover:text-brand-light transition-colors leading-[1.4] tracking-tight">
                {source.title}
              </h4>
            </div>
            
            <div className="flex items-center gap-2 mt-auto relative z-10">
              <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-light group-hover:bg-brand/10 transition-all">
                {getSourceIcon(source.source, source.category || 'Web')}
              </div>
              <span className="text-[9px] font-bold text-slate-500 group-hover:text-slate-300 uppercase tracking-wider truncate">{source.source}</span>
            </div>
          </motion.a>
      ))}
    </div>
  );
};
