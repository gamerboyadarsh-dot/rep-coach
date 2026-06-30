import type { Variants } from 'framer-motion';

/* 
  PREMIUM MOTION SYSTEM
  Uses spring physics for interactions (bouncy but fast settling)
  and refined eases for structural mounting.
*/

export const pageTransition: Variants = {
  initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
  animate: { 
    opacity: 1, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.98,
    filter: 'blur(4px)',
    transition: { duration: 0.3, ease: 'easeInOut' } 
  }
};

export const cardEntrance: any = {
  initial: { opacity: 0, y: 15, scale: 0.97 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 400,
      damping: 30,
      mass: 0.8
    } 
  }
};

export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

export const hoverEffect: any = {
  y: -2,
  scale: 1.01,
  transition: { 
    type: "spring",
    stiffness: 500,
    damping: 25
  }
};

export const tapEffect: any = {
  scale: 0.97,
  y: 0,
  transition: { 
    type: "spring",
    stiffness: 600,
    damping: 20
  }
};
