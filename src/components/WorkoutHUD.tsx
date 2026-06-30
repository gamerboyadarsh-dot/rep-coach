import { useEffect, useState } from 'react';
import type { ExerciseType, RepState, PushupState } from '../lib/exerciseRules';
import { FormFeedback } from './FormFeedback';
import { sfx } from '../lib/sounds';
import { Target, Activity, Flame, XOctagon, CheckCircle2, Volume2, VolumeX, Ghost, Mic, MicOff } from 'lucide-react';
import type { GhostData } from '../lib/ghostChallenges';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition, staggerContainer, cardEntrance, tapEffect, hoverEffect } from '../lib/animations';

interface Props {
  exercise: ExerciseType;
  repCount: number;
  state: RepState | PushupState;
  errors: string[];
  formScore: number;
  poseConfidence: number;
  streak: number;
  goal: number | null;
  power?: number;
  ghostData?: GhostData | null;
  startTime?: number;
  voiceControlEnabled?: boolean;
  onToggleVoiceControl?: () => void;
  rhythmModeEnabled?: boolean;
  rhythmRating?: 'PERFECT' | 'GOOD' | 'MISS' | null;
  onEndSession: () => void;
}

export function WorkoutHUD({ exercise, repCount, state, errors, formScore, poseConfidence, streak, goal, power = 0, ghostData, startTime = 0, voiceControlEnabled = false, onToggleVoiceControl, rhythmModeEnabled = false, rhythmRating = null, onEndSession }: Props) {
  const [flash, setFlash] = useState(false);
  const [prevRep, setPrevRep] = useState(repCount);
  const [prevErrorKey, setPrevErrorKey] = useState('');
  const [voiceOn, setVoiceOn] = useState(() => sfx.isVoiceEnabled());
  
  // Ghost state
  const [ghostRepCount, setGhostRepCount] = useState(0);

  useEffect(() => {
    if (!ghostData || !startTime) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let completedReps = 0;
      for (const time of ghostData.timestamps) {
        if (elapsed >= time) completedReps++;
        else break;
      }
      setGhostRepCount(completedReps);
    }, 100);
    return () => clearInterval(interval);
  }, [ghostData, startTime]);

  const toggleVoice = () => {
    const newVal = !voiceOn;
    setVoiceOn(newVal);
    sfx.setVoiceEnabled(newVal);
    sfx.playClick();
  };

  useEffect(() => {
    if (repCount > prevRep) {
      setFlash(true);
      sfx.playRepComplete();
      
      // Voice feedback every 5 reps or goal reached
      if (voiceOn) {
        const personality = localStorage.getItem('repCoach_personality') || 'supportive';
        const isDrill = personality === 'drill_sergeant';

        if (goal && repCount === goal) {
          sfx.speakCue(isDrill ? "Goal reached. Don't stop now, give me more!" : "Goal reached! Great job.");
        } else if (goal && repCount === Math.floor(goal / 2)) {
          sfx.speakCue(isDrill ? "Only halfway! Stop slacking!" : "Halfway there!");
        } else if (repCount % 5 === 0) {
          sfx.speakCue(`${repCount}`);
        }
      }

      if (streak > 0 && streak % 5 === 0) {
        setTimeout(() => sfx.playCombo(), 400);
      }
      setTimeout(() => setFlash(false), 300);
      setPrevRep(repCount);
    }
  }, [repCount, prevRep, streak, voiceOn, goal]);

  useEffect(() => {
    const key = errors.slice().sort().join(',');
    if (errors.length > 0 && key !== prevErrorKey) {
      sfx.playError();
      if (voiceOn) {
        const personality = localStorage.getItem('repCoach_personality') || 'supportive';
        // Just speak the first error so it doesn't ramble
        const err = errors[0];
        if (personality === 'drill_sergeant') {
          sfx.speakCue(`Fix your form! ${err}`);
        } else {
          sfx.speakCue(err);
        }
      }
    }
    setPrevErrorKey(key);
  }, [errors, prevErrorKey, voiceOn]);

  const scoreColor = formScore >= 80 ? 'text-blue-400' : formScore >= 50 ? 'text-orange-400' : 'text-red-400';
  const confidenceColor = poseConfidence >= 70 ? 'text-blue-400' : poseConfidence >= 40 ? 'text-orange-400' : 'text-red-400';
  const isCombo = streak >= 3;
  const progress = goal ? Math.min((repCount / goal) * 100, 100) : null;
  const hasGoodForm = errors.length === 0 && poseConfidence >= 50;

  const stateProgress = (() => {
    switch (state) {
      case 'descending': case 'out': return '50%';
      case 'bottom': return '100%';
      case 'ascending': case 'in': return '75%';
      case 'planking': return '100%';
      case 'resting': return '0%';
      default: return '0%';
    }
  })();

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="absolute inset-0 z-50 pointer-events-none transition-all duration-300">
      {/* Top Bar */}
      <motion.div variants={staggerContainer} className="absolute top-0 left-0 right-0 p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-between items-start">
        <div className="flex gap-3 flex-wrap">
          
          <motion.div variants={cardEntrance} className={`flex flex-col justify-center surface-float rounded-full px-5 py-2 pointer-events-auto transition-all border shadow-lg ${isCombo ? 'shadow-[0_0_20px_rgba(249,115,22,0.3)] border-orange-500/50 scale-105' : 'border-white/5 hover:border-white/20'}`}>
            <div className="text-meta mb-0.5">Program</div>
            <div className="text-sm font-bold text-white tracking-wide capitalize">
              {exercise.replaceAll('_', ' ')}
            </div>
          </motion.div>

          <motion.div variants={cardEntrance} className="flex items-center gap-3 surface-float rounded-full px-5 py-2 pointer-events-auto border border-white/5 hover:border-white/20 shadow-lg">
            {hasGoodForm ? (
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            ) : (
              <XOctagon className="w-5 h-5 text-red-400 animate-pulse" />
            )}
            <div className="flex flex-col">
              <div className="text-meta mb-0.5">Form</div>
              <div className={`text-sm font-bold tracking-wide ${hasGoodForm ? 'text-blue-400' : 'text-red-400'}`}>
                {hasGoodForm ? 'Optimal' : 'Check Form'}
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {streak > 1 && (
              <motion.div 
                initial={{ y: 20, scale: 0.9, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 25 } as any }}
                exit={{ scale: 0.9, y: -20, opacity: 0, transition: { type: "spring", stiffness: 400, damping: 25 } as any }}
                className="flex items-center gap-2 surface-float border border-orange-500/50 rounded-full px-5 py-2 pointer-events-auto shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
              <div className="flex flex-col">
                <div className="text-meta text-orange-400/80 mb-0.5">Combo</div>
                <div className="text-sm font-bold text-orange-400 tracking-wide">{streak}x Multiplier</div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        <motion.div variants={staggerContainer} className="flex gap-2">
          {onToggleVoiceControl && (
            <button
              onClick={() => { sfx.playClick(); onToggleVoiceControl(); }}
              className={`backdrop-blur-md border rounded-full px-4 py-2 transition-all pointer-events-auto shadow-lg self-end md:self-auto active:scale-95 flex items-center justify-center ${
                voiceControlEnabled ? 'surface-float border-blue-500/50 text-blue-400' : 'surface-raised border-white/5 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {voiceControlEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 opacity-50" />}
            </button>
          )}

          <motion.button
            variants={cardEntrance}
            whileHover={hoverEffect}
            whileTap={tapEffect}
            onClick={toggleVoice}
            className="surface-float border border-white/5 hover:border-white/20 rounded-full px-4 py-2 transition-all pointer-events-auto flex items-center justify-center text-slate-400 hover:text-white shadow-lg"
          >
            {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-50" />}
          </motion.button>
          
          <motion.button
            variants={cardEntrance}
            whileHover={hoverEffect}
            whileTap={tapEffect}
            onClick={() => { sfx.playClick(); onEndSession(); }}
            className="surface-float border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-full px-6 py-2 transition-all pointer-events-auto font-bold tracking-widest cursor-pointer flex flex-col items-center justify-center shadow-lg"
          >
            <span className="uppercase text-xs md:text-sm">End Session</span>
            {voiceControlEnabled && <span className="text-[9px] md:text-[10px] opacity-70 mt-0.5">🎤 Say "Finish"</span>}
          </motion.button>
        </motion.div>
      </motion.div>

      <div className="absolute top-28 left-4 right-4 flex justify-between items-start pointer-events-none">
       {/* Exploding Power Metric (If very explosive) */}
      {power > 120 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping opacity-0 text-orange-500 font-black text-6xl italic drop-shadow-[0_0_25px_rgba(249,115,22,1)] pointer-events-none z-50">
          EXPLOSIVE 🔥
        </div>
      )}

      {/* Rhythm Game Hit Rating */}
      {rhythmModeEnabled && rhythmRating && (
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce font-black text-6xl italic drop-shadow-[0_0_25px_rgba(168,85,247,1)] pointer-events-none z-50 ${
          rhythmRating === 'PERFECT' ? 'text-purple-400' :
          rhythmRating === 'GOOD' ? 'text-blue-400' : 'text-red-500'
        }`}>
          {rhythmRating}!
        </div>
      )}

      {/* Rhythm Beat Indicator */}
      {rhythmModeEnabled && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-64 bg-slate-900/50 rounded-full border border-purple-500/30 overflow-hidden flex flex-col justify-end pointer-events-none">
          <div className="w-full h-8 bg-purple-500/20 border-y border-purple-400/50 absolute bottom-8 z-10 flex items-center justify-center">
            <div className="text-[8px] font-bold text-purple-300 uppercase tracking-widest">Beat</div>
          </div>
          <div className="w-full bg-gradient-to-t from-purple-500/80 to-transparent animate-pulse" style={{ height: '100%', animationDuration: '0.5s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' }}></div>
        </div>
      )}

      {/* Top HUD Area */}
        <FormFeedback errors={errors} />
      </div>

      {/* Bottom Panels */}
      <motion.div variants={staggerContainer} className="absolute bottom-6 left-4 right-4 md:bottom-10 md:left-10 md:right-10 flex justify-between items-end pointer-events-none">
        
        {/* Rep Counter */}
        <motion.div variants={cardEntrance} className="surface-float p-8 rounded-3xl min-w-[160px] md:min-w-[260px] flex flex-col items-center pointer-events-auto shadow-2xl border border-white/10 relative overflow-hidden group">
          {/* Subtle Glow */}
          <div className="absolute top-0 left-0 w-full h-full bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

          <div className="flex items-center justify-center gap-2 mb-4 w-full">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-meta">
              {exercise === 'plank' ? 'Hold Time (s)' : 'Rep Count'}
            </span>
          </div>

          <div className="flex items-baseline justify-center gap-2 w-full relative z-10">
            <motion.div
                initial={{ y: 20, scale: 0.9, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 25 } as any }}
                exit={{ scale: 0.9, y: -20, opacity: 0, transition: { type: "spring", stiffness: 400, damping: 25 } as any }}
                className={`text-7xl md:text-[8rem] font-black tracking-tighter transition-all duration-200 ${flash ? 'text-white scale-110 drop-shadow-[0_0_30px_rgba(59,130,246,1)]' : 'text-hero-gradient'}`} style={{ lineHeight: '1' }}>
              {repCount}
            </motion.div>
            {goal && (
              <div className="text-3xl font-bold text-slate-500 ml-2">
                / {goal}
              </div>
            )}
          </div>

          {goal && (
            <div className="w-full mt-8 flex flex-col gap-3 relative z-10">
              <div className="w-full bg-slate-900/80 rounded-full h-2.5 overflow-hidden relative border border-white/5 shadow-inner">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500 ease-[0.22,1,0.36,1] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]" style={{ width: `${progress}%` }}></div>
              </div>
              {ghostData && (
                <div className="w-full bg-slate-900/80 rounded-full h-2.5 overflow-hidden relative flex items-center border border-white/5 shadow-inner mt-1">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500 ease-[0.22,1,0.36,1] rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)]" style={{ width: `${Math.min(100, (ghostRepCount / ghostData.goal) * 100)}%` }}></div>
                  <Ghost className="w-4 h-4 text-purple-300 absolute -mt-[18px]" style={{ left: `calc(${Math.min(100, (ghostRepCount / ghostData.goal) * 100)}% - 8px)` }} />
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Live Metrics */}
        <motion.div variants={cardEntrance} className="surface-float p-6 md:p-8 rounded-3xl min-w-[180px] md:min-w-[320px] flex flex-col gap-8 pointer-events-auto shadow-2xl border border-white/10">
          
          <div className="flex justify-between items-end w-full gap-4">
            <div className="flex flex-col">
              <span className="text-meta mb-1">Form Score</span>
              <span className={`text-3xl md:text-5xl font-black tabular-nums tracking-tight ${scoreColor}`}>{formScore}%</span>
            </div>
            {exercise !== 'plank' && (
              <div className="flex flex-col items-center">
                <span className="text-meta mb-1 flex items-center gap-1 text-orange-400">
                  <Flame className="w-3 h-3" /> Power
                </span>
                <span className={`text-xl md:text-3xl font-black tabular-nums tracking-tight text-orange-400`}>{power} <span className="text-sm">W</span></span>
              </div>
            )}
            <div className="flex flex-col items-end">
              <span className="text-meta mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Confidence
              </span>
              <span className={`text-xl md:text-3xl font-black tabular-nums tracking-tight ${confidenceColor}`}>{poseConfidence}%</span>
            </div>
          </div>

          <div className="w-full">
            <div className="flex justify-between items-center mb-3">
              <span className="text-meta">Stage</span>
              <span className="text-sm font-bold text-blue-400 tracking-wide uppercase">{state}</span>
            </div>
            <div className="w-full bg-slate-900/80 rounded-full h-2 overflow-hidden border border-white/5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 ease-[0.22,1,0.36,1] rounded-full"
                style={{ width: stateProgress }}
              ></div>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </motion.div>
  );
}
