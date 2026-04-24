import React from 'react';
import { RAGSettings } from '../types';
import { motion } from 'motion/react';
import { X, Sliders, Info, Zap, Search, Layers } from 'lucide-react';

interface Props {
  settings: RAGSettings;
  onSettingsChange: (settings: RAGSettings) => void;
  onClose: () => void;
}

export function RAGSettingsPanel({ settings, onSettingsChange, onClose }: Props) {
  const updateSetting = (key: keyof RAGSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-0 left-0 right-0 z-[100] p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <Sliders size={18} className="text-brand" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Pipeline Tuning</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Retrieval Depth */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200">
                <Search size={16} className="text-brand/70" />
                <label className="text-xs font-bold uppercase tracking-wider">Retrieval Depth (K)</label>
              </div>
              <span className="text-xs font-mono text-brand-light bg-brand/10 px-2 py-0.5 rounded">{settings.maxSources}</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="30" 
              step="1"
              value={settings.maxSources}
              onChange={(e) => updateSetting('maxSources', parseInt(e.target.value))}
              className="w-full accent-brand bg-white/10 rounded-lg h-1.5 appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Number of top-ranked context clusters injected into the synthesizer. Higher K increases depth but may introduce noise.
            </p>
          </div>

          {/* Similarity Threshold */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200">
                <Zap size={16} className="text-brand/70" />
                <label className="text-xs font-bold uppercase tracking-wider">Similarity Floor</label>
              </div>
              <span className="text-xs font-mono text-brand-light bg-brand/10 px-2 py-0.5 rounded">{settings.similarityThreshold}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="50" 
              step="5"
              value={settings.similarityThreshold}
              onChange={(e) => updateSetting('similarityThreshold', parseInt(e.target.value))}
              className="w-full accent-brand bg-white/10 rounded-lg h-1.5 appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Minimum relevance score required for a document to be considered for synthesis. 
            </p>
          </div>

          {/* Reranking Algorithm */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-200">
              <Layers size={16} className="text-brand/70" />
              <label className="text-xs font-bold uppercase tracking-wider">Reranking Logic</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['relevance', 'recency', 'hybrid'] as const).map((algo) => (
                <button
                  key={algo}
                  onClick={() => updateSetting('rerankAlgorithm', algo)}
                  className={`py-2 px-1 text-[10px] font-bold uppercase tracking-tighter rounded-lg border transition-all ${
                    settings.rerankAlgorithm === algo 
                      ? 'bg-brand/20 border-brand text-brand-light' 
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {algo}
                </button>
              ))}
            </div>
          </div>

          {/* Deep Search Intensity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200">
                <Info size={16} className="text-brand/70" />
                <label className="text-xs font-bold uppercase tracking-wider">Deep Intensity</label>
              </div>
              <span className="text-xs font-mono text-brand-light bg-brand/10 px-2 py-0.5 rounded">{settings.deepSearchIntensity}x</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="1"
              value={settings.deepSearchIntensity}
              onChange={(e) => updateSetting('deepSearchIntensity', parseInt(e.target.value))}
              className="w-full accent-brand bg-white/10 rounded-lg h-1.5 appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Multiplier for recursive search queries. Affects result diversity in Deep Reasoning mode.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center gap-3">
          <Info size={14} className="text-brand shrink-0" />
          <span className="text-[10px] text-slate-400 font-medium">Changes are applied in real-time to all future queries. Low threshold + High K recommended for complex research.</span>
        </div>
      </div>
    </motion.div>
  );
}
