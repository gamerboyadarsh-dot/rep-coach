import { useEffect, useState } from 'react';

interface Props {
  errors: string[];
}

// Map error codes to user-friendly messages and colors
const errorMap: Record<string, { message: string; type: 'warning' | 'error' }> = {
  shallow_squat: { message: 'GO DEEPER', type: 'warning' },
  knees_caving_in: { message: 'KNEES CAVING IN - PUSH OUT', type: 'error' },
  hips_sagging: { message: 'HIPS SAGGING - KEEP CORE TIGHT', type: 'error' },
  partial_rep: { message: 'PARTIAL REP - GO ALL THE WAY', type: 'warning' },
  lazy_legs: { message: 'JUMP YOUR LEGS OUT WIDER!', type: 'warning' },
};

export function FormFeedback({ errors }: Props) {
  const [currentMessage, setCurrentMessage] = useState<{ id: number; message: string; type: 'warning' | 'error' } | null>(null);

  useEffect(() => {
    if (errors.length > 0) {
      const errorData = errorMap[errors[0]] || { message: 'FORM ERROR', type: 'warning' };
      setCurrentMessage({ id: Date.now(), ...errorData });
    } else {
      setCurrentMessage(null);
    }
  }, [errors]);

  if (!currentMessage) {
    return (
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 transition-all">
        <div className="hud-panel px-6 py-2 border-[var(--color-hud-cyan)] bg-[var(--color-hud-bg)]/80 text-[var(--color-hud-cyan)] caption-enter shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-110">
          <span className="font-black tracking-widest text-lg drop-shadow-md">FORM: OPTIMAL</span>
        </div>
      </div>
    );
  }

  const colorClass = currentMessage.type === 'error' ? 'text-[var(--color-hud-red)] border-[var(--color-hud-red)] shadow-[0_0_40px_rgba(239,68,68,0.8)]' : 'text-[var(--color-hud-amber)] border-[var(--color-hud-amber)] shadow-[0_0_40px_rgba(245,158,11,0.8)]';

  return (
    <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 transition-all scale-125 md:scale-150">
      <div key={currentMessage.id} className={`hud-panel px-8 py-4 bg-slate-950/95 border-2 ${colorClass} caption-enter flex items-center gap-4 animate-bounce`}>
        <div className={`w-4 h-4 rounded-full ${currentMessage.type === 'error' ? 'bg-[var(--color-hud-red)] shadow-[0_0_20px_rgba(239,68,68,1)]' : 'bg-[var(--color-hud-amber)] shadow-[0_0_20px_rgba(245,158,11,1)]'} animate-pulse`}></div>
        <span className="font-black tracking-widest text-2xl drop-shadow-lg uppercase glow-text">{currentMessage.message}</span>
      </div>
    </div>
  );
}
