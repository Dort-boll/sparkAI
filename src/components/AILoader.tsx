import React, { useState, useEffect } from 'react';

interface AILoaderProps {
  states?: string[];
  intervalMs?: number;
}

const defaultStates = [
  "Thinking...",
  "Searching the web...",
  "Analyzing context..."
];

export const AILoader: React.FC<AILoaderProps> = ({ 
  states = defaultStates, 
  intervalMs = 2200 
}) => {
  const [index, setIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (states.length <= 1) return;

    const interval = setInterval(() => {
      setFadeOut(true);

      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % states.length);
        setFadeOut(false);
      }, 300); // matching fadeOut duration

    }, intervalMs);

    return () => clearInterval(interval);
  }, [states, intervalMs]);

  return (
    <div className="loader-container" id="spark-ai-loader-root">
      {/* FIXED LOGO */}
      <div className="loader-logo" id="spark-ai-loader-logo"></div>

      {/* TEXT AREA */}
      <div className="loader-text-box" id="spark-ai-loader-textbox">
        <div 
          id="spark-ai-loader-text"
          className={`loader-text-shimmer ${fadeOut ? 'loader-fade-out' : ''}`}
        >
          {states[index]}
        </div>
      </div>
    </div>
  );
};
