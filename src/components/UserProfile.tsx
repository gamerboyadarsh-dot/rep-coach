import { useEffect, useState } from 'react';
import { sfx } from '../lib/sounds';
import { loadStats, saveStats, type UserStats } from '../lib/achievements';
import { motion } from 'framer-motion';
import { Trophy, Activity, Flame, LogOut, Award, Star, Medal, Settings, Video, Moon, Bell, History } from 'lucide-react';

interface Props {
  userId: string;
  isGuest: boolean;
  username: string;
  photoURL?: string | null;
  onLogout: () => void;
}

export function UserProfile({ userId, isGuest, username, photoURL, onLogout }: Props) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('repCoach_theme') === 'light');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('repCoach_notifications') === 'true');

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [isLightMode]);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await loadStats(userId, isGuest);
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();

    // Fetch cameras
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
        const saved = localStorage.getItem('repCoach_camera_deviceId');
        if (saved && videoDevices.find(d => d.deviceId === saved)) {
          setSelectedCamera(saved);
        } else if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      });
    }
  }, [userId, isGuest]);

  const [weight, setWeight] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');

  useEffect(() => {
    if (stats) {
      setWeight(stats.weight || '');
      setHeight(stats.height || '');
    }
  }, [stats]);

  const handleWeightChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const num = val === '' ? '' : Number(val);
    setWeight(num);
    if (stats) {
      const updated = { ...stats, weight: typeof num === 'number' ? num : undefined };
      setStats(updated);
      await saveStats(userId, updated, isGuest);
    }
  };

  const handleHeightChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const num = val === '' ? '' : Number(val);
    setHeight(num);
    if (stats) {
      const updated = { ...stats, height: typeof num === 'number' ? num : undefined };
      setStats(updated);
      await saveStats(userId, updated, isGuest);
    }
  };

  const bmi = (typeof weight === 'number' && typeof height === 'number' && height > 0)
    ? (weight / ((height / 100) * (height / 100))).toFixed(1)
    : null;

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCamera(id);
    localStorage.setItem('repCoach_camera_deviceId', id);
  };

  const toggleTheme = () => {
    sfx.playClick();
    const newVal = !isLightMode;
    setIsLightMode(newVal);
    localStorage.setItem('repCoach_theme', newVal ? 'light' : 'dark');
  };

  const toggleNotifications = async () => {
    sfx.playClick();
    if (!notificationsEnabled) {
      if (window.Notification) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setNotificationsEnabled(true);
          localStorage.setItem('repCoach_notifications', 'true');
          new Notification("Rep Coach", { body: "Streak reminders enabled!" });
        } else {
          alert("Notification permission denied by browser.");
        }
      } else {
        alert("Notifications are not supported by this browser.");
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('repCoach_notifications', 'false');
    }
  };

  const getRank = (reps: number) => {
    if (reps > 1000) return { title: 'Elite Athlete', icon: <Star className="w-5 h-5 text-yellow-400" /> };
    if (reps > 500) return { title: 'Advanced', icon: <Award className="w-5 h-5 text-purple-400" /> };
    if (reps > 100) return { title: 'Intermediate', icon: <Trophy className="w-5 h-5 text-blue-400" /> };
    if (reps > 50) return { title: 'Beginner', icon: <Medal className="w-5 h-5 text-green-400" /> };
    return { title: 'Rookie', icon: <Activity className="w-5 h-5 text-slate-400" /> };
  };

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 pb-12">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const badgesList = Object.values(stats.badges || {});
  const currentRank = getRank(stats.totalReps);
  const workoutHistory = stats.workoutHistory || [];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-24 pb-12 px-6 relative z-10 overflow-y-auto w-full">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 md:p-12 w-full max-w-5xl rounded-3xl shadow-2xl relative">
        
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12 border-b border-slate-800 pb-10">
          <div className="relative">
            {photoURL ? (
              <img src={photoURL} alt={username} className="w-32 h-32 rounded-full border-4 border-slate-800 shadow-[0_0_30px_rgba(59,130,246,0.3)] object-cover" />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-slate-800 bg-slate-800 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                <span className="text-4xl font-bold text-slate-400">{username.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-slate-800 p-2 rounded-full border border-slate-700 shadow-lg">
              {currentRank.icon}
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-black mb-2 text-white">{username}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-blue-400 font-bold uppercase tracking-widest text-sm">{currentRank.title}</span>
              {isGuest && <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded uppercase font-semibold">Guest Mode</span>}
            </div>
          </div>
          
          <button 
            onClick={() => { sfx.playClick(); onLogout(); }}
            className="hidden md:flex items-center gap-2 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 py-3 px-6 rounded-xl font-bold transition-all shadow-lg active:scale-95"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 p-8 rounded-2xl text-center shadow-xl">
            <div className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-3 flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Career Reps
            </div>
            <div className="text-5xl font-black text-white">{stats.totalReps}</div>
          </motion.div>
          
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 p-8 rounded-2xl text-center shadow-xl">
            <div className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-3 flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-purple-400" /> Best Streak
            </div>
            <div className="text-5xl font-black text-white">{stats.highestStreak}</div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 p-8 rounded-2xl text-center shadow-xl relative overflow-hidden">
            <div className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-3 flex items-center justify-center gap-2">
               Daily Streak
            </div>
            <div className="text-5xl font-black text-orange-400 flex items-center justify-center gap-2">
              {stats.currentDailyStreak} <Flame className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>
        </div>

        {/* 2-Column Layout for History and Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          
          {/* History */}
          <div>
            <h2 className="text-xl font-bold mb-6 text-white tracking-wide border-b border-slate-800 pb-4 flex items-center gap-3">
              <History className="w-6 h-6 text-blue-500" /> Workout History
            </h2>
            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
              {workoutHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-700 rounded-2xl bg-slate-800/20">
                  <Activity className="w-12 h-12 text-slate-600 mb-4" />
                  <p className="text-slate-400 font-medium text-center">No workout history yet.<br/>Your journey begins today.</p>
                </div>
              ) : (
                workoutHistory.map(session => (
                  <div key={session.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex justify-between items-center hover:bg-slate-700/40 transition-colors">
                    <div>
                      <h4 className="text-white font-bold capitalize">{session.exercise.replace('_', ' ')}</h4>
                      <p className="text-xs text-slate-400">{new Date(session.date).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{session.reps} <span className="text-xs text-slate-500 font-normal">reps</span></div>
                      <div className={`text-xs font-bold ${session.formScore >= 80 ? 'text-blue-400' : 'text-orange-400'}`}>{session.formScore}% form</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Settings */}
          <div>
            <h2 className="text-xl font-bold mb-6 text-white tracking-wide border-b border-slate-800 pb-4 flex items-center gap-3">
              <Settings className="w-6 h-6 text-slate-400" /> Settings
            </h2>
            <div className="flex flex-col gap-4">
              
              {/* Body Metrics */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-5 h-5 text-green-400" />
                  <h4 className="text-white font-bold">Body Metrics</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Weight (kg)</label>
                    <input 
                      type="number" 
                      value={weight} 
                      onChange={handleWeightChange} 
                      placeholder="e.g. 75"
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Height (cm)</label>
                    <input 
                      type="number" 
                      value={height} 
                      onChange={handleHeightChange} 
                      placeholder="e.g. 180"
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
                {bmi && (
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="text-sm text-white font-bold mb-1">BMI: <span className="text-green-400">{bmi}</span></div>
                    <div className="text-[10px] text-slate-400 leading-tight">BMI is a general screening number, not a full picture of health.</div>
                  </div>
                )}
              </div>
              
              {/* Camera Picker */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="text-white font-bold">Default Camera</h4>
                    <p className="text-xs text-slate-400">Select which camera to use</p>
                  </div>
                </div>
                <select 
                  value={selectedCamera}
                  onChange={handleCameraChange}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {cameras.length === 0 ? (
                    <option value="">No cameras found</option>
                  ) : (
                    cameras.map((c, i) => (
                      <option key={c.deviceId} value={c.deviceId}>
                        {c.label || `Camera ${i + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Theme Toggle */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-purple-400" />
                  <div>
                    <h4 className="text-white font-bold">Theme Mode</h4>
                    <p className="text-xs text-slate-400">Light or Dark mode</p>
                  </div>
                </div>
                <div onClick={toggleTheme} className={`rounded-full w-12 h-6 border border-slate-700 flex items-center p-1 cursor-pointer transition-colors ${isLightMode ? 'bg-blue-600' : 'bg-slate-900'}`}>
                  <div className={`w-4 h-4 rounded-full transition-transform ${isLightMode ? 'bg-white translate-x-6' : 'bg-blue-500 translate-x-0'}`}></div>
                </div>
              </div>

              {/* Notifications Toggle */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  <div>
                    <h4 className="text-white font-bold">Notifications</h4>
                    <p className="text-xs text-slate-400">Streak reminders</p>
                  </div>
                </div>
                <div onClick={toggleNotifications} className={`rounded-full w-12 h-6 border border-slate-700 flex items-center p-1 cursor-pointer transition-colors ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-900'}`}>
                  <div className={`w-4 h-4 rounded-full transition-transform ${notificationsEnabled ? 'bg-white translate-x-6' : 'bg-slate-600 translate-x-0'}`}></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Trophy Room */}
        <div>
          <h2 className="text-xl font-bold mb-6 text-white tracking-wide border-b border-slate-800 pb-4 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" /> Trophy Room
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {badgesList.map(badge => {
              const isUnlocked = !!badge.unlockedAt;
              return (
                <div key={badge.id} className={`p-6 rounded-2xl border transition-all duration-300 ${isUnlocked ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 shadow-[0_0_20px_rgba(234,179,8,0.1)] hover:scale-105' : 'border-slate-800 bg-slate-900/50'}`}>
                  <div className={`text-5xl mb-4 text-center ${!isUnlocked ? 'opacity-20 grayscale' : 'drop-shadow-lg'}`}>{badge.icon}</div>
                  <div className={`font-bold text-lg mb-1 text-center ${isUnlocked ? 'text-yellow-500' : 'text-slate-500'}`}>{badge.title}</div>
                  <div className={`text-sm text-center ${isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>{badge.description}</div>
                  {isUnlocked && (
                    <div className="text-xs text-center text-slate-500 mt-4 font-medium uppercase tracking-wider bg-slate-900/50 py-1 rounded-lg">
                      {new Date(badge.unlockedAt!).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button 
          onClick={() => { sfx.playClick(); onLogout(); }}
          className="md:hidden w-full mt-10 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </div>
  );
}
