import React, { useState } from 'react';
import { CustomSource } from '../types';
import { Plus, X, Globe, FileText, Link as LinkIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SourceManagerProps {
  sources: CustomSource[];
  onAdd: (source: Omit<CustomSource, 'id'>) => void;
  onRemove: (id: string) => void;
}

export const SourceManager: React.FC<SourceManagerProps> = ({ sources, onAdd, onRemove }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'url' | 'text'>('url');
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd({ type, value: value.trim() });
      setValue('');
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold text-slate-300 uppercase tracking-widest shadow-xl"
      >
        <Plus size={14} className={isOpen ? 'rotate-45' : ''} />
        Custom Sources ({sources.length})
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-[calc(100vw-2rem)] sm:w-80 glass-card !p-0 z-[60] overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Add Knowledge Source</h3>
              
              <div className="flex gap-2 mb-4 bg-white/5 p-1 rounded-lg">
                <button 
                  onClick={() => setType('url')}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${type === 'url' ? 'bg-brand text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  URL
                </button>
                <button 
                  onClick={() => setType('text')}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${type === 'text' ? 'bg-brand text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Raw Text
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {type === 'url' ? (
                  <div className="relative">
                    <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="url"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="https://example.com/data"
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                ) : (
                  <textarea 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Paste context here..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand min-h-[80px] resize-none"
                  />
                )}
                <button 
                  type="submit"
                  disabled={!value.trim()}
                  className="bg-brand hover:bg-brand-dark text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  Index Source
                </button>
              </form>
            </div>

            <div className="max-h-48 overflow-y-auto p-4 flex flex-col gap-2">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Indexed Sources</div>
              {sources.length === 0 && (
                <div className="text-[10px] text-slate-600 text-center py-4">No custom sources added</div>
              )}
              {sources.map(source => (
                <div key={source.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white/5 group">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {source.type === 'url' ? <Globe size={12} className="text-brand-light" /> : <FileText size={12} className="text-brand-light" />}
                    <span className="text-[10px] text-slate-300 truncate font-mono">
                      {source.value}
                    </span>
                  </div>
                  <button 
                    onClick={() => onRemove(source.id)}
                    className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
