import { useState, useEffect } from 'react';
import type { ExerciseType } from '../lib/exerciseRules';
import { sfx } from '../lib/sounds';
import { loadStats, getRankFromXP, type WorkoutSession, type PersonalRecords } from '../lib/achievements';
import { Activity, Flame, Target, Trophy, TrendingUp, History, Zap, Shield } from 'lucide-react';
import { MuscleHeatmap } from './MuscleHeatmap';

interface Props {
  userId: string;
  isGuest: boolean;
  username: string;
  onSelect: (exercise: ExerciseType, goal: number | null) => void;
  onPhotoUpdate?: (photo: string) => void;
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function ExerciseSelector({ userId, isGuest, username, onSelect, onPhotoUpdate }: Props) {
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

  useEffect(() => {
    sfx.init();
    async function fetchStats() {
      try {
        const stats = await loadStats(userId, isGuest);
        setLifetimeReps(stats.totalReps || 0);
        setStreak(stats.currentDailyStreak || 0);
        if (stats.profilePicture && onPhotoUpdate) {
          onPhotoUpdate(stats.profilePicture);
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
    <div className="flex flex-col items-center min-h-screen pt-24 pb-12 px-6 relative z-10 w-full max-w-6xl mx-auto overflow-y-auto">
      
      {/* Welcome & Stats Banner */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 mb-8 shadow-2xl">
        <div className="mb-6 md:mb-0 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-white">Welcome back, {username}</h1>
            <div className={`px-2 py-1 rounded-lg border bg-slate-900 border-slate-700 flex items-center gap-1 text-xs font-bold uppercase tracking-widest ${getRankFromXP(xp).color}`}>
              {getRankFromXP(xp).icon} {getRankFromXP(xp).name}
            </div>
          </div>
          <p className="text-slate-400 font-medium text-lg">Ready to crush your goals today?</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          <div className="flex flex-col items-center bg-slate-900/50 rounded-2xl px-6 py-4 border border-slate-700/50 min-w-[120px]">
            <div className="flex items-center gap-2 text-slate-400 font-semibold mb-1 text-sm">
              <Activity className="w-4 h-4 text-blue-500" /> Reps
            </div>
            <div className="text-2xl font-bold text-white">{lifetimeReps}</div>
          </div>
          <div className="flex flex-col items-center bg-slate-900/50 rounded-2xl px-6 py-4 border border-slate-700/50 min-w-[120px]">
            <div className="flex items-center gap-2 text-slate-400 font-semibold mb-1 text-sm">
              <Flame className="w-4 h-4 text-orange-500" /> Streak
            </div>
            <div className="text-2xl font-bold text-white">{streak}</div>
          </div>
          <div className="flex flex-col items-center bg-slate-900/50 rounded-2xl px-6 py-4 border border-slate-700/50 min-w-[120px]">
            <div className="flex items-center gap-2 text-slate-400 font-semibold mb-1 text-sm">
              <Zap className="w-4 h-4 text-yellow-500" /> Calories
            </div>
            <div className="text-2xl font-bold text-white">{totalCalories}</div>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Left Column: Chart and PRs */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Activity Chart */}
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" /> 7-Day Activity
              </h3>
              <div className="flex bg-slate-900/80 rounded-lg p-1 border border-slate-700">
                <button onClick={() => { sfx.playClick(); setChartMode('reps'); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartMode === 'reps' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Reps</button>
                <button onClick={() => { sfx.playClick(); setChartMode('calories'); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartMode === 'calories' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>Cals</button>
              </div>
            </div>
            <div className="h-48 w-full flex items-end justify-between gap-2 px-2 pb-6 relative">
              {/* Y-axis guidelines */}
              <div className="absolute inset-0 flex flex-col justify-between pb-6 pointer-events-none opacity-20">
                <div className="border-t border-slate-500 w-full"></div>
                <div className="border-t border-slate-500 w-full"></div>
                <div className="border-t border-slate-500 w-full"></div>
              </div>
              
              {chartData.map((data, i) => {
                const val = chartMode === 'reps' ? data.reps : data.calories;
                const heightPercentage = (val / maxChartValue) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 z-10 group h-full">
                    <div className="w-full max-w-[40px] bg-slate-700/50 rounded-t-lg relative flex items-end justify-center transition-all hover:bg-slate-600/50 flex-1">
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-1000 ease-out ${chartMode === 'reps' ? 'bg-blue-500 group-hover:bg-blue-400' : 'bg-orange-500 group-hover:bg-orange-400'}`}
                        style={{ height: `${heightPercentage}%` }}
                      ></div>
                      {/* Tooltip */}
                      {val > 0 && (
                        <div className="absolute -top-8 bg-slate-900 text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {val}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 mt-2 font-medium">{data.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goal Selector */}
          <div className="flex flex-col items-center bg-slate-800/40 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-bold text-white">Target Reps</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => { sfx.playClick(); setGoal(null); }} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${goal === null ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white bg-slate-700/30 hover:bg-slate-700/80'}`}>Endless</button>
              <button onClick={() => { sfx.playClick(); setGoal(10); }} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${goal === 10 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white bg-slate-700/30 hover:bg-slate-700/80'}`}>10 Reps</button>
              <button onClick={() => { sfx.playClick(); setGoal(25); }} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${goal === 25 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white bg-slate-700/30 hover:bg-slate-700/80'}`}>25 Reps</button>
              <button onClick={() => { sfx.playClick(); setGoal(50); }} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${goal === 50 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white bg-slate-700/30 hover:bg-slate-700/80'}`}>50 Reps</button>
            </div>
          </div>

          {/* Start Exercises Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <button
              onClick={() => handleSelect('squat')}
              className="flex flex-col items-center bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700 hover:border-blue-500/50 p-6 rounded-3xl text-center transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(59,130,246,0.15)] group relative overflow-hidden"
            >
              {recentWorkouts[0]?.exercise === 'squat' && (
                <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg">LAST PLAYED</div>
              )}
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                <Trophy className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold mb-1 text-white">Squats</h2>
              <div className="text-xs font-semibold text-slate-500 bg-slate-800 px-2 py-1 rounded-md">PR: {prs.squat}</div>
            </button>

            <button
              onClick={() => handleSelect('pushup')}
              className="flex flex-col items-center bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700 hover:border-purple-500/50 p-6 rounded-3xl text-center transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(168,85,247,0.15)] group relative overflow-hidden"
            >
              {recentWorkouts[0]?.exercise === 'pushup' && (
                <div className="absolute top-0 right-0 bg-purple-500/20 text-purple-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg">LAST PLAYED</div>
              )}
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold mb-1 text-white">Push-ups</h2>
              <div className="text-xs font-semibold text-slate-500 bg-slate-800 px-2 py-1 rounded-md">PR: {prs.pushup}</div>
            </button>

            <button
              onClick={() => handleSelect('jumping_jack')}
              className="flex flex-col items-center bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700 hover:border-orange-500/50 p-6 rounded-3xl text-center transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(249,115,22,0.15)] group relative overflow-hidden"
            >
              {recentWorkouts[0]?.exercise === 'jumping_jack' && (
                <div className="absolute top-0 right-0 bg-orange-500/20 text-orange-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg">LAST PLAYED</div>
              )}
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold mb-1 text-white">Jacks</h2>
              <div className="text-xs font-semibold text-slate-500 bg-slate-800 px-2 py-1 rounded-md">PR: {prs.jumping_jack}</div>
            </button>

            <button
              onClick={() => handleSelect('plank')}
              className="flex flex-col items-center bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700 hover:border-emerald-500/50 p-6 rounded-3xl text-center transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(16,185,129,0.15)] group relative overflow-hidden"
            >
              {recentWorkouts[0]?.exercise === 'plank' && (
                <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg">LAST PLAYED</div>
              )}
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <Shield className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold mb-1 text-white">Plank</h2>
              <div className="text-xs font-semibold text-slate-500 bg-slate-800 px-2 py-1 rounded-md">PR: {prs.plank}s</div>
            </button>
          </div>
          
          {/* Heatmap */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" /> Muscle Heatmap
              </h3>
            </div>
            <MuscleHeatmap history={recentWorkouts} />
          </div>
        </div>

        {/* Right Column: Recent Workouts List */}
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 shadow-xl flex flex-col">
          <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" /> Recent Sessions
          </h3>
          
          <div className="flex-1 flex flex-col gap-3">
            {recentWorkouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-50">
                <div className="w-12 h-12 rounded-full border border-slate-600 flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-slate-400 font-medium">No sessions yet.</p>
                <p className="text-slate-500 text-sm">Start your first workout!</p>
              </div>
            ) : (
              recentWorkouts.map((w, idx) => {
                const dateStr = new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
                return (
                  <div key={w.id || idx} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 flex justify-between items-center group hover:bg-slate-700/50 transition-colors cursor-default">
                    <div className="flex flex-col">
                      <span className="text-white font-bold capitalize text-base">{w.exercise.replace('_', ' ')}</span>
                      <span className="text-slate-400 text-xs">{dateStr}</span>
                    </div>
                    <div className="flex gap-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-white font-bold leading-none">{w.reps}</span>
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                          {w.exercise === 'plank' ? 'Hold (s)' : 'Reps'}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`font-bold leading-none ${w.formScore >= 80 ? 'text-blue-400' : w.formScore >= 50 ? 'text-orange-400' : 'text-red-400'}`}>{w.formScore}%</span>
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Form</span>
                      </div>
                      <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-white font-bold leading-none">{formatDuration(w.durationSeconds || 0)}</span>
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Time</span>
                      </div>
                      <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-white font-bold leading-none">{w.calories || 0}</span>
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Cals</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {recentWorkouts.length > 0 && (
            <button className="mt-6 w-full text-center text-sm font-bold text-slate-400 hover:text-white transition-colors p-2 bg-slate-900/30 rounded-xl border border-slate-700/30">
              View All History
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
