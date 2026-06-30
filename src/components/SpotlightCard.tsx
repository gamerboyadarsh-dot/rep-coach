import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ children, className = '', onClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(mouseX, { stiffness: 500, damping: 100 });
  const mouseYSpring = useSpring(mouseY, { stiffness: 500, damping: 100 });

  const rotateX = useTransform(y, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(x, [-0.5, 0.5], ["-7deg", "7deg"]);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // Spotlight
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
    
    // 3D Tilt
    const width = rect.width;
    const height = rect.height;
    const mouseXRel = e.clientX - rect.left;
    const mouseYRel = e.clientY - rect.top;
    
    const xPct = (mouseXRel / width) - 0.5;
    const yPct = (mouseYRel / height) - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const spotlightBackground = useMotionTemplate`radial-gradient(400px circle at ${mouseXSpring}px ${mouseYSpring}px, rgba(255,255,255,0.08), transparent 40%)`;
  const spotlightMask = useMotionTemplate`radial-gradient(300px circle at ${mouseXSpring}px ${mouseYSpring}px, black, transparent)`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: "preserve-3d",
        perspective: 1200
      }}
      className={`relative group rounded-3xl transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 3D Inner Wrapper */}
      <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }} className="w-full h-full rounded-3xl relative z-10 pointer-events-none">
        <div className="pointer-events-auto w-full h-full">
          {children}
        </div>
      </div>

      {/* Dynamic Background Spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 z-0"
        style={{ background: spotlightBackground }}
      />
      
      {/* Glowing Border Spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 border-2 border-white/30 z-20"
        style={{
          maskImage: spotlightMask,
          WebkitMaskImage: spotlightMask
        }}
      />
    </motion.div>
  );
};
