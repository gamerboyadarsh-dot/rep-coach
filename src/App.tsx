import { useEffect, useState } from 'react';
import { usePoseDetection } from './hooks/usePoseDetection';
import { CameraView } from './components/CameraView';
import { ExerciseSelector } from './components/ExerciseSelector';
import { WorkoutHUD } from './components/WorkoutHUD';
import { SessionSummary } from './components/SessionSummary';
import { AuthScreen } from './components/AuthScreen';
import { UserProfile } from './components/UserProfile';
import { ExerciseGuide } from './components/ExerciseGuide';
import { exerciseLogic } from './lib/exerciseRules';
import { sfx } from './lib/sounds';
import type { ExerciseType, RepState, PushupState } from './lib/exerciseRules';
import './App.css';

type AppState = 'auth' | 'selecting' | 'workout' | 'summary' | 'profile' | 'guide';

function App() {
  console.log("Hackathon Ready! v2");
  const [appState, setAppState] = useState<AppState>('auth');
  const [username, setUsername] = useState<string | null>(null);
  const [exercise, setExercise] = useState<ExerciseType>('squat');
  const [goal, setGoal] = useState<number | null>(null);
  
  // Workout state
  const [repCount, setRepCount] = useState(0);
  const [exerciseState, setExerciseState] = useState<RepState | PushupState>('standing');
  const [errors, setErrors] = useState<string[]>([]);
  const [formScore, setFormScore] = useState(100);

  const {
    isLoaded,
    landmarks,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    error: cameraError
  } = usePoseDetection();

  const handleStartWorkout = async (selectedExercise: ExerciseType, selectedGoal: number | null) => {
    setExercise(selectedExercise);
    setGoal(selectedGoal);
    exerciseLogic.reset();
    setRepCount(0);
    setExerciseState(selectedExercise === 'squat' ? 'standing' : selectedExercise === 'pushup' ? 'up' : 'standing');
    setErrors([]);
    setFormScore(100);
    setAppState('workout');
    
    try {
      await startCamera();
    } catch (err) {
      console.error('Failed to start camera', err);
    }
  };

  const handleEndSession = () => {
    stopCamera();
    setAppState('summary');
  };

  // Main pose processing loop
  useEffect(() => {
    if (appState !== 'workout' || !landmarks || landmarks.length === 0) return;

    if (exercise === 'squat') {
      const { state, errors: newErrors } = exerciseLogic.processSquatFrame(landmarks);
      setExerciseState(state);
      setErrors(newErrors);
    } else if (exercise === 'pushup') {
      // Find shoulder Y to help with logic if needed
      const leftShoulder = landmarks[11]; // LANDMARKS.LEFT_SHOULDER
      const { state, errors: newErrors } = exerciseLogic.processPushupFrame(landmarks, leftShoulder?.y || 0, true); // Using left side by default
      setExerciseState(state);
      setErrors(newErrors);
    } else if (exercise === 'jumping_jack') {
      const { state, errors: newErrors } = exerciseLogic.processJumpingJackFrame(landmarks);
      setExerciseState(state);
      setErrors(newErrors);
    }

    const currentReps = exerciseLogic.getRepCount();
    setRepCount(currentReps);
    setFormScore(exerciseLogic.getFormScore());

    if (goal !== null && currentReps >= goal) {
      setTimeout(() => {
        stopCamera();
        setAppState('summary');
      }, 1000); // 1 second delay so they see the final rep flash
    }
  }, [landmarks, exercise, appState, goal]);

  const handleLogin = (user: string) => {
    setUsername(user);
    setAppState('selecting');
  };

  const handleLogout = () => {
    setUsername(null);
    setAppState('auth');
  };

  const renderNav = () => {
    if (appState === 'auth' || appState === 'workout') return null;
    return (
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <div className="text-[var(--color-hud-cyan)] font-bold tracking-widest text-xl glow-text">REP COACH</div>
        <div className="flex gap-4">
          <button onClick={() => { sfx.playClick(); setAppState('selecting'); }} className={`px-4 py-2 uppercase tracking-widest text-sm transition-colors cursor-pointer ${appState === 'selecting' ? 'bg-[var(--color-hud-cyan)]/20 text-[var(--color-hud-cyan)] border border-[var(--color-hud-cyan)]' : 'text-white opacity-70 hover:opacity-100'}`}>WORKOUT</button>
          <button onClick={() => { sfx.playClick(); setAppState('guide'); }} className={`px-4 py-2 uppercase tracking-widest text-sm transition-colors cursor-pointer ${appState === 'guide' ? 'bg-[var(--color-hud-cyan)]/20 text-[var(--color-hud-cyan)] border border-[var(--color-hud-cyan)]' : 'text-white opacity-70 hover:opacity-100'}`}>DATABANK</button>
          <button onClick={() => { sfx.playClick(); setAppState('profile'); }} className={`px-4 py-2 uppercase tracking-widest text-sm transition-colors cursor-pointer ${appState === 'profile' ? 'bg-[var(--color-hud-cyan)]/20 text-[var(--color-hud-cyan)] border border-[var(--color-hud-cyan)]' : 'text-white opacity-70 hover:opacity-100'}`}>PROFILE</button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-hud-bg)] text-[var(--color-hud-cyan)]">
      {/* Background elements */}
      <div className="scanlines"></div>
      <div className="grid-bg"></div>

      {renderNav()}
      
      {appState === 'auth' && (
        <AuthScreen onLogin={handleLogin} />
      )}

      {appState === 'profile' && username && (
        <UserProfile username={username} onLogout={handleLogout} />
      )}

      {appState === 'guide' && (
        <ExerciseGuide />
      )}

      {appState === 'selecting' && username && (
        <ExerciseSelector username={username} onSelect={handleStartWorkout} />
      )}

      {appState === 'workout' && (
        <>
          <CameraView 
            videoRef={videoRef}
            canvasRef={canvasRef}
            isLoaded={isLoaded}
            error={cameraError}
          />
          <WorkoutHUD
            exercise={exercise}
            repCount={repCount}
            state={exerciseState}
            errors={errors}
            formScore={formScore}
            streak={exerciseLogic.getCurrentStreak()}
            goal={goal}
            onEndSession={handleEndSession}
          />
        </>
      )}

      {appState === 'summary' && username && (
        <SessionSummary 
          username={username}
          results={exerciseLogic.getResults()}
          onRestart={() => setAppState('selecting')}
        />
      )}
    </div>
  );
}

export default App;
