import { lazy, Suspense } from 'react';
import type { WorkoutSession } from '../lib/achievements';

const Heatmap3D = lazy(() => import('./Heatmap3D'));

interface Props {
  history: WorkoutSession[];
}

export function MuscleHeatmap({ history }: Props) {
  return (
    <div className="w-full relative">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-[380px] bg-slate-900/50 rounded-xl gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400 tracking-widest">LOADING 3D HEATMAP</span>
        </div>
      }>
        <Heatmap3D history={history} />
      </Suspense>
    </div>
  );
}
