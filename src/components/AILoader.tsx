import React, { useState, useEffect } from 'react';

interface AILoaderProps {
  states?: string[];
  intervalMs?: number;
}

const defaultStates = [
  "Thinking...",
  "Searching the web...",
  "Reading sources...",
  "Understanding context...",
  "Cross-checking facts...",
  "Building answer...",
  "Finalizing..."
];

export const AILoader: React.FC<AILoaderProps> = ({ 
  states = defaultStates, 
  intervalMs = 1700 
}) => {
  const [index, setIndex] = useState(0);
  const [showClass, setShowClass] = useState('show');

  useEffect(() => {
    if (states.length <= 1) return;

    const interval = setInterval(() => {
      // Trigger Claude-style hide animation
      setShowClass('hide');

      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % states.length);
        // Trigger Claude-style show animation
        setShowClass('show');
      }, 280); // matching fade transition duration

    }, intervalMs);

    return () => clearInterval(interval);
  }, [states, intervalMs]);

  return (
    <div className="loader-container" id="spark-ai-loader-root">
      {/* NEW CONNECTING PATTERN: PILLARS */}
      <div className="loader-pillars" id="spark-ai-loader-pillars">
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* TEXT AREA */}
      <div className="loader-text-box" id="spark-ai-loader-textbox">
        <div 
          id="spark-ai-loader-text"
          className={`loader-text-shimmer ${showClass}`}
        >
          {states[index]}
        </div>
      </div>
    </div>
  );
};

