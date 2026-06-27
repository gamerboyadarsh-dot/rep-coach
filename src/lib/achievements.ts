export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or SVG path
  unlockedAt?: number;
}

export interface UserStats {
  totalReps: number;
  totalWorkouts: number;
  highestStreak: number;
  currentDailyStreak: number;
  lastWorkoutDate: number | null;
  badges: Record<string, Badge>;
}

const defaultBadges: Record<string, Badge> = {
  first_workout: { id: 'first_workout', title: 'First Steps', description: 'Completed your first workout.', icon: '🎯' },
  century_club: { id: 'century_club', title: 'Century Club', description: 'Reached 100 total reps.', icon: '💯' },
  perfect_form: { id: 'perfect_form', title: 'Flawless Execution', description: 'Finished a workout with 100% form score.', icon: '✨' },
  streak_3: { id: 'streak_3', title: 'On Fire', description: 'Reached a 3-day workout streak.', icon: '🔥' },
};

export function loadStats(username: string): UserStats {
  try {
    const data = localStorage.getItem(`repCoachStats_v2_${username}`);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure default badges exist even if missing from storage
      return {
        ...parsed,
        badges: { ...defaultBadges, ...parsed.badges }
      };
    }
  } catch (e) {
    console.error('Failed to load stats', e);
  }
  return {
    totalReps: 0,
    totalWorkouts: 0,
    highestStreak: 0,
    currentDailyStreak: 0,
    lastWorkoutDate: null,
    badges: { ...defaultBadges }
  };
}

export function saveStats(username: string, stats: UserStats) {
  try {
    localStorage.setItem(`repCoachStats_v2_${username}`, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
}

export function processWorkout(username: string, reps: number, formScore: number): Badge[] {
  const stats = loadStats(username);
  const newlyUnlocked: Badge[] = [];
  const now = Date.now();

  if (reps === 0) return []; // Don't process empty workouts

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

  saveStats(username, stats);
  return newlyUnlocked;
}
