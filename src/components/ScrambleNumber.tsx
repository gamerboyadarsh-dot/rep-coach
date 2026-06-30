import React, { useState, useEffect } from 'react';

interface ScrambleNumberProps {
  value: number | string;
  duration?: number; // total scramble duration in ms
  className?: string;
}

const CHARS = '0123456789XF#@$%&*<>?';

export const ScrambleNumber: React.FC<ScrambleNumberProps> = ({ value, duration = 800, className = '' }) => {
  const [displayText, setDisplayText] = useState<string>('');
  const targetStr = String(value);

  useEffect(() => {
    let frame = 0;
    const frameRate = 30; // ms per frame
    const totalFrames = Math.round(duration / frameRate);
    
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      
      let newText = '';
      for (let i = 0; i < targetStr.length; i++) {
        // Reveal characters progressively from left to right
        const revealThreshold = i / targetStr.length;
        
        if (progress > revealThreshold) {
          newText += targetStr[i];
        } else {
          newText += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      
      setDisplayText(newText);
      
      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplayText(targetStr); // Ensure final exact match
      }
    }, frameRate);
    
    return () => clearInterval(interval);
  }, [value, duration, targetStr]);

  // Use tabular numerals for HUD styling
  return (
    <span className={`font-mono tabular-nums tracking-tight ${className}`}>
      {displayText || targetStr.replace(/./g, '0')}
    </span>
  );
};
