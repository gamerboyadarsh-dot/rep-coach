import { lazy, Suspense } from 'react';
import { SkeletonBlock } from './Skeleton';
import type { WorkoutSession } from '../lib/achievements';

const Heatmap3D = lazy(() => import('./Heatmap3D'));

interface Props {
  history: WorkoutSession[];
}

export function MuscleHeatmap({ history }: Props) {
  return (
    <div className="w-full relative">
      <Suspense fallback={<SkeletonBlock className="w-full h-[380px] rounded-xl" />}>
        <Heatmap3D history={history} />
      </Suspense>
    </div>
  );
}
