import { useEffect, useState } from 'react';
import type { ExerciseType, RepState, PushupState } from '../lib/exerciseRules';
import { FormFeedback } from './FormFeedback';
import { sfx } from '../lib/sounds';
import { Target, Activity, Flame, XOctagon, CheckCircle2, Volume2, VolumeX, Ghost, Mic, MicOff } from 'lucide-react';
import type { GhostData } from '../lib/ghostChallenges';

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
  onEndSession: () => void;
}

export function WorkoutHUD({ exercise, repCount, state, errors, formScore, poseConfidence, streak, goal, power = 0, ghostData, startTime = 0, voiceControlEnabled = false, onToggleVoiceControl, onEndSession }: Props) {
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
    <div className="absolute inset-0 z-10 pointer-events-none transition-all duration-300">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-between items-start">
        <div className="flex gap-3 flex-wrap">
          
          <div className={`flex flex-col justify-center bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-4 py-2 pointer-events-auto transition-all ${isCombo ? 'shadow-[0_0_20px_rgba(249,115,22,0.3)] border-orange-500/50 scale-105' : 'shadow-lg'}`}>
            <div className="text-[10px] md:text-xs text-slate-300 uppercase tracking-widest font-bold mb-0.5 drop-shadow-lg">Program</div>
            <div className="text-sm md:text-base font-black text-white uppercase tracking-wide drop-shadow-md">
              {exercise.replaceAll('_', ' ')}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-4 py-2 pointer-events-auto shadow-lg">
            {hasGoodForm ? (
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            ) : (
              <XOctagon className="w-5 h-5 text-red-400" />
            )}
            <div className="flex flex-col">
              <div className="text-[10px] md:text-xs text-slate-300 uppercase tracking-widest font-bold mb-0.5 drop-shadow-lg">Form</div>
              <div className={`text-sm md:text-base font-black uppercase tracking-wide drop-shadow-md ${hasGoodForm ? 'text-blue-400' : 'text-red-400'}`}>
                {hasGoodForm ? 'Optimal' : 'Check Form'}
              </div>
            </div>
          </div>

          {streak > 1 && (
            <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-xl border border-orange-500/30 rounded-2xl px-4 py-2 pointer-events-auto shadow-lg">
              <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
              <div className="flex flex-col">
                <div className="text-[10px] md:text-xs text-orange-400/80 uppercase tracking-widest font-bold mb-0.5 drop-shadow-lg">Combo</div>
                <div className="text-sm md:text-base font-black text-orange-400 uppercase tracking-wide drop-shadow-md">{streak}x Multiplier</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {onToggleVoiceControl && (
            <button
              onClick={() => { sfx.playClick(); onToggleVoiceControl(); }}
              className={`backdrop-blur-md border hover:bg-slate-700 rounded-2xl px-4 py-3 transition-all pointer-events-auto shadow-lg self-end md:self-auto active:scale-95 flex items-center justify-center ${
                voiceControlEnabled ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {voiceControlEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 opacity-50" />}
            </button>
          )}

          <button
            onClick={toggleVoice}
            className="bg-slate-800/80 backdrop-blur-md border border-slate-700 hover:bg-slate-700 rounded-2xl px-4 py-3 transition-all pointer-events-auto shadow-lg self-end md:self-auto active:scale-95 flex items-center justify-center text-slate-300 hover:text-white"
          >
            {voiceOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-50" />}
          </button>
          
          <button
            onClick={() => { sfx.playClick(); onEndSession(); }}
            className="bg-red-500/10 backdrop-blur-md border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl px-5 py-3 transition-all pointer-events-auto font-bold tracking-widest cursor-pointer shadow-lg flex flex-col items-center justify-center active:scale-95"
          >
            <span className="uppercase text-xs md:text-sm">End Session</span>
            {voiceControlEnabled && <span className="text-[9px] md:text-[10px] opacity-70 mt-0.5">🎤 Say "Finish"</span>}
          </button>
        </div>
      </div>

      <div className="absolute top-28 left-4 right-4 flex justify-between items-start pointer-events-none">
        <FormFeedback errors={errors} />
        {power > 150 && (
          <div className="bg-orange-500/90 text-white font-black italic tracking-tighter px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.8)] animate-pulse rotate-3 text-xl border-2 border-orange-300">
            EXPLOSIVE 🔥
          </div>
        )}
      </div>

      {/* Bottom Panels */}
      <div className="absolute bottom-6 left-4 right-4 md:bottom-10 md:left-10 md:right-10 flex justify-between items-end pointer-events-none">
        
        {/* Rep Counter */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 min-w-[140px] md:min-w-[220px] shadow-2xl flex flex-col items-center pointer-events-auto">
          <div className="flex items-center justify-center gap-2 mb-2 w-full">
            <Target className="w-5 h-5 text-blue-400 drop-shadow-lg" />
            <span className="text-xs md:text-sm text-slate-300 uppercase tracking-widest font-bold drop-shadow-lg">
              {exercise === 'plank' ? 'Hold Time (s)' : 'Rep Count'}
            </span>
          </div>

          <div className="flex items-baseline justify-center gap-2 w-full">
            <div className={`text-7xl md:text-9xl font-black tabular-nums tracking-tighter drop-shadow-xl ${flash ? 'text-white scale-110 drop-shadow-[0_0_30px_rgba(59,130,246,1)]' : 'text-slate-100'} transition-all duration-200`}>
              {repCount}
            </div>
            {goal && (
              <div className="text-3xl md:text-5xl font-black text-slate-400 drop-shadow-lg">
                / {goal}
              </div>
            )}
          </div>

          {goal && (
            <div className="w-full mt-6 flex flex-col gap-2">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${progress}%` }}></div>
              </div>
              {ghostData && (
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative flex items-center">
                  <div className="absolute inset-y-0 left-0 bg-purple-500/80 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" style={{ width: `${Math.min(100, (ghostRepCount / ghostData.goal) * 100)}%` }}></div>
                  <Ghost className="w-3 h-3 text-purple-300 absolute -mt-[14px]" style={{ left: `calc(${Math.min(100, (ghostRepCount / ghostData.goal) * 100)}% - 6px)` }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Metrics */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-5 md:p-6 min-w-[160px] md:min-w-[280px] shadow-2xl flex flex-col gap-5 pointer-events-auto">
          
          <div className="flex justify-between items-end w-full">
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs text-slate-300 uppercase tracking-widest font-bold mb-1 drop-shadow-lg">Form Score</span>
              <span className={`text-3xl md:text-4xl font-black tabular-nums drop-shadow-lg ${scoreColor}`}>{formScore}%</span>
            </div>
            {exercise !== 'plank' && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] md:text-xs text-slate-300 uppercase tracking-widest font-bold mb-1 flex items-center gap-1 drop-shadow-lg text-orange-400">
                  <Flame className="w-3 h-3 drop-shadow-lg" /> Power
                </span>
                <span className={`text-xl md:text-2xl font-black tabular-nums drop-shadow-lg text-orange-300`}>{power} <span className="text-xs">W</span></span>
              </div>
            )}
            <div className="flex flex-col items-end">
              <span className="text-[10px] md:text-xs text-slate-300 uppercase tracking-widest font-bold mb-1 flex items-center gap-1 drop-shadow-lg">
                <Activity className="w-3 h-3 drop-shadow-lg" /> Confidence
              </span>
              <span className={`text-xl md:text-2xl font-black tabular-nums drop-shadow-lg ${confidenceColor}`}>{poseConfidence}%</span>
            </div>
          </div>

          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] md:text-xs text-slate-300 uppercase tracking-widest font-bold drop-shadow-lg">Stage</span>
              <span className="text-xs md:text-sm font-black text-blue-400 tracking-wide uppercase drop-shadow-lg">{state}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 md:h-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                style={{ width: stateProgress }}
              ></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
