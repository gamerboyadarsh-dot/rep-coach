import { useEffect, useState } from 'react';
import { sfx } from '../lib/sounds';
import { loadStats, type UserStats } from '../lib/achievements';
import { motion } from 'framer-motion';

interface Props {
  username: string;
  onLogout: () => void;
}

export function UserProfile({ username, onLogout }: Props) {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    setStats(loadStats(username));
  }, [username]);

  const getRank = (reps: number) => {
    if (reps > 1000) return 'CYBER-NINJA';
    if (reps > 500) return 'ELITE OPERATIVE';
    if (reps > 100) return 'VANGUARD';
    if (reps > 50) return 'GRUNT';
    return 'ROOKIE';
  };

  if (!stats) return null;

  const badgesList = Object.values(stats.badges);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10 overflow-y-auto pt-24">
      <div className="hud-panel p-6 md:p-12 w-full max-w-4xl relative">
        <div className="corner-bracket tl"></div>
        <div className="corner-bracket tr"></div>
        <div className="corner-bracket bl"></div>
        <div className="corner-bracket br"></div>

        <h1 className="text-4xl font-bold mb-2 text-center glow-text uppercase">OPERATIVE: {username}</h1>
        <p className="text-center text-[var(--color-hud-violet)] mb-8 uppercase tracking-widest text-sm font-bold">
          RANK: {getRank(stats.totalReps)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div whileHover={{ scale: 1.05 }} className="bg-[var(--color-hud-bg)] border border-[var(--color-hud-cyan)]/30 p-6 text-center relative overflow-hidden">
            <div className="scanlines"></div>
            <div className="text-sm opacity-70 uppercase tracking-widest mb-2">CAREER REPS</div>
            <div className="text-5xl font-bold glow-text">{stats.totalReps}</div>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} className="bg-[var(--color-hud-bg)] border border-[var(--color-hud-cyan)]/30 p-6 text-center relative overflow-hidden">
            <div className="scanlines"></div>
            <div className="text-sm opacity-70 uppercase tracking-widest mb-2">BEST STREAK</div>
            <div className="text-5xl font-bold text-[var(--color-hud-amber)] glow-text">{stats.highestStreak}</div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="bg-[var(--color-hud-bg)] border border-[var(--color-hud-cyan)]/30 p-6 text-center relative overflow-hidden">
            <div className="scanlines"></div>
            <div className="text-sm opacity-70 uppercase tracking-widest mb-2">CURRENT DAILY STREAK</div>
            <div className="text-5xl font-bold text-[#ff4b4b] glow-text">{stats.currentDailyStreak} 🔥</div>
          </motion.div>
        </div>

        {/* Trophy Room */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6 text-[var(--color-hud-amber)] tracking-widest border-b border-[var(--color-hud-amber)]/30 pb-2">TROPHY ROOM</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badgesList.map(badge => {
              const isUnlocked = !!badge.unlockedAt;
              return (
                <div key={badge.id} className={`p-4 border ${isUnlocked ? 'border-[var(--color-hud-amber)] bg-[var(--color-hud-amber)]/10' : 'border-gray-700 bg-gray-900/50'} text-center transition-all`}>
                  <div className={`text-4xl mb-2 ${!isUnlocked ? 'opacity-20 grayscale' : 'animate-pulse'}`}>{badge.icon}</div>
                  <div className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-[var(--color-hud-amber)]' : 'text-gray-500'}`}>{badge.title}</div>
                  <div className={`text-xs ${isUnlocked ? 'opacity-80' : 'opacity-40'}`}>{badge.description}</div>
                  {isUnlocked && (
                    <div className="text-[10px] opacity-50 mt-2">
                      {new Date(badge.unlockedAt!).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { sfx.playClick(); onLogout(); }}
          className="w-full bg-[var(--color-hud-red)]/10 border border-[var(--color-hud-red)] text-[var(--color-hud-red)] py-4 font-bold tracking-widest hover:bg-[var(--color-hud-red)] hover:text-white transition-colors cursor-pointer uppercase"
        >
          TERMINATE UPLINK (LOGOUT)
        </motion.button>
      </div>
    </div>
  );
}
