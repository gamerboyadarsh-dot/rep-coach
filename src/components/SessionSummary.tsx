import { useEffect, useState } from 'react';
import type { RepResult } from '../lib/exerciseRules';
import { sfx } from '../lib/sounds';
import confetti from 'canvas-confetti';
import { processWorkout, type Badge } from '../lib/achievements';
import { motion } from 'framer-motion';

interface Props {
  username: string;
  results: RepResult[];
  onRestart: () => void;
}

export function SessionSummary({ username, results, onRestart }: Props) {
  const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>([]);
  const totalReps = results.length;
  const goodReps = results.filter(r => r.goodForm).length;
  const formScore = totalReps === 0 ? 0 : Math.round((goodReps / totalReps) * 100);

  useEffect(() => {
    sfx.playCombo(); // Play cool sound on load
    
    if (totalReps > 0) {
      const newBadges = processWorkout(username, totalReps, formScore);
      setUnlockedBadges(newBadges);

      if (newBadges.length > 0 || formScore >= 80) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#8b5cf6', '#ffb800']
        });
        
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    }
  }, [totalReps, formScore, username]);

  const scoreColor = formScore >= 80 ? 'text-[var(--color-hud-cyan)]' : formScore >= 50 ? 'text-[var(--color-hud-amber)]' : 'text-[var(--color-hud-red)]';

  // Simulated AI Coach
  let aiMessage = "";
  if (totalReps === 0) {
    aiMessage = "Wow. Zero reps. Why did you even turn me on? Pathetic.";
  } else if (formScore >= 90) {
    aiMessage = "I've analyzed your movement patterns and frankly... I'm impressed. That was near-perfect biomechanical execution. Keep this up, human.";
  } else if (formScore >= 60) {
    aiMessage = "Decent effort, but your form is slipping. My optical sensors caught several errors. You're better than this. Try again with focus.";
  } else {
    aiMessage = "CRITICAL FAILURE. That was painful to watch. Are you even trying, or are your servos malfunctioning? Fix your form immediately.";
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10 overflow-y-auto">
      <div className="hud-panel p-8 w-full max-w-3xl mt-12 mb-12">
        <div className="corner-bracket tl"></div>
        <div className="corner-bracket tr"></div>
        <div className="corner-bracket bl"></div>
        <div className="corner-bracket br"></div>

        <h1 className="text-4xl font-bold mb-8 text-center glow-text">SESSION COMPLETE</h1>

        {/* AI Debrief */}
        <div className="mb-8 p-6 border border-[var(--color-hud-violet)] bg-[var(--color-hud-violet)]/10 relative">
          <div className="absolute -top-3 left-4 bg-[var(--color-hud-bg)] px-2 text-xs text-[var(--color-hud-violet)] tracking-widest font-bold">AI COACH DEBRIEF // CLAUDE-SIM</div>
          <p className="text-lg leading-relaxed text-white">"{aiMessage}"</p>
        </div>

        {/* Newly Unlocked Achievements */}
        {unlockedBadges.length > 0 && (
          <div className="mb-8 p-6 border border-[var(--color-hud-amber)] bg-[var(--color-hud-amber)]/10 relative">
            <div className="absolute -top-3 left-4 bg-[var(--color-hud-bg)] px-2 text-xs text-[var(--color-hud-amber)] tracking-widest font-bold">ACHIEVEMENTS UNLOCKED</div>
            <div className="flex gap-4 flex-wrap">
              {unlockedBadges.map(badge => (
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  key={badge.id} 
                  className="flex items-center gap-3 bg-[var(--color-hud-bg)] border border-[var(--color-hud-amber)]/50 p-3"
                >
                  <div className="text-3xl">{badge.icon}</div>
                  <div>
                    <div className="font-bold text-[var(--color-hud-amber)] text-sm">{badge.title}</div>
                    <div className="text-xs opacity-70">{badge.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-8 mb-8">
          <div className="flex-1 bg-[var(--color-hud-bg)] border border-[var(--color-hud-cyan)]/30 p-6 text-center">
            <div className="text-sm opacity-70 uppercase tracking-widest mb-2">TOTAL REPS</div>
            <div className="text-5xl font-bold glow-text">{totalReps}</div>
          </div>
          <div className="flex-1 bg-[var(--color-hud-bg)] border border-[var(--color-hud-cyan)]/30 p-6 text-center">
            <div className="text-sm opacity-70 uppercase tracking-widest mb-2">FORM SCORE</div>
            <div className={`text-5xl font-bold glow-text ${scoreColor}`}>{formScore}%</div>
          </div>
        </div>

        {totalReps > 0 && (
          <div className="mb-8 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-hud-cyan)]/30">
                  <th className="py-2 text-sm opacity-70">REP</th>
                  <th className="py-2 text-sm opacity-70">STREAK</th>
                  <th className="py-2 text-sm opacity-70">QUALITY</th>
                  <th className="py-2 text-sm opacity-70">NOTES</th>
                </tr>
              </thead>
              <tbody>
                {results.map(rep => (
                  <tr key={rep.repNumber} className="border-b border-[var(--color-hud-cyan)]/10">
                    <td className="py-3 font-bold">{rep.repNumber}</td>
                    <td className="py-3 text-[var(--color-hud-amber)]">{rep.streak > 1 ? `${rep.streak}x` : '-'}</td>
                    <td className="py-3">
                      {rep.goodForm ? (
                        <span className="text-[var(--color-hud-cyan)] bg-[var(--color-hud-cyan)]/10 px-2 py-1 rounded">OPTIMAL</span>
                      ) : (
                        <span className="text-[var(--color-hud-red)] bg-[var(--color-hud-red)]/10 px-2 py-1 rounded">SUBOPTIMAL</span>
                      )}
                    </td>
                    <td className="py-3 text-sm opacity-80">
                      {rep.errors.length === 0 ? '-' : rep.errors.map(e => e.replace(/_/g, ' ')).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={() => { sfx.playClick(); onRestart(); }}
          className="w-full bg-[var(--color-hud-cyan)]/10 border border-[var(--color-hud-cyan)] text-[var(--color-hud-cyan)] py-4 font-bold tracking-widest hover:bg-[var(--color-hud-cyan)] hover:text-[var(--color-hud-bg)] transition-colors cursor-pointer"
        >
          INITIALIZE NEW SESSION
        </button>
      </div>
    </div>
  );
}
