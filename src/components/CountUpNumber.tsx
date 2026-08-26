import { useState, useEffect } from 'react';
import { animate } from 'framer-motion';

interface Props {
  value: number;
  duration?: number;
  className?: string;
}

export function CountUpNumber({ value, duration = 1, className = '' }: Props) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        setDisplayValue(Math.round(v));
      }
    });
    return controls.stop;
  }, [value, duration]);

  return (
    <span className={"tabular-nums " + className}>{displayValue.toLocaleString()}</span>
  );
}
