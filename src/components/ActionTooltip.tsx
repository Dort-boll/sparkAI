import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ActionTooltipProps {
  text: string;
  children: React.ReactNode;
}

export const ActionTooltip: React.FC<ActionTooltipProps> = ({ text, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="relative flex flex-col items-center group/tooltip"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute -top-10 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap z-50 shadow-2xl pointer-events-none"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
