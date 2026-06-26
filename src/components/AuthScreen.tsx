import { useState } from 'react';
import { sfx } from '../lib/sounds';

interface Props {
  onLogin: (username: string) => void;
}

export function AuthScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length > 2) {
      sfx.playClick();
      onLogin(username.trim());
    } else {
      sfx.playError();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10">
      <div className="hud-panel p-12 w-full max-w-md relative">
        <div className="corner-bracket tl"></div>
        <div className="corner-bracket tr"></div>
        <div className="corner-bracket bl"></div>
        <div className="corner-bracket br"></div>

        <h1 className="text-4xl font-bold mb-2 text-center glow-text">REP COACH</h1>
        <p className="text-center opacity-70 mb-8 uppercase tracking-widest text-sm">System Authorization</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm uppercase tracking-widest opacity-80 mb-2">OPERATIVE ID</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[var(--color-hud-bg)] border border-[var(--color-hud-cyan)]/50 p-4 text-[var(--color-hud-cyan)] outline-none focus:border-[var(--color-hud-cyan)] focus:shadow-[0_0_10px_var(--color-hud-cyan)] transition-all uppercase"
              placeholder="ENTER USERNAME..."
              autoFocus
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[var(--color-hud-cyan)]/10 border border-[var(--color-hud-cyan)] text-[var(--color-hud-cyan)] py-4 font-bold tracking-widest hover:bg-[var(--color-hud-cyan)] hover:text-[var(--color-hud-bg)] transition-colors cursor-pointer uppercase"
          >
            INITIALIZE UPLINK
          </button>
        </form>
      </div>
    </div>
  );
}
