import React, { useEffect, useRef, useState, Suspense } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { usePoseDetection } from './hooks/usePoseDetection';
import { exerciseLogic } from './lib/exerciseRules';
import { sfx } from './lib/sounds';
import type { ExerciseType, RepState, PushupState } from './lib/exerciseRules';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

const CameraView = React.lazy(() => import('./components/CameraView').then(m => ({ default: m.CameraView })));
const ExerciseSelector = React.lazy(() => import('./components/ExerciseSelector').then(m => ({ default: m.ExerciseSelector })));
const WorkoutHUD = React.lazy(() => import('./components/WorkoutHUD').then(m => ({ default: m.WorkoutHUD })));
const SessionSummary = React.lazy(() => import('./components/SessionSummary').then(m => ({ default: m.SessionSummary })));
const AuthScreen = React.lazy(() => import('./components/AuthScreen').then(m => ({ default: m.AuthScreen })));
const UserProfile = React.lazy(() => import('./components/UserProfile').then(m => ({ default: m.UserProfile })));
const ExerciseGuide = React.lazy(() => import('./components/ExerciseGuide').then(m => ({ default: m.ExerciseGuide })));

// Loading Skeleton
const FullScreenLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

type AppState = 'auth' | 'selecting' | 'workout' | 'summary' | 'profile' | 'guide';

function App() {
  const [appState, setAppState] = useState<AppState>('auth');
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [exercise, setExercise] = useState<ExerciseType>('squat');
  const [goal, setGoal] = useState<number | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    if (!auth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setUsername(user.displayName || user.email || 'Athlete');
        setUserPhoto(user.photoURL || null);
        setIsGuest(false);
        setAppState('selecting');
      } else {
        setUserId(null);
        setUsername(null);
        setUserPhoto(null);
        setIsGuest(false);
        setAppState('auth');
      }
    });
    return () => unsubscribe();
  }, []);

  // Workout state
  const [repCount, setRepCount] = useState(0);
  const [exerciseState, setExerciseState] = useState<RepState | PushupState>('standing');
  const [errors, setErrors] = useState<string[]>([]);
  const [formScore, setFormScore] = useState(100);
  const [startTime, setStartTime] = useState<number>(0);
  const [workoutDuration, setWorkoutDuration] = useState<number>(0);

  // Guard ref to prevent goal-completion firing multiple times
  const goalReachedRef = useRef(false);

  const {
    isLoaded,
    landmarks,
    poseConfidence,
    cameraCount,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    toggleCamera,
    isFrontFacing,
    error: cameraError,
  } = usePoseDetection();

  const handleStartWorkout = async (selectedExercise: ExerciseType, selectedGoal: number | null) => {
    setExercise(selectedExercise);
    setGoal(selectedGoal);
    exerciseLogic.reset();
    goalReachedRef.current = false;
    setRepCount(0);
    setExerciseState(selectedExercise === 'pushup' ? 'up' : 'standing');
    setErrors([]);
    setFormScore(100);
    setAppState('workout');
    setStartTime(Date.now());
    setWorkoutDuration(0);

    try {
      await startCamera();
    } catch (err) {
      console.error('Failed to start camera', err);
    }
  };

  const handleEndSession = () => {
    stopCamera();
    setWorkoutDuration(Math.round((Date.now() - startTime) / 1000));
    setAppState('summary');
  };

  // Main pose processing loop — runs on every landmark update (~25fps)
  useEffect(() => {
    if (appState !== 'workout' || !landmarks || landmarks.length === 0) return;

    let result: { state: RepState | PushupState; errors: string[]; currentRep?: unknown };

    if (exercise === 'squat') {
      result = exerciseLogic.processSquatFrame(landmarks);
    } else if (exercise === 'pushup') {
      result = exerciseLogic.processPushupFrame(landmarks);
    } else {
      result = exerciseLogic.processJumpingJackFrame(landmarks);
    }

    setExerciseState(result.state);
    setErrors(result.errors);

    const currentReps = exerciseLogic.getRepCount();
    setRepCount(currentReps);
    setFormScore(exerciseLogic.getFormScore());

    // Goal completion — guarded against re-entry
    if (goal !== null && currentReps >= goal && !goalReachedRef.current) {
      goalReachedRef.current = true;
      setTimeout(() => {
        stopCamera();
        setAppState('summary');
      }, 1000);
    }
  }, [landmarks, exercise, appState, goal, stopCamera]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<FullScreenLoader />}>
        <div className="flex flex-col min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
          
          {/* Navigation Bar */}
          {appState !== 'auth' && appState !== 'workout' && (
            <nav className="fixed top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-50 pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto cursor-pointer" onClick={() => setAppState('selecting')}>
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden sm:block">
                  Rep Coach
                </span>
              </div>

              <div className="pointer-events-auto flex gap-4">
                {appState === 'selecting' && (
                  <button 
                    onClick={() => { sfx.playClick(); setAppState('guide'); }}
                    className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 transition-all shadow-lg active:scale-95"
                  >
                    <span className="font-bold text-sm">Guide</span>
                  </button>
                )}
                <button 
                  onClick={() => {
                    sfx.playClick();
                    setAppState(appState === 'profile' ? 'selecting' : 'profile');
                  }}
                  className="flex items-center gap-3 bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-md pl-2 pr-4 py-1.5 rounded-full border border-slate-700 transition-all shadow-lg group active:scale-95"
                >
                  {userPhoto ? (
                    <img src={userPhoto} alt="Profile" className="w-8 h-8 rounded-full border border-slate-600" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                      {username ? username.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">
                    {appState === 'profile' ? 'Back' : 'Profile'}
                  </span>
                </button>
              </div>
            </nav>
          )}

          {appState === 'auth' && (
            <AuthScreen 
              onLogin={(uid, uname, photo, guest) => {
                sfx.playClick();
                setIsGuest(!!guest);
                setUserId(uid);
                setUsername(uname);
                setUserPhoto(photo || null);
                setAppState('selecting');
              }} 
            />
          )}

          {appState === 'guide' && (
            <ExerciseGuide />
          )}

          {appState === 'profile' && userId && username && (
            <UserProfile 
              userId={userId}
              isGuest={isGuest}
              username={username}
              photoURL={userPhoto}
              onLogout={() => {
                if (!isGuest) auth?.signOut();
                else {
                  setUserId(null);
                  setUsername(null);
                  setAppState('auth');
                }
              }}
            />
          )}

          {appState === 'selecting' && userId && username && (
            <ExerciseSelector
              userId={userId}
              isGuest={isGuest}
              username={username}
              onSelect={(ex, selectedGoal) => {
                setExercise(ex);
                setGoal(selectedGoal);
                handleStartWorkout(ex, selectedGoal);
              }}
            />
          )}

          {appState === 'workout' && (
            <div className="fixed inset-0 bg-black z-50">
              <CameraView 
                videoRef={videoRef}
                canvasRef={canvasRef}
                isLoaded={isLoaded}
                error={cameraError}
                isFrontFacing={isFrontFacing}
                cameraCount={cameraCount}
                onToggleCamera={toggleCamera}
              />
              
              <WorkoutHUD
                exercise={exercise}
                repCount={repCount}
                state={exerciseState}
                errors={errors}
                formScore={formScore}
                poseConfidence={poseConfidence}
                streak={exerciseLogic.getCurrentStreak()}
                goal={goal}
                onEndSession={handleEndSession}
              />
            </div>
          )}

          {appState === 'summary' && userId && username && (
            <SessionSummary
              userId={userId}
              isGuest={isGuest}
              username={username}
              results={exerciseLogic.getResults()}
              exercise={exercise}
              durationSeconds={workoutDuration}
              onRestart={() => setAppState('selecting')}
            />
          )}

          {/* Footer */}
          {appState !== 'workout' && (
            <footer className="w-full py-6 text-center text-slate-500 text-sm mt-auto relative z-10 border-t border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
              <p>Copyright © 2026 Rep Coach.</p>
              <div className="flex justify-center gap-4 mt-2">
                <button onClick={() => setLegalModal('privacy')} className="hover:text-blue-400 transition-colors">Privacy Policy</button>
                <span>|</span>
                <button onClick={() => setLegalModal('terms')} className="hover:text-blue-400 transition-colors">Terms of Service</button>
              </div>
            </footer>
          )}

          {/* Legal Modal */}
          {legalModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[80vh]">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </h2>
                <div className="text-slate-300 text-sm space-y-4 mb-6">
                  {legalModal === 'privacy' ? (
                    <>
                      <p><strong>1. Data Collection:</strong> We collect basic account information via Firebase Authentication (email, name, profile picture) and workout statistics to provide you with your fitness dashboard.</p>
                      <p><strong>2. Local Processing:</strong> All AI pose detection and camera feeds are processed locally in your browser. Video feeds are never recorded or sent to any server.</p>
                      <p><strong>3. Data Sharing:</strong> We do not sell or share your personal data with any third parties.</p>
                      <p><strong>4. Contact:</strong> For privacy inquiries, please contact privacy@repcoach.example.com.</p>
                    </>
                  ) : (
                    <>
                      <p><strong>1. Acceptance of Terms:</strong> By using Rep Coach, you agree to these Terms of Service.</p>
                      <p><strong>2. Health Disclaimer:</strong> Rep Coach is an AI-powered fitness tool, not a medical device. Always consult with a physician before starting any exercise program. You assume all risks associated with the physical activities tracked by this application.</p>
                      <p><strong>3. Service Availability:</strong> We strive to keep the app online, but provide the service "as is" without guarantees of uptime.</p>
                      <p><strong>4. Account Responsibility:</strong> You are responsible for maintaining the security of your account credentials.</p>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => setLegalModal(null)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
