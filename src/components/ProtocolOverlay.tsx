import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, ShieldCheck, Zap, Globe, Lock } from 'lucide-react';
import { Logo } from './Brand';

interface ProtocolOverlayProps {
  type: 'guest' | 'user';
  onComplete: () => void;
}

export const ProtocolOverlay: React.FC<ProtocolOverlayProps> = ({ type, onComplete }) => {
  const [step, setStep] = useState(0);
  const isGuest = type === 'guest';

  const guestSteps = [
    { text: "Establishing secure connection to Vayu Cloud", icon: Globe, color: "text-brand" },
    { text: "Entering workspace as anonymous mode", icon: ShieldCheck, color: "text-amber-500" },
    { text: "Initializing stateless reasoning engine", icon: Zap, color: "text-brand-light" },
    { text: "Ask anything, search.", icon: Cpu, color: "text-white" }
  ];

  const userSteps = [
    { text: "Synchronizing security profile from Spark Vault", icon: Lock, color: "text-brand" },
    { text: "Decrypting personal workspace nodes", icon: ShieldCheck, color: "text-purple-500" },
    { text: "Optimizing real-time reasoning pipeline", icon: Zap, color: "text-brand-light" },
    { text: "Welcome back to the Future.", icon: Cpu, color: "text-white" }
  ];

  const currentSteps = isGuest ? guestSteps : userSteps;

  useEffect(() => {
    if (step < currentSteps.length) {
      const timer = setTimeout(() => {
        setStep(prev => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(finishTimer);
    }
  }, [step, currentSteps.length, onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-[#020617] flex flex-col items-center justify-center p-6 overflow-hidden"
    >
      {/* Background Cinematic Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />
      </div>

      <div className="relative flex flex-col items-center max-w-md w-full">
        {/* Animated Core */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mb-16"
        >
          <Logo size={120} />
        </motion.div>

        <div className="h-24 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {step < currentSteps.length && (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center gap-4"
              >
                {React.createElement(currentSteps[step].icon, { 
                  size: 24, 
                  className: `${currentSteps[step].color} animate-pulse` 
                })}
                <span className={`text-sm sm:text-base font-bold uppercase tracking-[0.3em] ${currentSteps[step].color}`}>
                  {currentSteps[step].text}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Technical Subtext/Scanline */}
        <div className="mt-12 flex flex-col items-center gap-2">
          <div className="h-[2px] w-48 bg-white/5 relative overflow-hidden">
            <motion.div 
              className={`absolute inset-y-0 w-20 bg-brand shadow-[0_0_10px_brand]`}
              animate={{ left: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Protocol: {isGuest ? "ANONYMOUS_ACCESS_v4" : "SESSION_RESTORE_SECURE"}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
