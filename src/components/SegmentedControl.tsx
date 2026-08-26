import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option<T> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string | number | null> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  accentColor?: string; // tailwind gradient classes for active pill
}

export function SegmentedControl<T extends string | number | null>({
  options,
  value,
  onChange,
  accentColor = 'from-blue-600 to-purple-600',
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = options.findIndex((o) => o.value === value);

  return (
    <div
      ref={containerRef}
      className="relative flex w-full rounded-2xl bg-slate-900/60 border border-white/5 p-1 gap-1"
      role="radiogroup"
    >
      {/* Sliding neon highlight */}
      {activeIndex >= 0 && (
        <motion.div
          className={`absolute top-1 bottom-1 rounded-xl bg-gradient-to-r ${accentColor} shadow-[0_0_20px_rgba(99,102,241,0.45)] pointer-events-none`}
          layoutId="segment-highlight"
          style={{
            left: `calc(${(activeIndex / options.length) * 100}% + 4px)`,
            width: `calc(${100 / options.length}% - 8px)`,
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
        />
      )}

      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <motion.button
            key={String(opt.value ?? 'null')}
            role="radio"
            aria-checked={isActive}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(opt.value)}
            className={`
              relative z-10 flex-1 flex flex-col items-center justify-center
              rounded-xl py-3 px-2 transition-colors duration-200 cursor-pointer
              ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}
            `}
          >
            {opt.icon && (
              <span className={`mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {opt.icon}
              </span>
            )}
            <span className="font-black text-sm leading-none tracking-tight">{opt.label}</span>
            {opt.sublabel && (
              <span className={`text-[10px] font-semibold mt-0.5 leading-none transition-colors ${isActive ? 'text-white/70' : 'text-slate-600'}`}>
                {opt.sublabel}
              </span>
            )}

            {/* Active glow pulse ring */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  key="ring"
                  className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.25 }}
                />
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
