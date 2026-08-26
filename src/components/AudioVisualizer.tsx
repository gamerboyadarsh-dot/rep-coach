import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AudioVisualizer() {
  const [pulse, setPulse] = useState<{ id: number, type: string, vol: number }[]>([]);

  useEffect(() => {
    const handleAudioPulse = (e: any) => {
      const { type, vol } = e.detail;
      const id = Date.now() + Math.random();
      setPulse(prev => [...prev, { id, type, vol }]);
      setTimeout(() => {
        setPulse(prev => prev.filter(p => p.id !== id));
      }, 500);
    };

    window.addEventListener('audio-pulse', handleAudioPulse);
    return () => window.removeEventListener('audio-pulse', handleAudioPulse);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden mix-blend-screen">
      <AnimatePresence>
        {pulse.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0.8, scale: 1, filter: 'blur(20px)' }}
            animate={{ opacity: 0, scale: 1.5, filter: 'blur(40px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-screen rounded-full ${p.type === 'sine' ? 'bg-lime-400/20' : p.type === 'sawtooth' ? 'bg-red-500/30' : 'bg-orange-500/20'}`}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
