import { useEffect, useState, useRef } from 'react';
import { sfx } from '../lib/sounds';
import { loadStats, saveStats, getRankFromXP, type UserStats } from '../lib/achievements';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, cardEntrance, hoverEffect } from '../lib/animations';
import { Trophy, Activity, Flame, LogOut, Settings, Video, Moon, Bell, History, Camera, Mic } from 'lucide-react';

interface Props {
  userId: string;
  isGuest: boolean;
  username: string;
  photoURL?: string | null;
  onLogout: () => void;
  onPhotoUpdate?: (photo: string) => void;
}

export function UserProfile({ userId, isGuest, username, photoURL, onLogout, onPhotoUpdate }: Props) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('repCoach_theme') === 'light');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('repCoach_notifications') === 'true');
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('repCoach_voice') !== 'false');
  const [coachPersonality, setCoachPersonality] = useState(() => localStorage.getItem('repCoach_personality') || 'supportive');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          if (stats) {
            const updated = { ...stats, profilePicture: base64 };
            setStats(updated);
            await saveStats(userId, updated, isGuest);
          }
          if (onPhotoUpdate) onPhotoUpdate(base64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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

  const toggleVoiceSetting = () => {
    sfx.playClick();
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    sfx.setVoiceEnabled(newVal);
  };

  const handlePersonalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCoachPersonality(val);
    localStorage.setItem('repCoach_personality', val);
  };

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 pb-12">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const badgesList = Object.values(stats.badges || {});
  const currentRank = getRankFromXP(stats.xp || 0);
  const workoutHistory = stats.workoutHistory || [];

  return (
    <motion.div 
      variants={pageTransition} 
      initial="initial" 
      animate="animate" 
      exit="exit" 
      className="flex flex-col items-center justify-center min-h-screen pt-24 pb-12 px-6 relative z-10 w-full"
    >
      <div className="w-full max-w-5xl flex flex-col gap-10">
        
        {/* Profile Header */}
        <div className="surface-raised p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative group cursor-pointer z-10" onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
            {stats.profilePicture || photoURL ? (
              <img src={stats.profilePicture || photoURL!} alt={username} className="w-32 h-32 rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.3)] object-cover group-hover:opacity-75 transition-opacity" />
            ) : (
              <div className="w-32 h-32 rounded-3xl border border-white/10 bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:from-slate-700 group-hover:to-slate-600 transition-colors">
                <span className="text-4xl font-black text-white">{username.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl bg-black/40">
              <Camera className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
            <div className="absolute -bottom-3 -right-3 surface-float p-2 rounded-xl border border-white/10 shadow-xl flex items-center justify-center w-12 h-12">
              <span className="text-2xl drop-shadow-lg">{currentRank.icon}</span>
            </div>
          </div>

          <div className="text-center md:text-left flex-1 z-10">
            <h1 className="text-display text-white mb-2">{username}</h1>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className={`text-meta px-3 py-1 rounded-md bg-white/5 border border-white/10 ${currentRank.color}`}>{currentRank.name}</span>
              {isGuest && <span className="bg-amber-500/10 text-amber-500 text-meta px-3 py-1 rounded-md border border-amber-500/20">Guest Mode</span>}
            </div>
          </div>
          
          <button 
            onClick={() => { sfx.playClick(); onLogout(); }}
            className="hidden md:flex items-center gap-2 surface-float hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 py-3 px-6 rounded-xl font-bold transition-all shadow-lg active:scale-95 z-10"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>

        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={cardEntrance} whileHover={hoverEffect} className="surface-raised p-8 text-center flex flex-col items-center justify-center">
            <div className="text-meta mb-3 flex items-center justify-center gap-2 text-slate-400">
              <Activity className="w-4 h-4 text-blue-400" /> Career Reps
            </div>
            <div className="text-display text-hero-gradient">{stats.totalReps}</div>
          </motion.div>
          
          <motion.div variants={cardEntrance} whileHover={hoverEffect} className="surface-raised p-8 text-center flex flex-col items-center justify-center">
            <div className="text-meta mb-3 flex items-center justify-center gap-2 text-slate-400">
              <Trophy className="w-4 h-4 text-purple-400" /> Best Streak
            </div>
            <div className="text-display text-white">{stats.highestStreak}</div>
          </motion.div>

          <motion.div variants={cardEntrance} whileHover={hoverEffect} className="surface-raised p-8 text-center relative overflow-hidden flex flex-col items-center justify-center">
            <div className="text-meta mb-3 flex items-center justify-center gap-2 text-slate-400">
               Daily Streak
            </div>
            <div className="text-display text-orange-400 flex items-center justify-center gap-3">
              {stats.currentDailyStreak} <Flame className="w-10 h-10 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
            </div>
          </motion.div>
        </motion.div>

        {/* 2-Column Layout for History and Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          
          {/* History */}
          <div className="surface-raised p-8 md:p-10 flex flex-col">
            <h2 className="text-section mb-8 flex items-center gap-3">
              <History className="w-6 h-6 text-blue-500" /> Workout History
            </h2>
            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {workoutHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <Activity className="w-12 h-12 text-slate-600 mb-4" />
                  <p className="text-slate-400 font-medium text-center">No workout history yet.<br/>Your journey begins today.</p>
                </div>
              ) : (
                workoutHistory.map(session => (
                  <div key={session.id} className="surface-float border border-white/5 rounded-xl p-5 flex justify-between items-center hover:border-white/20 transition-colors">
                    <div>
                      <h4 className="text-white font-bold capitalize">{session.exercise.replace('_', ' ')}</h4>
                      <p className="text-meta text-slate-500">{new Date(session.date).toLocaleString()}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="text-xl font-bold text-white leading-none mb-1">{session.reps} <span className="text-xs text-slate-500 font-normal">reps</span></div>
                      <div className={`text-xs font-bold ${session.formScore >= 80 ? 'text-blue-400' : 'text-orange-400'}`}>{session.formScore}% form</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="surface-raised p-8 md:p-10 flex flex-col h-full">
            <h2 className="text-section mb-8 flex items-center gap-3">
              <Settings className="w-6 h-6 text-slate-400" /> Settings
            </h2>
            <div className="flex flex-col gap-4 flex-1">
              
              {/* Body Metrics */}
              <div className="surface-float p-6 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <Activity className="w-5 h-5 text-green-400" />
                  <h4 className="text-white font-bold">Body Metrics</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-meta mb-2">Weight (kg)</label>
                    <input 
                      type="number" 
                      value={weight} 
                      onChange={handleWeightChange} 
                      placeholder="e.g. 75"
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-meta mb-2">Height (cm)</label>
                    <input 
                      type="number" 
                      value={height} 
                      onChange={handleHeightChange} 
                      placeholder="e.g. 180"
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>
                {bmi && (
                  <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20 flex items-center justify-between">
                    <div className="text-sm text-white font-bold">BMI: <span className="text-green-400">{bmi}</span></div>
                    <div className="text-[10px] text-green-400/80 font-bold uppercase tracking-widest">Indicator</div>
                  </div>
                )}
              </div>
              
              {/* Camera Picker */}
              <div className="surface-float p-6 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  className="bg-slate-900 border border-white/10 text-white rounded-lg px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 shadow-inner"
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

              {/* Coach Personality Picker */}
              <div className="surface-float p-6 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-pink-400" />
                  <div>
                    <h4 className="text-white font-bold">Coach Personality</h4>
                    <p className="text-xs text-slate-400">Choose your AI's tone</p>
                  </div>
                </div>
                <select 
                  value={coachPersonality}
                  onChange={handlePersonalityChange}
                  className="bg-slate-900 border border-white/10 text-white rounded-lg px-4 py-3 text-sm font-bold focus:outline-none focus:border-pink-500 shadow-inner"
                >
                  <option value="supportive">Supportive Coach 🧘‍♀️</option>
                  <option value="drill_sergeant">Drill Sergeant 🪖</option>
                </select>
              </div>

              {/* Voice Feedback Toggle */}
              <div className="surface-float p-6 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-green-400" />
                  <div>
                    <h4 className="text-white font-bold">Voice Feedback</h4>
                    <p className="text-xs text-slate-400">Audio cues and rep counts</p>
                  </div>
                </div>
                <div onClick={toggleVoiceSetting} className={`rounded-full w-14 h-7 border border-white/10 flex items-center p-1 cursor-pointer transition-colors shadow-inner ${voiceEnabled ? 'bg-green-600' : 'bg-slate-900'}`}>
                  <motion.div layout transition={{ type: "spring", stiffness: 700, damping: 30 }} className={`w-5 h-5 rounded-full bg-white shadow-md ${voiceEnabled ? 'ml-auto' : ''}`}></motion.div>
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="surface-float p-6 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-purple-400" />
                  <div>
                    <h4 className="text-white font-bold">Theme Mode</h4>
                    <p className="text-xs text-slate-400">Light or Dark mode</p>
                  </div>
                </div>
                <div onClick={toggleTheme} className={`rounded-full w-14 h-7 border border-white/10 flex items-center p-1 cursor-pointer transition-colors shadow-inner ${isLightMode ? 'bg-blue-600' : 'bg-slate-900'}`}>
                  <motion.div layout transition={{ type: "spring", stiffness: 700, damping: 30 }} className={`w-5 h-5 rounded-full bg-white shadow-md ${isLightMode ? 'ml-auto' : ''}`}></motion.div>
                </div>
              </div>

              {/* Notifications Toggle */}
              <div className="surface-float p-6 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  <div>
                    <h4 className="text-white font-bold">Notifications</h4>
                    <p className="text-xs text-slate-400">Streak reminders</p>
                  </div>
                </div>
                <div onClick={toggleNotifications} className={`rounded-full w-14 h-7 border border-white/10 flex items-center p-1 cursor-pointer transition-colors shadow-inner ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-900'}`}>
                  <motion.div layout transition={{ type: "spring", stiffness: 700, damping: 30 }} className={`w-5 h-5 rounded-full bg-white shadow-md ${notificationsEnabled ? 'ml-auto' : ''}`}></motion.div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Trophy Room */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="surface-raised p-8 md:p-10 mb-10">
          <h2 className="text-section mb-8 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" /> Trophy Room
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {badgesList.map(badge => {
              const isUnlocked = !!badge.unlockedAt;
              return (
                <motion.div variants={cardEntrance} whileHover={isUnlocked ? hoverEffect : {}} key={badge.id} className={`p-6 rounded-3xl border transition-all duration-300 ${isUnlocked ? 'border-yellow-500/30 surface-float shadow-[0_4px_20px_rgba(234,179,8,0.15)]' : 'border-white/5 surface-float opacity-50'}`}>
                  <div className={`text-6xl mb-6 text-center flex justify-center ${!isUnlocked ? 'grayscale' : 'drop-shadow-lg'}`}>
                    <div className="icon-container-active w-20 h-20 rounded-full flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20">
                      {badge.icon}
                    </div>
                  </div>
                  <div className={`font-bold text-lg mb-2 text-center ${isUnlocked ? 'text-yellow-500' : 'text-slate-500'}`}>{badge.title}</div>
                  <div className={`text-sm text-center ${isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>{badge.description}</div>
                  {isUnlocked && (
                    <div className="text-meta text-center text-slate-400 mt-4 bg-white/5 py-1.5 rounded-lg border border-white/5">
                      {new Date(badge.unlockedAt!).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <button 
          onClick={() => { sfx.playClick(); onLogout(); }}
          className="md:hidden w-full mt-10 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </motion.div>
  );
}
