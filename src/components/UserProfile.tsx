import { useEffect, useState } from 'react';
import { sfx } from '../lib/sounds';

interface Props {
  username: string;
  onLogout: () => void;
}

export function UserProfile({ username, onLogout }: Props) {
  const [stats, setStats] = useState({ totalReps: 0, highestStreak: 0 });

  useEffect(() => {
    const data = localStorage.getItem(`repCoachStats_${username}`);
    if (data) {
      setStats(JSON.parse(data));
    }
  }, [username]);

  const getRank = (reps: number) => {
    if (reps > 1000) return 'CYBER-NINJA';
    if (reps > 500) return 'ELITE OPERATIVE';
    if (reps > 100) return 'VANGUARD';
    if (reps > 50) return 'GRUNT';
    return 'ROOKIE';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10">
      <div className="hud-panel p-12 w-full max-w-2xl relative">
        <div className="corner-bracket tl"></div>
        <div className="corner-bracket tr"></div>
        <div className="corner-bracket bl"></div>
        <div className="corner-bracket br"></div>

        <h1 className="text-4xl font-bold mb-2 text-center glow-text uppercase">PROFILE: {username}</h1>
        <p className="text-center text-[var(--color-hud-violet)] mb-12 uppercase tracking-widest text-sm font-bold">
          RANK: {getRank(stats.totalReps)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-[var(--color-hud-bg)] border border-[var(--color-hud-cyan)]/30 p-6 text-center relative overflow-hidden">
            <div className="scanlines"></div>
            <div className="text-sm opacity-70 uppercase tracking-widest mb-2">CAREER REPS</div>
            <div className="text-6xl font-bold glow-text">{stats.totalReps}</div>
          </div>
          
          <div className="bg-[var(--color-hud-bg)] border border-[var(--color-hud-cyan)]/30 p-6 text-center relative overflow-hidden">
            <div className="scanlines"></div>
            <div className="text-sm opacity-70 uppercase tracking-widest mb-2">BEST STREAK</div>
            <div className="text-6xl font-bold text-[var(--color-hud-amber)] glow-text">{stats.highestStreak}</div>
          </div>
        </div>

        <button 
          onClick={() => { sfx.playClick(); onLogout(); }}
          className="w-full bg-[var(--color-hud-red)]/10 border border-[var(--color-hud-red)] text-[var(--color-hud-red)] py-4 font-bold tracking-widest hover:bg-[var(--color-hud-red)] hover:text-white transition-colors cursor-pointer uppercase"
        >
          TERMINATE UPLINK (LOGOUT)
        </button>
      </div>
    </div>
  );
}
