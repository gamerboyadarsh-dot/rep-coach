import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Props {
  paused: boolean;
}

export function AnimatedBackground({ paused }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const [isLowTier, setIsLowTier] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  useEffect(() => {
    // Basic performance tier check
    const cores = navigator.hardwareConcurrency || 4;
    if (cores < 4 || window.innerWidth < 768) {
      setIsLowTier(true);
    }
  }, []);

  useEffect(() => {
    if (paused || shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x * 30);
      mouseY.set(y * 30);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [paused, shouldReduceMotion, mouseX, mouseY]);

  if (paused) return null; // Complete unmount to save CPU during workout

  const xOffset0 = useTransform(springX, v => v * 0.5);
  const yOffset0 = useTransform(springY, v => v * 0.5);
  
  const xOffset1 = useTransform(springX, v => v * 1.5);
  const yOffset1 = useTransform(springY, v => v * 1.5);

  const xOffset2 = useTransform(springX, v => -v * 1.2);
  const yOffset2 = useTransform(springY, v => -v * 1.2);

  const xOffset3 = useTransform(springX, v => v * 0.8);
  const yOffset3 = useTransform(springY, v => -v * 1.5);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-slate-950 pointer-events-none">
      {/* Grid Mesh */}
      <motion.div 
        className="absolute inset-[-10%] scanner-grid opacity-30"
        style={shouldReduceMotion ? {} : { x: xOffset0, y: yOffset0 }}
      />

      {/* Glowing Orbs */}
      <motion.div
        animate={shouldReduceMotion ? {} : {
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{
          scale: { duration: 15, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-screen"
        style={{
          x: shouldReduceMotion ? 0 : xOffset1,
          y: shouldReduceMotion ? 0 : yOffset1,
          background: 'radial-gradient(circle, rgba(var(--aurora-c1, 163, 230, 53), 0.3) 0%, transparent 70%)',
          filter: isLowTier ? 'blur(40px)' : 'blur(80px)'
        }}
      />

      <motion.div
        animate={shouldReduceMotion ? {} : {
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          scale: { duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 },
          opacity: { duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1 },
        }}
        className="absolute top-[40%] right-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen"
        style={{
          x: shouldReduceMotion ? 0 : xOffset2,
          y: shouldReduceMotion ? 0 : yOffset2,
          background: 'radial-gradient(circle, rgba(var(--aurora-c2, 168, 85, 247), 0.25) 0%, transparent 70%)',
          filter: isLowTier ? 'blur(50px)' : 'blur(100px)'
        }}
      />

      {!isLowTier && (
        <motion.div
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            scale: { duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 },
            opacity: { duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 },
          }}
          className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] rounded-full mix-blend-screen"
          style={{
            x: shouldReduceMotion ? 0 : xOffset3,
            y: shouldReduceMotion ? 0 : yOffset3,
            background: 'radial-gradient(circle, rgba(var(--aurora-c3, 6, 182, 212), 0.2) 0%, transparent 70%)',
            filter: 'blur(120px)'
          }}
        />
      )}
    </div>
  );
}
