import { useEffect, useState } from 'react';
import type { RepResult } from '../lib/exerciseRules';
import { sfx } from '../lib/sounds';
import confetti from 'canvas-confetti';
import { processWorkout, type Badge } from '../lib/achievements';
import { motion } from 'framer-motion';
import { Trophy, Activity, Medal, ArrowRight, CheckCircle2, XOctagon, Timer, Flame } from 'lucide-react';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface Props {
  userId: string;
  isGuest: boolean;
  username: string;
  results: RepResult[];
  exercise: string;
  durationSeconds: number;
  onRestart: () => void;
}

export function SessionSummary({ userId, isGuest, username, results, exercise, durationSeconds, onRestart }: Props) {
  const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>([]);
  const [sessionCalories, setSessionCalories] = useState<number>(0);
  const [isNewPR, setIsNewPR] = useState(false);
  const totalReps = results.length;
  const goodReps = results.filter(r => r.goodForm).length;
  const formScore = totalReps === 0 ? 0 : Math.round((goodReps / totalReps) * 100);

  useEffect(() => {
    sfx.playCombo();
    
    if (totalReps > 0) {
      async function handleWorkout() {
        try {
          const result = await processWorkout(userId, isGuest, totalReps, formScore, exercise, durationSeconds);
          setUnlockedBadges(result.badges);
          setSessionCalories(result.calories);
          setIsNewPR(result.isNewPR);

          if (result.badges.length > 0 || formScore >= 80 || result.isNewPR) {
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#3b82f6', '#8b5cf6', '#fbbf24']
            });
            
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
          }
        } catch (err) {
          console.error('Failed to process workout stats:', err);
        }
      }
      handleWorkout();
    }
  }, [totalReps, formScore, userId, isGuest, exercise, durationSeconds]);

  const scoreColor = formScore >= 80 ? 'text-blue-400' : formScore >= 50 ? 'text-orange-400' : 'text-red-400';

  let aiMessage = "";
  let specificTip = "";
  
  if (totalReps === 0) {
    aiMessage = exercise === 'plank' 
      ? "Zero seconds recorded. Get on the floor and hold."
      : "Zero reps recorded. Even rest days require more effort than this.";
  } else {
    // Analyze errors to provide specific tips
    const errorCounts: Record<string, number> = {};
    results.forEach(r => {
      r.errors.forEach(e => {
        errorCounts[e] = (errorCounts[e] || 0) + 1;
      });
    });
    
    let mostFrequentError = "";
    let maxErrorCount = 0;
    Object.entries(errorCounts).forEach(([err, count]) => {
      if (count > maxErrorCount) {
        maxErrorCount = count;
        mostFrequentError = err;
      }
    });

    if (formScore >= 90) {
      aiMessage = `Outstanding execution. You burned ${sessionCalories} calories over ${formatDuration(durationSeconds)} with a stellar ${formScore}% form score`;
      if (isNewPR) aiMessage += `, and you even hit a new personal best for reps!`;
      else aiMessage += `. Keep pushing the limits.`;
      
      if (mostFrequentError) {
        specificTip = `Near perfect. Just a slight note: try to minimize "${mostFrequentError}" on fatigue reps.`;
      }
    } else if (formScore >= 60) {
      aiMessage = `Solid effort, burning ${sessionCalories} calories in ${formatDuration(durationSeconds)} with ${formScore}% form.`;
      if (isNewPR) aiMessage += ` You pushed hard enough to set a new personal record, but form started slipping.`;
      else aiMessage += ` Focus on quality over quantity next time.`;

      if (mostFrequentError) {
        if (mostFrequentError.toLowerCase().includes('depth')) {
          specificTip = "You're consistently missing depth. Drop the weight or stretch your hips to break parallel.";
        } else if (mostFrequentError.toLowerCase().includes('knee')) {
          specificTip = "Your knees are unstable. Actively drive them outwards tracking over your toes.";
        } else if (mostFrequentError.toLowerCase().includes('back') || mostFrequentError.toLowerCase().includes('chest')) {
          specificTip = "Keep your chest up and core braced to prevent your back from rounding.";
        } else if (mostFrequentError.toLowerCase().includes('flared')) {
          specificTip = "Tuck your elbows to 45 degrees to protect your shoulders.";
        } else {
          specificTip = `Main issue to fix: ${mostFrequentError.replace(/_/g, ' ')}. Focus on this specific cue next time.`;
        }
      }
    } else {
      aiMessage = `Critical form failure detected (${formScore}%). You spent ${formatDuration(durationSeconds)} working out, but we need to regress and focus purely on mechanics.`;
      if (mostFrequentError) {
        specificTip = `Your primary failure point is: ${mostFrequentError.replace(/_/g, ' ')}. Regress the movement until this is corrected.`;
      }
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen pt-24 pb-12 px-6 relative z-10 overflow-y-auto w-full">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 md:p-12 w-full max-w-4xl shadow-2xl">
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <Medal className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Workout Complete, {username}</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            "{aiMessage}"
          </p>
        </div>

        {/* Newly Unlocked Achievements */}
        {unlockedBadges.length > 0 && (
          <div className="mb-10 p-6 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-2xl">
            <h3 className="text-orange-400 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Achievements Unlocked
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unlockedBadges.map(badge => (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  key={badge.id} 
                  className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-orange-500/10"
                >
                  <div className="text-4xl">{badge.icon}</div>
                  <div>
                    <div className="font-bold text-white text-lg">{badge.title}</div>
                    <div className="text-sm text-slate-400">{badge.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> {exercise === 'plank' ? 'Hold (s)' : 'Reps'}
            </div>
            <div className="text-4xl font-black text-white">{totalReps}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${scoreColor}`} /> Form
            </div>
            <div className={`text-4xl font-black ${scoreColor}`}>{formScore}%</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2 flex items-center gap-2">
              <Timer className="w-4 h-4 text-purple-400" /> Time
            </div>
            <div className="text-4xl font-black text-white">{formatDuration(durationSeconds)}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> Cals
            </div>
            <div className="text-4xl font-black text-white">{sessionCalories}</div>
          </div>
        </div>
        
        {/* AI Coach Analysis */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center mb-10">
          <h3 className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-2">AI Coach Analysis</h3>
          <p className="text-white font-medium italic">"{aiMessage}"</p>
          {specificTip && (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg text-blue-300 text-sm font-semibold">
              <span className="font-bold text-blue-400">Pro Tip: </span> {specificTip}
            </div>
          )}
        </div>

        {totalReps > 0 && (
          <div className="mb-10 bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800/80 sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="py-4 px-6 text-xs text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-700/50">Rep</th>
                    <th className="py-4 px-6 text-xs text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-700/50">Quality</th>
                    <th className="py-4 px-6 text-xs text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-700/50">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {results.map(rep => (
                    <tr key={rep.repNumber} className="hover:bg-slate-700/10 transition-colors">
                      <td className="py-4 px-6 font-bold text-white">
                        {rep.repNumber}
                        {rep.streak > 1 && <span className="ml-2 text-xs text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">{rep.streak}x Combo</span>}
                      </td>
                      <td className="py-4 px-6">
                        {rep.goodForm ? (
                          <span className="text-blue-400 text-sm font-semibold flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Optimal</span>
                        ) : (
                          <span className="text-red-400 text-sm font-semibold flex items-center gap-1"><XOctagon className="w-4 h-4"/> Suboptimal</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400 capitalize">
                        {rep.errors.length === 0 ? '-' : rep.errors.map(e => e.replace(/_/g, ' ')).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={() => { sfx.playClick(); onRestart(); }}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-5 font-bold text-lg tracking-wide transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2"
        >
          Finish Workout <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
