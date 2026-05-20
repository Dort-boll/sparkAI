import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Globe, Network, Cpu as LogicIcon } from 'lucide-react';
import { Logo } from './Brand';

interface ProtocolOverlayProps {
  type: 'guest' | 'user';
  onComplete: () => void;
}

export const ProtocolOverlay: React.FC<ProtocolOverlayProps> = ({ type, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [activeSubtextIndex, setActiveSubtextIndex] = useState(0);
  const isGuest = type === 'guest';

  // Micro stages to show during progress
  const microSubtexts = [
    "Establishing neural link to Vayu Cloud...",
    "Decrypting Spark sandbox environment...",
    "Caching reference models for query synthesis...",
    "Activating stateless reasoning engine nodes...",
    "Vayu Ecosystem sync finalized. Welcome."
  ];

  useEffect(() => {
    // Smooth progress completion over 2.8 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Adaptive step size for smooth non-linear feel
        const remaining = 100 - prev;
        const step = Math.max(1, Math.min(15, Math.floor(remaining * 0.15 + Math.random() * 5)));
        return prev + step;
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // Update subheading message dynamically based on progress percent
  useEffect(() => {
    if (progress >= 95) {
      setActiveSubtextIndex(4);
    } else if (progress >= 70) {
      setActiveSubtextIndex(3);
    } else if (progress >= 45) {
      setActiveSubtextIndex(2);
    } else if (progress >= 20) {
      setActiveSubtextIndex(1);
    } else {
      setActiveSubtextIndex(0);
    }
  }, [progress]);

  // Handle completion when progress hits 100%
  useEffect(() => {
    if (progress === 100) {
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 600);
      return () => clearTimeout(finishTimer);
    }
  }, [progress, onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[1000] bg-[#020617] flex flex-col items-center justify-center p-6 overflow-hidden"
    >
      {/* Background Ambience / Vayu Wave Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Cinematic ambient spots */}
        <motion.div 
          animate={{ 
            opacity: [0.15, 0.35, 0.15],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.12),transparent_70%)]" 
        />
        <motion.div 
          animate={{ 
            opacity: [0.05, 0.15, 0.05],
            rotate: [0, 360],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_50%_50%,rgba(96,165,250,0.04),transparent_50%)] rounded-full border border-dashed border-blue-500/10" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] pointer-events-none" />
      </div>

      <div className="relative flex flex-col items-center max-w-md w-full z-10">
        {/* Animated Vayu Core Connection Ring */}
        <div className="relative mb-12">
          {/* Orbital connection rays */}
          {[1.2, 1.5, 1.8].map((s, idx) => (
            <motion.div
              key={idx}
              className="absolute inset-0 rounded-full border border-brand/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, s],
                opacity: [0.4, 0],
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                delay: idx * 0.8,
                ease: "easeOut"
              }}
            />
          ))}

          {/* Central Spinning Grid Node Container */}
          <div className="p-3 bg-brand/5 border border-white/5 rounded-full relative z-10 backdrop-blur-sm shadow-[0_0_50px_rgba(59,130,246,0.1)]">
            <motion.div 
              animate={{ 
                scale: [1, 1.06, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Logo size={110} />
            </motion.div>
          </div>
        </div>

        {/* Dynamic Connected Vayu System text */}
        <div className="flex flex-col items-center text-center gap-2 mb-8 select-none">
          <motion.div
            initial={{ opacity: 0, y: 15, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-full mb-3 shadow-inner"
          >
            <Network size={15} className="text-brand animate-pulse" />
            <span className="text-[10px] sm:text-xs font-black text-brand uppercase tracking-[0.25em]">VAYU ECOSYSTEM</span>
          </motion.div>

          {/* Core Status Header */}
          <motion.h2
            initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-2xl sm:text-3xl font-display font-medium text-white tracking-tight"
          >
            Connecting to Vayu Ecosystem
          </motion.h2>
        </div>

        {/* Real-time Loader with percentage indicator */}
        <div className="w-full bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-2xl p-5 mb-6 flex flex-col gap-4 shadow-xl select-none">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono tracking-wider">
            <span>LINK STATE: SHIELDING_GATEWAY</span>
            <span className="text-brand font-bold">{progress}%</span>
          </div>

          {/* Smooth custom progress bar */}
          <div className="h-[4px] w-full bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute top-0 bottom-0 bg-gradient-to-r from-brand to-brand-light shadow-[0_0_15px_rgba(96,165,250,0.8)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>

          {/* Cross-fading subtask updates */}
          <div className="h-6 overflow-hidden relative flex justify-center text-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={activeSubtextIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.05em] block truncate"
              >
                {microSubtexts[activeSubtextIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Ambient Technical Sign-off */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="flex flex-col items-center gap-1 font-mono text-[9px] text-slate-600 tracking-widest uppercase select-none"
        >
          <span>SYSTEM_ROOT: CONNECTIVITY_SECURE</span>
          <span>LATENCY: 4.8MS // SHUTTLE OK</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

