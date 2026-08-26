import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function PRCelebration({ isNewPR, value }: { isNewPR: boolean, value: string }) {
  const [show, setShow] = useState(isNewPR);

  useEffect(() => {
    if (isNewPR) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 3500);
      return () => clearTimeout(t);
    }
  }, [isNewPR]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Glitch Flash */}
          <motion.div 
            className="absolute inset-0 bg-white"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
          />
          
          {/* Accent color flood */}
          <motion.div 
            className="absolute inset-0 bg-lime-400 mix-blend-overlay"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, type: "spring" }}
          />

          {/* Kinetic Typography */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ scale: 0.5, y: 50, opacity: 0, filter: 'blur(20px)' }}
            animate={{ scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 1.1, opacity: 0, filter: 'blur(10px)' }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <span className="text-lime-300 font-black tracking-widest uppercase text-xl md:text-3xl drop-shadow-lg mb-2">New Personal Record</span>
            <span className="text-8xl md:text-[12rem] font-black font-outfit text-white drop-shadow-[0_0_50px_rgba(163,230,53,0.8)] tracking-tighter" style={{ lineHeight: 0.8 }}>
              {value}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
