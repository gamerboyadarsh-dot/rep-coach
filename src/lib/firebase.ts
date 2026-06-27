import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "missing-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "missing-auth-domain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "missing-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "missing-storage-bucket.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000"
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let githubProvider: GithubAuthProvider | undefined;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  // Initialize Auth
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  githubProvider = new GithubAuthProvider();
} catch (err) {
  console.error("Firebase initialization failed. Please check your .env variables.", err);
}

export { app, auth, googleProvider, githubProvider };
