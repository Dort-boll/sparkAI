import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 48 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Refined Ambient Glow */}
      <motion.div 
        className="absolute inset-0 bg-brand/10 blur-3xl rounded-full"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Minimalist Professional Logo */}
      <div className="relative z-10 w-full h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none">
          <defs>
            <linearGradient id="brandLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <clipPath id="logoClip">
              <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" />
            </clipPath>
          </defs>

          {/* Outer Shield/Hex Frame */}
          <motion.path
            d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z"
            stroke="url(#brandLogoGrad)"
            strokeWidth="2"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Inner Geometric Intelligence Core */}
          <motion.g
            animate={{ 
              y: [0, -2, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Centered Monogram / Spark Element */}
            <motion.path
              d="M50 25 L70 50 L50 75 L30 50 Z"
              fill="url(#brandLogoGrad)"
              className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              animate={{ 
                opacity: [0.8, 1, 0.8],
                scale: [0.98, 1.02, 0.98]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Connection Lines (Technical feel) */}
            <path d="M50 5 L50 25" stroke="white" strokeWidth="1" strokeDasharray="2 4" className="opacity-30" />
            <path d="M50 75 L50 95" stroke="white" strokeWidth="1" strokeDasharray="2 4" className="opacity-30" />
            <path d="M10 25 L30 50" stroke="white" strokeWidth="1" strokeDasharray="2 4" className="opacity-30" />
            <path d="M90 25 L70 50" stroke="white" strokeWidth="1" strokeDasharray="2 4" className="opacity-30" />
            <path d="M10 75 L30 50" stroke="white" strokeWidth="1" strokeDasharray="2 4" className="opacity-30" />
            <path d="M90 75 L70 50" stroke="white" strokeWidth="1" strokeDasharray="2 4" className="opacity-30" />
          </motion.g>

          {/* Floating Data Nodes */}
          {[1, 2, 3].map((i) => (
            <motion.circle
              key={i}
              r="1.5"
              fill="white"
              animate={{ 
                opacity: [0, 1, 0],
                pathOffset: [0, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                delay: i * 0.8,
                ease: "easeInOut"
              }}
            >
              <animateMotion 
                path="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" 
                dur={`${4 + i}s`} 
                repeatCount="indefinite" 
              />
            </motion.circle>
          ))}
        </svg>
      </div>
    </div>
  );
};

