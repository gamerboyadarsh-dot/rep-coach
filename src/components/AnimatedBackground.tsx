import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  paused: boolean;
}

export function AnimatedBackground({ paused }: Props) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused || shouldReduceMotion) return;

    let rafId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      setMousePos({ x: currentX, y: currentY });
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [paused, shouldReduceMotion]);

  if (paused) return null; // Complete unmount to save CPU during workout

  const xOffset = mousePos.x * 30;
  const yOffset = mousePos.y * 30;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-slate-950 pointer-events-none">
      {/* Grid Mesh */}
      <motion.div 
        className="absolute inset-[-10%] scanner-grid opacity-30"
        animate={shouldReduceMotion ? {} : {
          x: xOffset * 0.5,
          y: yOffset * 0.5,
        }}
        transition={{ type: 'tween', ease: 'linear', duration: 0 }}
      />

      {/* Glowing Orbs */}
      <motion.div
        animate={shouldReduceMotion ? {} : {
          x: xOffset * 1.5,
          y: yOffset * 1.5,
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{
          scale: { duration: 15, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
          default: { type: 'tween', ease: 'linear', duration: 0 }
        }}
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(var(--aurora-c1, 59, 130, 246), 0.3) 0%, transparent 70%)',
          filter: 'blur(80px)'
        }}
      />

      <motion.div
        animate={shouldReduceMotion ? {} : {
          x: -xOffset * 1.2,
          y: -yOffset * 1.2,
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          scale: { duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 },
          opacity: { duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1 },
          default: { type: 'tween', ease: 'linear', duration: 0 }
        }}
        className="absolute top-[40%] right-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(var(--aurora-c2, 168, 85, 247), 0.25) 0%, transparent 70%)',
          filter: 'blur(100px)'
        }}
      />

      <motion.div
        animate={shouldReduceMotion ? {} : {
          x: xOffset * 0.8,
          y: -yOffset * 1.5,
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          scale: { duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 },
          opacity: { duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 },
          default: { type: 'tween', ease: 'linear', duration: 0 }
        }}
        className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] rounded-full mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(var(--aurora-c3, 6, 182, 212), 0.2) 0%, transparent 70%)',
          filter: 'blur(120px)'
        }}
      />

      {/* Global Noise is kept in App.tsx to overlay everything including UI */}
    </div>
  );
}
