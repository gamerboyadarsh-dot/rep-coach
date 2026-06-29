import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface GhostData {
  id?: string;
  creatorName: string;
  exercise: string;
  goal: number;
  timestamps: number[]; // e.g., [1200, 2500, 4100] (ms since start)
  createdAt: number;
}

export async function saveGhostChallenge(ghost: Omit<GhostData, 'id' | 'createdAt'>): Promise<string | null> {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, 'challenges'), {
      ...ghost,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Failed to save ghost challenge:', error);
    return null;
  }
}

export async function loadGhostChallenge(challengeId: string): Promise<GhostData | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, 'challenges', challengeId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as GhostData;
    }
    return null;
  } catch (error) {
    console.error('Failed to load ghost challenge:', error);
    return null;
  }
}
