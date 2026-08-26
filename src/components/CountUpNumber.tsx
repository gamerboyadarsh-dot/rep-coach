import { useState, useEffect } from 'react';
import { animate, motion } from 'framer-motion';

interface Props {
  value: number;
  duration?: number;
  className?: string;
  isKinetic?: boolean;
}

export function CountUpNumber({ value, duration = 1, className = '', isKinetic = false }: Props) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const controls = animate(displayValue, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        setDisplayValue(Math.round(v));
      },
      onComplete: () => setIsAnimating(false)
    });
    return controls.stop;
  }, [value, duration]);

  if (isKinetic) {
    return (
      <motion.span
        className={"tabular-nums " + className}
        animate={{ 
          scale: isAnimating ? 1.1 : 1, 
          fontWeight: isAnimating ? 900 : 700 
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{ display: 'inline-block', transformOrigin: 'left center' }}
      >
        {displayValue.toLocaleString()}
      </motion.span>
    );
  }

  return (
    <span className={"tabular-nums " + className}>{displayValue.toLocaleString()}</span>
  );
}
