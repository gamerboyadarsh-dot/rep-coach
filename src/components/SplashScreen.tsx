import { motion, AnimatePresence } from 'framer-motion';

export function SplashScreen({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950"
        >
          {/* Logo Mark */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative"
          >
            {/* Glowing Orb behind logo */}
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.4, scale: 1 }}
              transition={{ delay: 0.2, duration: 1 }}
              className="absolute inset-0 bg-lime-500 rounded-full blur-[60px]"
            />
            <div className="w-24 h-24 bg-lime-500 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(163,230,53,0.3)] relative z-10 overflow-hidden">
              <motion.svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5"
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-12 h-12 text-slate-950"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut", delay: 0.1 }}
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </motion.svg>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 text-2xl font-black font-outfit tracking-tight text-white"
          >
            Rep Coach
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
