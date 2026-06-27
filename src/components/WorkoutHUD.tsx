import { useEffect, useState } from 'react';
import type { ExerciseType, RepState, PushupState } from '../lib/exerciseRules';
import { FormFeedback } from './FormFeedback';
import { sfx } from '../lib/sounds';
import { Target, Activity, Flame, XOctagon, CheckCircle2 } from 'lucide-react';

interface Props {
  exercise: ExerciseType;
  repCount: number;
  state: RepState | PushupState;
  errors: string[];
  formScore: number;
  poseConfidence: number;
  streak: number;
  goal: number | null;
  onEndSession: () => void;
}

export function WorkoutHUD({ exercise, repCount, state, errors, formScore, poseConfidence, streak, goal, onEndSession }: Props) {
  const [flash, setFlash] = useState(false);
  const [prevRep, setPrevRep] = useState(repCount);
  const [prevErrorKey, setPrevErrorKey] = useState('');

  useEffect(() => {
    if (repCount > prevRep) {
      setFlash(true);
      sfx.playRepComplete();
      if (streak > 0 && streak % 5 === 0) {
        setTimeout(() => sfx.playCombo(), 400);
      }
      setTimeout(() => setFlash(false), 300);
      setPrevRep(repCount);
    }
  }, [repCount, prevRep, streak]);

  useEffect(() => {
    const key = errors.slice().sort().join(',');
    if (errors.length > 0 && key !== prevErrorKey) {
      sfx.playError();
    }
    setPrevErrorKey(key);
  }, [errors, prevErrorKey]);

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
      default: return '0%';
    }
  })();

  return (
    <div className="absolute inset-0 z-10 pointer-events-none transition-all duration-300">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-between items-start">
        <div className="flex gap-3 flex-wrap">
          
          <div className={`flex flex-col justify-center bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-4 py-2 pointer-events-auto transition-all ${isCombo ? 'shadow-[0_0_20px_rgba(249,115,22,0.3)] border-orange-500/50 scale-105' : 'shadow-lg'}`}>
            <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Program</div>
            <div className="text-sm md:text-base font-bold text-white uppercase tracking-wide">
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
              <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Form</div>
              <div className={`text-sm md:text-base font-bold uppercase tracking-wide ${hasGoodForm ? 'text-blue-400' : 'text-red-400'}`}>
                {hasGoodForm ? 'Optimal' : 'Check Form'}
              </div>
            </div>
          </div>

          {streak > 1 && (
            <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-xl border border-orange-500/30 rounded-2xl px-4 py-2 pointer-events-auto shadow-lg">
              <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
              <div className="flex flex-col">
                <div className="text-[10px] md:text-xs text-orange-400/80 uppercase tracking-widest font-semibold mb-0.5">Combo</div>
                <div className="text-sm md:text-base font-bold text-orange-400 uppercase tracking-wide">{streak}x Multiplier</div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => { sfx.playClick(); onEndSession(); }}
          className="bg-red-500/10 backdrop-blur-md border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl px-5 py-3 transition-all pointer-events-auto font-bold uppercase tracking-widest cursor-pointer text-xs md:text-sm shadow-lg self-end md:self-auto active:scale-95"
        >
          End Session
        </button>
      </div>

      <FormFeedback errors={errors} />

      {/* Bottom Panels */}
      <div className="absolute bottom-6 left-4 right-4 md:bottom-10 md:left-10 md:right-10 flex justify-between items-end pointer-events-none">
        
        {/* Rep Counter */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 min-w-[140px] md:min-w-[220px] shadow-2xl flex flex-col items-center pointer-events-auto">
          <div className="flex items-center justify-center gap-2 mb-2 w-full">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-xs md:text-sm text-slate-400 uppercase tracking-widest font-semibold">Rep Count</span>
          </div>

          <div className="flex items-baseline justify-center gap-2 w-full">
            <div className={`text-6xl md:text-8xl font-black tabular-nums tracking-tighter ${flash ? 'text-white scale-110 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]' : 'text-slate-100'} transition-all duration-200`}>
              {repCount}
            </div>
            {goal && (
              <div className="text-2xl md:text-4xl font-bold text-slate-500">
                / {goal}
              </div>
            )}
          </div>

          {goal && (
            <div className="w-full bg-slate-800 rounded-full h-2 mt-6 overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-500 ease-out rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>

        {/* Live Metrics */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-5 md:p-6 min-w-[160px] md:min-w-[280px] shadow-2xl flex flex-col gap-5 pointer-events-auto">
          
          <div className="flex justify-between items-end w-full">
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Form Score</span>
              <span className={`text-2xl md:text-3xl font-black tabular-nums ${scoreColor}`}>{formScore}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Confidence
              </span>
              <span className={`text-lg md:text-xl font-bold tabular-nums ${confidenceColor}`}>{poseConfidence}%</span>
            </div>
          </div>

          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-semibold">Stage</span>
              <span className="text-xs md:text-sm font-bold text-blue-400 tracking-wide uppercase">{state}</span>
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
