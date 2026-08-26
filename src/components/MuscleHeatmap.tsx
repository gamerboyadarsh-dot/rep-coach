import { lazy, Suspense } from 'react';
import type { WorkoutSession } from '../lib/achievements';

const Heatmap3D = lazy(() => import('./Heatmap3D'));

interface Props {
  history: WorkoutSession[];
}

export function MuscleHeatmap({ history }: Props) {
  const hasWorkouts = history.length > 0;

  if (!hasWorkouts) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 italic text-sm">
        Complete a workout to see your heatmap
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full h-64 py-4 relative">
      <Suspense fallback={
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 rounded-xl">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="mt-4 text-xs font-bold text-slate-400 tracking-wider">LOADING 3D HEATMAP</span>
        </div>
      }>
        <Heatmap3D />
      </Suspense>
    </div>
  );
}
