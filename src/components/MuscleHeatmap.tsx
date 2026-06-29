import { useMemo } from 'react';
import Model from 'react-body-highlighter';
import type { IExerciseData, Muscle } from 'react-body-highlighter';
import type { WorkoutSession } from '../lib/achievements';

interface Props {
  history: WorkoutSession[];
}

export function MuscleHeatmap({ history }: Props) {
  const workoutData = useMemo(() => {
    let squatFreq = 0;
    let pushupFreq = 0;
    let jumpingJackFreq = 0;
    let plankFreq = 0;

    history.forEach((session) => {
      if (session.exercise === 'squat') squatFreq += session.reps;
      else if (session.exercise === 'pushup') pushupFreq += session.reps;
      else if (session.exercise === 'jumping_jack' || session.exercise === 'jumping-jack') jumpingJackFreq += session.reps;
      else if (session.exercise === 'plank') plankFreq += session.reps;
    });

    const data: IExerciseData[] = [];

    if (squatFreq > 0) {
      data.push({
        name: 'Squat',
        muscles: ['gluteal', 'quadriceps', 'hamstring', 'calves', 'lower-back'] as Muscle[],
        frequency: squatFreq
      });
    }

    if (pushupFreq > 0) {
      data.push({
        name: 'Pushup',
        muscles: ['chest', 'front-deltoids', 'triceps', 'abs'] as Muscle[],
        frequency: pushupFreq
      });
    }

    if (jumpingJackFreq > 0) {
      data.push({
        name: 'Jumping Jack',
        muscles: ['calves', 'quadriceps', 'front-deltoids'] as Muscle[],
        frequency: jumpingJackFreq
      });
    }

    if (plankFreq > 0) {
      data.push({
        name: 'Plank',
        muscles: ['abs', 'obliques', 'lower-back', 'front-deltoids'] as Muscle[],
        frequency: plankFreq
      });
    }

    return data;
  }, [history]);

  if (workoutData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 italic text-sm">
        Complete a workout to see your heatmap
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center gap-8 py-4">
      <div className="flex flex-col items-center w-32 h-64">
        <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Anterior</h4>
        <Model
          data={workoutData}
          style={{ width: '100%', height: '100%' }}
          highlightedColors={['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']} // Blue scale based on frequency
          bodyColor="#1e293b" // slate-800
        />
      </div>
      
      <div className="flex flex-col items-center w-32 h-64">
        <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Posterior</h4>
        <Model
          data={workoutData}
          type="posterior"
          style={{ width: '100%', height: '100%' }}
          highlightedColors={['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']} 
          bodyColor="#1e293b"
        />
      </div>
    </div>
  );
}
