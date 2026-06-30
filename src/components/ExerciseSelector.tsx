import { useState, useEffect } from 'react';
import type { ExerciseType } from '../lib/exerciseRules';
import { sfx } from '../lib/sounds';
import { loadStats, getRankFromXP, type WorkoutSession, type PersonalRecords } from '../lib/achievements';
import { Activity, Flame, Target, Trophy, TrendingUp, History, Zap, Shield, Mic, MicOff, Dumbbell } from 'lucide-react';
import { MuscleHeatmap } from './MuscleHeatmap';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { pageTransition, staggerContainer, cardEntrance, hoverEffect, tapEffect } from '../lib/animations';

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  
  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

interface Props {
  userId: string;
  isGuest: boolean;
  username: string;
  onSelect: (exercise: ExerciseType, goal: number | null) => void;
  onPhotoUpdate?: (photo: string) => void;
  isListening?: boolean;
  voiceControlEnabled?: boolean;
  onToggleVoiceControl?: () => void;
  rhythmModeEnabled?: boolean;
  onToggleRhythmMode?: () => void;
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function ExerciseSelector({ 
  userId, isGuest, username, onSelect, onPhotoUpdate, 
  isListening = false, voiceControlEnabled = false, onToggleVoiceControl,
  rhythmModeEnabled = false, onToggleRhythmMode
}: Props) {
  const [lifetimeReps, setLifetimeReps] = useState(0);
  const [streak, setStreak] = useState(0);
  const [goal, setGoal] = useState<number | null>(null);
  
  // Dashboard Specific State
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [prs, setPrs] = useState<PersonalRecords>({ squat: 0, pushup: 0, jumping_jack: 0, plank: 0 });
  const [totalCalories, setTotalCalories] = useState(0);
  const [xp, setXp] = useState(0);
  const [chartData, setChartData] = useState<{day: string, reps: number, calories: number}[]>([]);
  const [chartMode, setChartMode] = useState<'reps' | 'calories'>('reps');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const rank = getRankFromXP(xp);

  useEffect(() => {
    sfx.init();
    async function fetchStats() {
      try {
        const stats = await loadStats(userId, isGuest);
        setLifetimeReps(stats.totalReps || 0);
        setStreak(stats.currentDailyStreak || 0);
        if (stats.profilePicture) {
          setProfilePicture(stats.profilePicture);
          if (onPhotoUpdate) onPhotoUpdate(stats.profilePicture);
        }
        
        const history = stats.workoutHistory || [];
        setRecentWorkouts(history.slice(0, 3));
        setPrs(stats.personalRecords || { squat: 0, pushup: 0, jumping_jack: 0, plank: 0 });
        setTotalCalories(history.reduce((sum, w) => sum + (w.calories || 0), 0));
        setXp(stats.xp || 0);
        
        // Build chart data (last 7 days)
        const days = 7;
        const data = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = date.toLocaleDateString(undefined, { weekday: 'short' });
          
          // sum reps and calories for this day
          const dayStart = new Date(date.setHours(0,0,0,0)).getTime();
          const dayEnd = new Date(date.setHours(23,59,59,999)).getTime();
          
          const dayWorkouts = history.filter(w => w.date >= dayStart && w.date <= dayEnd);
          const repsThatDay = dayWorkouts.reduce((sum, w) => sum + w.reps, 0);
          const caloriesThatDay = dayWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);
            
          data.push({ day: dateString, reps: repsThatDay, calories: caloriesThatDay });
        }
        setChartData(data);
        
      } catch (err) {
        console.error('Failed to load stats for dashboard', err);
      }
    }
    fetchStats();
  }, [userId, isGuest]);

  const handleSelect = (ex: ExerciseType) => {
    sfx.playClick();
    onSelect(ex, goal);
  };

  const maxChartValue = Math.max(...chartData.map(d => chartMode === 'reps' ? d.reps : d.calories), 10); // Minimum scale 10

  return (
    <motion.div 
      variants={pageTransition} 
      initial="initial" 
      animate="animate" 
      exit="exit" 
      className="flex flex-col items-center min-h-screen pt-24 pb-12 px-6 relative z-10 w-full max-w-6xl mx-auto overflow-y-auto"
    >
      
      {/* Hero Welcome Card */}
      <motion.div variants={cardEntrance} className="surface-hero p-8 md:p-10 mb-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex items-center gap-6 md:gap-8 relative z-10 w-full md:w-auto">
          <div className="relative">
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="w-24 h-24 rounded-2xl border border-white/10 shadow-2xl object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/10 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
                {username ? username.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <div className="absolute -bottom-3 -right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg border border-white/20 shadow-lg">
              Lv {rank.level}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-display text-white mb-1 tracking-tight">Welcome back, {username}</h2>
            <p className="text-section text-blue-400 mb-1">Ready to crush your goals today?</p>
            <p className="text-body text-slate-400">{rank.title} • {xp} XP</p>
            {isGuest && (
              <div className="mt-3 text-xs bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full border border-amber-500/20 inline-flex items-center">
                Guest Mode — Data saves locally
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {onToggleVoiceControl && (
                <button
                  onClick={() => { sfx.playClick(); onToggleVoiceControl(); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-lg ${
                    voiceControlEnabled 
                      ? 'surface-float border-blue-500/50 text-blue-400' 
                      : 'surface-raised border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {voiceControlEnabled ? (
                    <>
                      <Mic className="w-4 h-4" />
                      {isListening ? (
                        <span className="flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span> Listening...
                        </span>
                      ) : 'Voice Active'}
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4" />
                      Voice Off
                    </>
                  )}
                </button>
              )}
              {onToggleRhythmMode && (
                <button
                  onClick={() => { sfx.playClick(); onToggleRhythmMode(); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-lg ${
                    rhythmModeEnabled 
                      ? 'surface-float border-purple-500/50 text-purple-400' 
                      : 'surface-raised border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${rhythmModeEnabled ? 'animate-pulse' : ''}`} />
                  {rhythmModeEnabled ? 'Rhythm Mode: ON' : 'Rhythm Mode'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap md:flex-col lg:flex-row justify-center gap-4 md:gap-6 relative z-10 w-full md:w-auto mt-8 md:mt-0">
          <motion.div whileHover={hoverEffect} className="flex flex-col items-start surface-float px-6 py-5 min-w-[140px] flex-1 md:flex-none">
            <div className="flex items-center gap-2 text-meta mb-2">
              <Activity className="w-4 h-4 text-blue-500" /> REPS
            </div>
            <div className="text-display text-hero-gradient"><AnimatedNumber value={lifetimeReps} /></div>
          </motion.div>
          <motion.div whileHover={hoverEffect} className="flex flex-col items-start surface-float px-6 py-5 min-w-[140px] flex-1 md:flex-none">
            <div className="flex items-center gap-2 text-meta mb-2">
              <Flame className="w-4 h-4 text-orange-500" /> STREAK
            </div>
            <div className="text-display text-white"><AnimatedNumber value={streak} /></div>
          </motion.div>
          <motion.div whileHover={hoverEffect} className="flex flex-col items-start surface-float px-6 py-5 min-w-[140px] flex-1 md:flex-none">
            <div className="flex items-center gap-2 text-meta mb-2">
              <Zap className="w-4 h-4 text-yellow-500" /> CALORIES
            </div>
            <div className="text-display text-white"><AnimatedNumber value={totalCalories} /></div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div variants={staggerContainer} className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Left Column: Chart and PRs */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Activity Chart */}
          <motion.div variants={cardEntrance} className="surface-raised p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-section flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" /> 7-Day Activity
              </h3>
              <div className="flex surface-float rounded-lg p-1 border border-white/5">
                <button onClick={() => { sfx.playClick(); setChartMode('reps'); }} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${chartMode === 'reps' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Reps</button>
                <button onClick={() => { sfx.playClick(); setChartMode('calories'); }} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${chartMode === 'calories' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Cals</button>
              </div>
            </div>
            <div className="h-56 w-full flex items-end justify-between gap-3 px-2 pb-8 relative">
              {/* Y-axis guidelines */}
              <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none opacity-10">
                <div className="border-t border-white w-full"></div>
                <div className="border-t border-white w-full"></div>
                <div className="border-t border-white w-full"></div>
              </div>
              
              {chartData.map((data, i) => {
                const val = chartMode === 'reps' ? data.reps : data.calories;
                const heightPercentage = Math.max(val === 0 ? 0 : 5, (val / maxChartValue) * 100);
                return (
                  <div key={i} className="flex flex-col items-center flex-1 z-10 group h-full">
                    <div className="w-full max-w-[48px] surface-float border-t border-l border-r border-white/5 rounded-t-xl relative flex items-end justify-center transition-all group-hover:border-white/20 flex-1 overflow-hidden shadow-inner">
                      <div 
                        className={`w-full rounded-t-xl transition-all duration-1000 ease-[0.22,1,0.36,1] ${chartMode === 'reps' ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-gradient-to-t from-orange-600 to-orange-400'}`}
                        style={{ height: `${heightPercentage}%`, opacity: val === 0 ? 0 : 1 }}
                      ></div>
                      {/* Tooltip */}
                      {val > 0 && (
                        <div className="absolute -top-10 surface-float border border-white/10 text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xl transform group-hover:-translate-y-1">
                          {val}
                        </div>
                      )}
                    </div>
                    <span className="text-meta mt-3">{data.day}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Goal Selector */}
          <motion.div variants={cardEntrance} className="flex flex-col items-start surface-raised p-8">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-5 h-5 text-purple-500" />
              <h3 className="text-section">Session Target</h3>
            </div>
            <div className="flex flex-wrap justify-start gap-3 w-full">
              <motion.button whileHover={hoverEffect} whileTap={tapEffect} onClick={() => { sfx.playClick(); setGoal(null); }} className={`flex-1 min-w-[100px] px-6 py-3 rounded-xl font-bold text-sm transition-all ${goal === null ? 'bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white surface-float'}`}>Endless</motion.button>
              <motion.button whileHover={hoverEffect} whileTap={tapEffect} onClick={() => { sfx.playClick(); setGoal(10); }} className={`flex-1 min-w-[100px] px-6 py-3 rounded-xl font-bold text-sm transition-all ${goal === 10 ? 'bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white surface-float'}`}>10 Reps</motion.button>
              <motion.button whileHover={hoverEffect} whileTap={tapEffect} onClick={() => { sfx.playClick(); setGoal(25); }} className={`flex-1 min-w-[100px] px-6 py-3 rounded-xl font-bold text-sm transition-all ${goal === 25 ? 'bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white surface-float'}`}>25 Reps</motion.button>
              <motion.button whileHover={hoverEffect} whileTap={tapEffect} onClick={() => { sfx.playClick(); setGoal(50); }} className={`flex-1 min-w-[100px] px-6 py-3 rounded-xl font-bold text-sm transition-all ${goal === 50 ? 'bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white surface-float'}`}>50 Reps</motion.button>
            </div>
          </motion.div>

          {/* Start Exercises Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <motion.button
              variants={cardEntrance}
              whileHover={hoverEffect}
              whileTap={tapEffect}
              onClick={() => handleSelect('squat')}
              className={`flex flex-col items-center surface-raised p-6 text-center transition-all group relative overflow-hidden hover-shimmer ${recentWorkouts[0]?.exercise === 'squat' ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]'}`}
            >
              {recentWorkouts[0]?.exercise === 'squat' && (
                <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-400 text-meta px-3 py-1 rounded-bl-lg border-b border-l border-blue-500/20">LAST</div>
              )}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${recentWorkouts[0]?.exercise === 'squat' ? 'icon-container-active' : 'icon-container-premium group-hover:bg-blue-500/10 group-hover:border-blue-500/30'}`}>
                <Trophy className={`w-7 h-7 transition-colors ${recentWorkouts[0]?.exercise === 'squat' ? 'text-white' : 'text-blue-500 group-hover:text-blue-400'}`} />
              </div>
              <h2 className="text-lg font-bold mb-1 text-white group-hover:text-blue-400 transition-colors">Squats</h2>
              <p className="text-body text-xs group-hover:text-blue-200 transition-colors">Lower body power</p>
            </motion.button>
            
            <motion.button
              variants={cardEntrance}
              whileHover={hoverEffect}
              whileTap={tapEffect}
              onClick={() => handleSelect('pushup')}
              className={`flex flex-col items-center surface-raised p-6 text-center transition-all group relative overflow-hidden hover-shimmer ${recentWorkouts[0]?.exercise === 'pushup' ? 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)]' : 'hover:border-orange-500/50 hover:shadow-[0_0_40px_rgba(249,115,22,0.2)]'}`}
            >
              {recentWorkouts[0]?.exercise === 'pushup' && (
                <div className="absolute top-0 right-0 bg-orange-500/20 text-orange-400 text-meta px-3 py-1 rounded-bl-lg border-b border-l border-orange-500/20">LAST</div>
              )}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${recentWorkouts[0]?.exercise === 'pushup' ? 'icon-container-active' : 'icon-container-premium group-hover:bg-orange-500/10 group-hover:border-orange-500/30'}`}>
                <Flame className={`w-7 h-7 transition-colors ${recentWorkouts[0]?.exercise === 'pushup' ? 'text-white' : 'text-orange-500 group-hover:text-orange-400'}`} />
              </div>
              <h2 className="text-lg font-bold mb-1 text-white group-hover:text-orange-400 transition-colors">Push-ups</h2>
              <p className="text-body text-xs group-hover:text-orange-200 transition-colors">Upper body strength</p>
            </motion.button>

            <motion.button
              variants={cardEntrance}
              whileHover={hoverEffect}
              whileTap={tapEffect}
              onClick={() => handleSelect('jumping_jack')}
              className={`flex flex-col items-center surface-raised p-6 text-center transition-all group relative overflow-hidden hover-shimmer ${recentWorkouts[0]?.exercise === 'jumping_jack' ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.15)]' : 'hover:border-green-500/50 hover:shadow-[0_0_40px_rgba(34,197,94,0.2)]'}`}
            >
              {recentWorkouts[0]?.exercise === 'jumping_jack' && (
                <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-meta px-3 py-1 rounded-bl-lg border-b border-l border-green-500/20">LAST</div>
              )}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${recentWorkouts[0]?.exercise === 'jumping_jack' ? 'icon-container-active' : 'icon-container-premium group-hover:bg-green-500/10 group-hover:border-green-500/30'}`}>
                <Activity className={`w-7 h-7 transition-colors ${recentWorkouts[0]?.exercise === 'jumping_jack' ? 'text-white' : 'text-green-500 group-hover:text-green-400'}`} />
              </div>
              <h2 className="text-lg font-bold mb-1 text-white group-hover:text-green-400 transition-colors">Jacks</h2>
              <p className="text-body text-xs group-hover:text-green-200 transition-colors">Cardio & agility</p>
            </motion.button>

            <motion.button
              variants={cardEntrance}
              whileHover={hoverEffect}
              whileTap={tapEffect}
              onClick={() => handleSelect('plank')}
              className={`flex flex-col items-center surface-raised p-6 text-center transition-all group relative overflow-hidden hover-shimmer ${recentWorkouts[0]?.exercise === 'plank' ? 'border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]'}`}
            >
              {recentWorkouts[0]?.exercise === 'plank' && (
                <div className="absolute top-0 right-0 bg-purple-500/20 text-purple-400 text-meta px-3 py-1 rounded-bl-lg border-b border-l border-purple-500/20">LAST</div>
              )}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${recentWorkouts[0]?.exercise === 'plank' ? 'icon-container-active' : 'icon-container-premium group-hover:bg-purple-500/10 group-hover:border-purple-500/30'}`}>
                <Shield className={`w-7 h-7 transition-colors ${recentWorkouts[0]?.exercise === 'plank' ? 'text-white' : 'text-purple-500 group-hover:text-purple-400'}`} />
              </div>
              <h2 className="text-lg font-bold mb-1 text-white group-hover:text-purple-400 transition-colors">Plank</h2>
              <p className="text-body text-xs group-hover:text-purple-200 transition-colors">Core stability</p>
            </motion.button>
          </div>
          
          {/* Heatmap */}
          <motion.div variants={cardEntrance} className="surface-raised p-8 mt-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-section flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" /> Muscle Heatmap
              </h3>
            </div>
            {recentWorkouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-70">
                <div className="icon-container-premium w-16 h-16 flex items-center justify-center mb-4">
                  <Dumbbell className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-body text-center max-w-[240px]">Complete a workout to reveal your muscular engagement heatmap.</p>
              </div>
            ) : (
              <div className="surface-float p-6 rounded-2xl border border-white/5">
                <MuscleHeatmap history={recentWorkouts} />
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column: Recent Workouts List */}
        <motion.div variants={cardEntrance} className="surface-raised p-8 flex flex-col h-full">
          <h3 className="text-section mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" /> Recent Sessions
          </h3>
          
          <div className="flex-1 flex flex-col gap-4">
            {recentWorkouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="icon-container-premium w-20 h-20 flex items-center justify-center mb-6">
                  <Activity className="w-10 h-10 text-blue-400 opacity-80" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">No sessions yet</h4>
                <p className="text-body mb-8 max-w-[200px] mx-auto">Your recent workout history and stats will appear here.</p>
                <motion.button 
                  whileHover={hoverEffect}
                  whileTap={tapEffect}
                  onClick={() => handleSelect('squat')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full transition-all shadow-[0_4px_20px_rgba(37,99,235,0.4)]"
                >
                  Start First Workout
                </motion.button>
              </div>
            ) : (
              recentWorkouts.map((w, idx) => {
                const dateStr = new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
                return (
                  <motion.div 
                    whileHover={{ scale: 1.01, x: 2 }}
                    key={w.id || idx} 
                    className="surface-float rounded-2xl p-5 flex justify-between items-center group cursor-default shadow-sm hover:shadow-md hover:border-white/10 transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-white font-bold capitalize text-base">{w.exercise.replace('_', ' ')}</span>
                      <span className="text-meta text-slate-500 mt-1">{dateStr}</span>
                    </div>
                    <div className="flex gap-4 sm:gap-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-white font-bold text-lg leading-none">{w.reps}</span>
                        <span className="text-meta mt-1">
                          {w.exercise === 'plank' ? 'SEC' : 'REPS'}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`font-bold text-lg leading-none ${w.formScore >= 80 ? 'text-blue-400' : w.formScore >= 50 ? 'text-orange-400' : 'text-red-400'}`}>{w.formScore}%</span>
                        <span className="text-meta mt-1">FORM</span>
                      </div>
                      <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-white font-bold text-lg leading-none">{w.calories || 0}</span>
                        <span className="text-meta mt-1">CALS</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
          
          {recentWorkouts.length > 0 && (
            <motion.button whileHover={hoverEffect} whileTap={tapEffect} className="mt-8 w-full text-center text-sm font-bold text-slate-400 hover:text-white transition-colors p-3 surface-float hover:border-white/20">
              View All History
            </motion.button>
          )}
        </motion.div>

      </motion.div>
    </motion.div>
  );
}
