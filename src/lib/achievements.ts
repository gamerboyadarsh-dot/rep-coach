import { fetchUserStats, saveUserStats } from './firestore';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or SVG path
  unlockedAt?: number;
}

export interface WorkoutSession {
  id: string;
  date: number;
  exercise: string;
  reps: number;
  formScore: number;
  calories: number;
  durationSeconds: number;
}

export interface PersonalRecords {
  squat: number;
  pushup: number;
  jumping_jack: number;
}

export interface UserStats {
  totalReps: number;
  totalWorkouts: number;
  highestStreak: number;
  currentDailyStreak: number;
  lastWorkoutDate: number | null;
  badges: Record<string, Badge>;
  workoutHistory: WorkoutSession[];
  personalRecords: PersonalRecords;
}

export const defaultBadges: Record<string, Badge> = {
  first_workout: { id: 'first_workout', title: 'First Steps', description: 'Completed your first workout.', icon: '🎯' },
  century_club: { id: 'century_club', title: 'Century Club', description: 'Reached 100 total reps.', icon: '💯' },
  perfect_form: { id: 'perfect_form', title: 'Flawless Execution', description: 'Finished a workout with 100% form score.', icon: '✨' },
  streak_3: { id: 'streak_3', title: 'On Fire', description: 'Reached a 3-day workout streak.', icon: '🔥' },
};

function getLocalStats(userId: string): UserStats | null {
  try {
    const data = localStorage.getItem(`repCoachStats_v4_${userId}`);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        badges: { ...defaultBadges, ...parsed.badges },
        workoutHistory: parsed.workoutHistory || [],
        personalRecords: parsed.personalRecords || { squat: 0, pushup: 0, jumping_jack: 0 }
      };
    }
  } catch (e) {
    console.error('Failed to load local stats', e);
  }
  return null;
}

function saveLocalStats(userId: string, stats: UserStats) {
  try {
    localStorage.setItem(`repCoachStats_v4_${userId}`, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save local stats', e);
  }
}

export async function loadStats(userId: string, isGuest: boolean): Promise<UserStats> {
  const defaultStats = {
    totalReps: 0,
    totalWorkouts: 0,
    highestStreak: 0,
    currentDailyStreak: 0,
    lastWorkoutDate: null,
    badges: { ...defaultBadges },
    workoutHistory: [],
    personalRecords: { squat: 0, pushup: 0, jumping_jack: 0 }
  };

  if (isGuest) {
    return getLocalStats(userId) || defaultStats;
  } else {
    const remoteStats = await fetchUserStats(userId);
    if (remoteStats) {
      return {
        ...remoteStats,
        badges: { ...defaultBadges, ...(remoteStats.badges || {}) },
        workoutHistory: remoteStats.workoutHistory || [],
        personalRecords: remoteStats.personalRecords || { squat: 0, pushup: 0, jumping_jack: 0 }
      };
    }
    return getLocalStats(userId) || defaultStats;
  }
}

export async function saveStats(userId: string, stats: UserStats, isGuest: boolean) {
  saveLocalStats(userId, stats); // Always keep a local copy
  if (!isGuest) {
    await saveUserStats(userId, stats);
  }
}

export async function processWorkout(
  userId: string, 
  isGuest: boolean, 
  reps: number, 
  formScore: number,
  exercise: string,
  durationSeconds: number
): Promise<Badge[]> {
  const stats = await loadStats(userId, isGuest);
  const newlyUnlocked: Badge[] = [];
  const now = Date.now();

  if (reps === 0) return []; // Don't process empty workouts

  // Approximate calories (e.g. 0.3 cals per squat/pushup, 0.2 for jumping jacks, roughly depending on form/duration)
  let calMultiplier = exercise === 'jumping_jack' ? 0.2 : 0.4;
  const calories = Math.round(reps * calMultiplier);

  const session: WorkoutSession = {
    id: `ws_${now}`,
    date: now,
    exercise,
    reps,
    formScore,
    calories,
    durationSeconds
  };

  // Add to history and sort (keep last 50)
  stats.workoutHistory = [session, ...stats.workoutHistory].slice(0, 50);

  // Update PRs
  if (reps > (stats.personalRecords[exercise as keyof PersonalRecords] || 0)) {
    stats.personalRecords[exercise as keyof PersonalRecords] = reps;
  }

  // Update totals
  stats.totalReps += reps;
  stats.totalWorkouts += 1;

  // Streak calculation
  const today = new Date().setHours(0, 0, 0, 0);
  if (stats.lastWorkoutDate) {
    const lastWorkout = new Date(stats.lastWorkoutDate).setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - lastWorkout) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      stats.currentDailyStreak += 1;
    } else if (diffDays > 1) {
      stats.currentDailyStreak = 1; // Reset streak if skipped a day
    }
  } else {
    stats.currentDailyStreak = 1;
  }
  stats.lastWorkoutDate = now;
  stats.highestStreak = Math.max(stats.highestStreak, stats.currentDailyStreak);

  // Check achievements
  const unlock = (badgeId: string) => {
    if (stats.badges[badgeId] && !stats.badges[badgeId].unlockedAt) {
      stats.badges[badgeId].unlockedAt = now;
      newlyUnlocked.push(stats.badges[badgeId]);
    }
  };

  unlock('first_workout');
  
  if (stats.totalReps >= 100) {
    unlock('century_club');
  }

  if (formScore === 100 && reps >= 5) {
    unlock('perfect_form');
  }

  if (stats.currentDailyStreak >= 3) {
    unlock('streak_3');
  }

  await saveStats(userId, stats, isGuest);
  return newlyUnlocked;
}
