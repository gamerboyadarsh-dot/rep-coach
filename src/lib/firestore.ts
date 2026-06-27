import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { UserStats } from './achievements';

export async function fetchUserStats(uid: string): Promise<UserStats | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserStats;
    }
  } catch (err) {
    console.error('Error fetching user stats from Firestore:', err);
  }
  return null;
}

export async function saveUserStats(uid: string, stats: UserStats): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, stats, { merge: true });
  } catch (err) {
    console.error('Error saving user stats to Firestore:', err);
  }
}
