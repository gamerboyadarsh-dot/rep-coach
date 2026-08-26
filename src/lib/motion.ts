import { useReducedMotion } from 'framer-motion';

export const useMotionConfig = () => {
  const shouldReduceMotion = useReducedMotion();

  return {
    transition: shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 },
    spring: shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 40 },
    durations: {
      fast: shouldReduceMotion ? 0 : 0.2,
      base: shouldReduceMotion ? 0 : 0.4,
      slow: shouldReduceMotion ? 0 : 0.8,
    },
    colors: {
      glowBlue: 'rgba(59, 130, 246, 0.5)',
      glowPurple: 'rgba(168, 85, 247, 0.5)',
      glowCyan: 'rgba(6, 182, 212, 0.5)',
      glowRed: 'rgba(239, 68, 68, 0.5)',
    }
  };
};

export const defaultFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const defaultFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};
