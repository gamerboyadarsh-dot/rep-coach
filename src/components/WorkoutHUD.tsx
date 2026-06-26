import { useEffect, useState } from 'react';
import type { ExerciseType, RepState, PushupState } from '../lib/exerciseRules';
import { FormFeedback } from './FormFeedback';
import { sfx } from '../lib/sounds';

interface Props {
  exercise: ExerciseType;
  repCount: number;
  state: RepState | PushupState;
  errors: string[];
  formScore: number;
  streak: number;
  goal: number | null;
  onEndSession: () => void;
}

export function WorkoutHUD({ exercise, repCount, state, errors, formScore, streak, goal, onEndSession }: Props) {
  const [flash, setFlash] = useState(false);
  const [prevRep, setPrevRep] = useState(repCount);
  const [prevErrors, setPrevErrors] = useState(0);

  useEffect(() => {
    if (repCount > prevRep) {
      setFlash(true);
      sfx.playRepComplete();
      
      // Streak sound
      if (streak > 0 && streak % 5 === 0) {
        setTimeout(() => sfx.playCombo(), 400);
      }
      
      setTimeout(() => setFlash(false), 300);
      setPrevRep(repCount);
    }
  }, [repCount, prevRep, streak]);

  useEffect(() => {
    if (errors.length > 0 && prevErrors === 0) {
      sfx.playError();
    }
    setPrevErrors(errors.length);
  }, [errors, prevErrors]);

  const scoreColor = formScore >= 80 ? 'text-[var(--color-hud-cyan)]' : formScore >= 50 ? 'text-[var(--color-hud-amber)]' : 'text-[var(--color-hud-red)]';

  const isCombo = streak >= 3;
  const progress = goal ? Math.min((repCount / goal) * 100, 100) : null;

  return (
    <div className={`absolute inset-0 z-10 pointer-events-none transition-all duration-300 ${isCombo ? 'shadow-[inset_0_0_100px_rgba(0,240,255,0.2)]' : ''}`}>
      <div className="scanlines"></div>
      <div className="grid-bg"></div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
        <div className="flex gap-4">
          <div className={`hud-panel px-4 py-2 pointer-events-auto transition-all ${isCombo ? 'border-[var(--color-hud-violet)] shadow-[0_0_15px_var(--color-hud-violet)] scale-110' : ''}`}>
            <div className="text-sm opacity-70 uppercase tracking-widest mb-1">PROGRAM</div>
            <div className="text-xl font-bold uppercase glow-text text-[var(--color-hud-violet)]">
              {exercise.replace('_', ' ')}
            </div>
          </div>
          
          {streak > 1 && (
            <div className="hud-panel px-4 py-2 pointer-events-auto border-[var(--color-hud-amber)] animate-pulse">
              <div className="text-sm text-[var(--color-hud-amber)] uppercase tracking-widest mb-1">STREAK</div>
              <div className="text-xl font-bold text-[var(--color-hud-amber)] glow-text">{streak}x COMBO</div>
            </div>
          )}
        </div>

        <button 
          onClick={() => { sfx.playClick(); onEndSession(); }}
          className="hud-panel px-6 py-2 border-[var(--color-hud-red)] text-[var(--color-hud-red)] hover:bg-[var(--color-hud-red)] hover:text-white transition-colors pointer-events-auto font-bold uppercase tracking-widest cursor-pointer"
        >
          End Session
        </button>
      </div>

      <FormFeedback errors={errors} />

      {/* Rep Counter */}
      <div className="absolute bottom-12 left-12 hud-panel p-6 min-w-[200px]">
        <div className="corner-bracket tl"></div>
        <div className="corner-bracket tr"></div>
        <div className="corner-bracket bl"></div>
        <div className="corner-bracket br"></div>
        
        <div className="text-sm opacity-70 uppercase tracking-widest mb-2 flex justify-between">
          <span>REPS</span>
          {goal && <span>{goal} TARGET</span>}
        </div>
        
        <div className="flex items-baseline gap-2">
          <div className={`text-7xl font-bold glow-text ${flash ? 'rep-flash text-white' : ''} transition-all`}>
            {repCount.toString().padStart(2, '0')}
          </div>
          {goal && (
            <div className="text-3xl opacity-50">/ {goal}</div>
          )}
        </div>
        
        {goal && (
          <div className="w-full bg-[var(--color-hud-bg)] h-1 mt-4">
            <div className="h-full bg-[var(--color-hud-cyan)] transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>

      {/* Status Panel */}
      <div className="absolute bottom-12 right-12 hud-panel p-6 min-w-[240px]">
        <div className="corner-bracket tl"></div>
        <div className="corner-bracket tr"></div>
        <div className="corner-bracket bl"></div>
        <div className="corner-bracket br"></div>

        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-sm opacity-70 uppercase tracking-widest mb-1">FORM SCORE</div>
            <div className={`text-3xl font-bold ${scoreColor} glow-text`}>{formScore}%</div>
          </div>
        </div>

        <div>
          <div className="text-sm opacity-70 uppercase tracking-widest mb-2 flex justify-between">
            <span>STATE</span>
            <span className="text-[var(--color-hud-cyan)]">{state.toUpperCase()}</span>
          </div>
          <div className="w-full bg-[var(--color-hud-bg)] h-2 rounded overflow-hidden border border-[var(--color-hud-cyan)]/30">
            <div 
              className="h-full bg-[var(--color-hud-cyan)] transition-all duration-300"
              style={{ 
                width: state === 'descending' || state === 'out' ? '50%' : state === 'bottom' ? '100%' : state === 'ascending' || state === 'in' ? '50%' : '0%' 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
