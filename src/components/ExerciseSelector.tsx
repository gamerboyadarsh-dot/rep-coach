import { useState, useEffect } from 'react';
import type { ExerciseType } from '../lib/exerciseRules';
import { sfx } from '../lib/sounds';

interface Props {
  username: string;
  onSelect: (exercise: ExerciseType, goal: number | null) => void;
}

export function ExerciseSelector({ username, onSelect }: Props) {
  const [lifetimeReps, setLifetimeReps] = useState(0);
  const [goal, setGoal] = useState<number | null>(null);

  useEffect(() => {
    sfx.init();
    const stats = localStorage.getItem(`repCoachStats_${username}`);
    if (stats) {
      const parsed = JSON.parse(stats);
      setLifetimeReps(parsed.totalReps || 0);
    }
  }, [username]);

  const handleSelect = (ex: ExerciseType) => {
    sfx.playClick();
    onSelect(ex, goal);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10">
      {/* Stats Header */}
      <div className="absolute top-6 left-6 hud-panel px-4 py-2 opacity-80">
        <div className="text-xs uppercase tracking-widest opacity-70">CAREER REPS</div>
        <div className="text-xl font-bold glow-text text-[var(--color-hud-violet)]">{lifetimeReps}</div>
      </div>

      <h1 className="text-4xl font-bold mb-4 glow-text uppercase tracking-widest text-center">SELECT PROGRAM</h1>
      
      {/* Goal Selector */}
      <div className="mb-12 hud-panel p-4 flex gap-4 items-center">
        <span className="text-sm uppercase tracking-widest opacity-80">TARGET:</span>
        <button onClick={() => { sfx.playClick(); setGoal(null); }} className={`px-4 py-1 border transition-colors cursor-pointer ${goal === null ? 'border-[var(--color-hud-cyan)] text-[var(--color-hud-cyan)] bg-[var(--color-hud-cyan)]/20' : 'border-transparent opacity-50 hover:opacity-100'}`}>ENDLESS</button>
        <button onClick={() => { sfx.playClick(); setGoal(10); }} className={`px-4 py-1 border transition-colors cursor-pointer ${goal === 10 ? 'border-[var(--color-hud-cyan)] text-[var(--color-hud-cyan)] bg-[var(--color-hud-cyan)]/20' : 'border-transparent opacity-50 hover:opacity-100'}`}>10 REPS</button>
        <button onClick={() => { sfx.playClick(); setGoal(25); }} className={`px-4 py-1 border transition-colors cursor-pointer ${goal === 25 ? 'border-[var(--color-hud-cyan)] text-[var(--color-hud-cyan)] bg-[var(--color-hud-cyan)]/20' : 'border-transparent opacity-50 hover:opacity-100'}`}>25 REPS</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-4xl">
        <button
          onClick={() => handleSelect('squat')}
          className="flex-1 hud-panel p-8 text-center transition-all hover:scale-105 hover:border-[var(--color-hud-cyan)] group relative cursor-pointer"
        >
          <div className="corner-bracket tl"></div>
          <div className="corner-bracket tr"></div>
          <div className="corner-bracket bl"></div>
          <div className="corner-bracket br"></div>
          <h2 className="text-2xl font-bold mb-4 group-hover:glow-text">SQUAT</h2>
          <p className="opacity-70 text-sm">Lower body mechanics</p>
        </button>

        <button
          onClick={() => handleSelect('pushup')}
          className="flex-1 hud-panel p-8 text-center transition-all hover:scale-105 hover:border-[var(--color-hud-cyan)] group relative cursor-pointer"
        >
          <div className="corner-bracket tl"></div>
          <div className="corner-bracket tr"></div>
          <div className="corner-bracket bl"></div>
          <div className="corner-bracket br"></div>
          <h2 className="text-2xl font-bold mb-4 group-hover:glow-text">PUSH-UP</h2>
          <p className="opacity-70 text-sm">Upper body strength</p>
        </button>

        <button
          onClick={() => handleSelect('jumping_jack')}
          className="flex-1 hud-panel p-8 text-center transition-all hover:scale-105 hover:border-[var(--color-hud-cyan)] group relative cursor-pointer"
        >
          <div className="corner-bracket tl"></div>
          <div className="corner-bracket tr"></div>
          <div className="corner-bracket bl"></div>
          <div className="corner-bracket br"></div>
          <h2 className="text-2xl font-bold mb-4 group-hover:glow-text">JUMP JACK</h2>
          <p className="opacity-70 text-sm">Cardio & coordination</p>
        </button>
      </div>
    </div>
  );
}
