import { useState } from 'react';
import { sfx } from '../lib/sounds';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../lib/firebase';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onLogin: (uid: string, username: string, photoURL?: string, isGuest?: boolean) => void;
  isLoading?: boolean;
}

export function AuthScreen({ onLogin, isLoading }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getFriendlyErrorMessage = (err: any): string | null => {
    const code = err?.code || '';
    if (code === 'auth/unauthorized-domain') return "Sign-in isn't available from this domain right now — try Continue as Guest.";
    if (code === 'auth/popup-closed-by-user') return null;
    if (code === 'auth/popup-blocked') return "Your browser blocked the sign-in popup — try allowing popups for this site, or continue as Guest.";
    if (code === 'auth/network-request-failed') return "Couldn't reach the sign-in service — check your connection or continue as Guest.";
    return "Sign-in failed — you can continue as Guest instead.";
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      setError("Firebase is not configured. Please add keys to .env");
      sfx.playError();
      return;
    }
    try {
      setLoading(true);
      sfx.playClick();
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user.uid, result.user.displayName || result.user.email || 'User', result.user.photoURL || undefined, false);
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      if (msg) {
        setError(msg);
        sfx.playError();
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    if (!auth || !githubProvider) {
      setError("Firebase is not configured. Please add keys to .env");
      sfx.playError();
      return;
    }
    try {
      setLoading(true);
      sfx.playClick();
      const result = await signInWithPopup(auth, githubProvider);
      onLogin(result.user.uid, result.user.displayName || result.user.email || 'User', result.user.photoURL || undefined, false);
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      if (msg) {
        setError(msg);
        sfx.playError();
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback for hackathon testing without firebase config
  const handleGuestLogin = () => {
    sfx.playClick();
    onLogin('guest', 'Guest Athlete', undefined, true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen relative z-10 w-full">
        <div className="w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 relative z-10 w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md surface-raised p-8 sm:p-12 relative overflow-hidden"
      >
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-blue-500/20 blur-[60px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-purple-500/20 blur-[60px] pointer-events-none"></div>

        <div className="relative z-10 text-center mb-12">
          <div className="icon-container-active w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-blue-500/10 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m11 17 2 2a1 1 0 1 0 3-3"/>
              <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-4.24 4.24a3 3 0 1 0 4.24 4.24l2.36-2.36"/>
            </svg>
          </div>
          <h1 className="text-display text-white tracking-tight mb-2">Rep Coach</h1>
          <p className="text-meta text-blue-400">YOUR AI PERSONAL TRAINER</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8 p-4 bg-red-500/10 text-red-400 rounded-xl text-sm font-bold border border-red-500/20 flex items-start gap-3 shadow-inner">
            <span className="shrink-0">⚠️</span>
            <span className="leading-tight">{error}</span>
          </motion.div>
        )}

        <div className="flex flex-col gap-4 relative z-10">
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-slate-900 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl"
          >
            <svg className="w-5 h-5 google-logo" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button 
            onClick={handleGithubSignIn}
            disabled={loading}
            className="w-full bg-[#24292F] text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#24292F]/80 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl border border-white/10"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Continue with GitHub
          </button>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-slate-900 text-meta text-slate-500 rounded-full border border-white/5 shadow-inner">OR</span>
            </div>
          </div>

          <button 
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full surface-float text-slate-300 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:text-white border border-white/5 transition-all active:scale-[0.98] shadow-lg hover:border-white/20 hover:bg-white/5"
          >
            <LogIn className="w-5 h-5 opacity-70" />
            Continue as Guest
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500 font-medium relative z-10">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
