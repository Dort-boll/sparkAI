import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 48 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Dynamic Glow Layers */}
      <motion.div 
        className="absolute inset-0 bg-brand/20 blur-2xl rounded-full"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute inset-[15%] bg-purple-500/10 blur-xl rounded-full"
        animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      
      {/* Outer Intelligence Rings */}
      <div className="absolute inset-[-10%] sm:inset-[-15%] pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-30 text-brand">
          <motion.circle 
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="0.5" 
            strokeDasharray="1, 4"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.path 
            d="M50 5 A45 45 0 0 1 95 50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          <motion.path 
            d="M5 50 A45 45 0 0 1 50 95" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>

      {/* The Technical Core */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Abstract Hex-Spark */}
          <motion.g
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "backOut" }}
            style={{ filter: 'url(#glow)' }}
          >
            {/* Hexagonal Base */}
            <motion.path
              d="M50 10 L84.6 30 L84.6 70 L50 90 L15.4 70 L15.4 30 Z"
              fill="rgba(59, 130, 246, 0.1)"
              stroke="url(#sparkGradient)"
              strokeWidth="2"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Central Intelligence Node */}
            <motion.circle 
              cx="50" cy="50" r="12" 
              fill="url(#sparkGradient)"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Neural Filaments */}
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <motion.line
                key={angle}
                x1="50" y1="50"
                x2={50 + 35 * Math.cos(angle * Math.PI / 180)}
                y2={50 + 35 * Math.sin(angle * Math.PI / 180)}
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="opacity-40"
                animate={{ 
                  strokeDasharray: ["0, 100", "100, 0", "0, 100"],
                  opacity: [0.2, 0.6, 0.2]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  delay: angle / 100,
                  ease: "easeInOut"
                }}
              />
            ))}

            {/* Orbiting Sparks */}
            <motion.circle
              cx="50" cy="50" r="30"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
              strokeDasharray="2, 20"
              animate={{ rotate: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
          </motion.g>
        </svg>
      </div>
    </div>
  );
};

const AnimateOrbits = ({ size, color }: { size: number, color: string }) => {
  return (
    <div className="absolute inset-[-10%] pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-[0.5px] border-dashed"
          style={{ borderColor: color }}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 10 + i * 5, 
            repeat: Infinity, 
            ease: "linear",
            delay: i * -2
          }}
        />
      ))}
    </div>
  );
};
