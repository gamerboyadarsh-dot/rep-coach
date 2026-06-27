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
        <div className="hud-panel px-6 py-2 border-[var(--color-hud-cyan)] bg-[var(--color-hud-bg)]/80 text-[var(--color-hud-cyan)] caption-enter">
          <span className="font-bold tracking-widest text-sm">FORM: OPTIMAL</span>
        </div>
      </div>
    );
  }

  const colorClass = currentMessage.type === 'error' ? 'text-[var(--color-hud-red)] border-[var(--color-hud-red)]' : 'text-[var(--color-hud-amber)] border-[var(--color-hud-amber)]';

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 transition-all">
      <div key={currentMessage.id} className={`hud-panel px-6 py-3 bg-[var(--color-hud-bg)]/90 border ${colorClass} caption-enter flex items-center gap-3`}>
        <div className={`w-2 h-2 rounded-full ${currentMessage.type === 'error' ? 'bg-[var(--color-hud-red)]' : 'bg-[var(--color-hud-amber)]'} animate-pulse`}></div>
        <span className="font-bold tracking-widest text-lg glow-text">{currentMessage.message}</span>
      </div>
    </div>
  );
}
