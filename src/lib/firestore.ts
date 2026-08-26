import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { UserStats } from './achievements';

export async function fetchUserStats(uid: string): Promise<UserStats | null> {
  if (!db) {
    console.error('[Firestore] db is undefined — Firebase not initialized. Check env vars.');
    return null;
  }
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserStats;
    }
  } catch (err) {
    console.error('[Firestore] Error fetching user stats:', err);
  }
  return null;
}

export async function saveUserStats(uid: string, stats: UserStats): Promise<void> {
  if (!db) {
    console.error('[Firestore] db is undefined — Firebase not initialized. Check env vars.');
    return;
  }
  try {
    const docRef = doc(db, 'users', uid);
    // Firestore throws on undefined. Clean the object.
    const cleanStats = JSON.parse(JSON.stringify(stats));
    await setDoc(docRef, cleanStats, { merge: true });
    console.log('[Firestore] Stats saved successfully for uid:', uid);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    console.error('[Firestore] Save failed!', {
      code: error?.code,
      message: error?.message,
      uid,
    });
    // Re-throw so callers can surface the error to the user
    throw err;
  }
}
