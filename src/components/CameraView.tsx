import React from 'react';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isLoaded: boolean;
  error: string | null;
  facingMode: 'user' | 'environment';
  onToggleCamera: () => void;
}

export function CameraView({ videoRef, canvasRef, isLoaded, error, facingMode, onToggleCamera }: Props) {
  const transformClass = facingMode === 'user' ? '-scale-x-100' : '';

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover ${transformClass}`}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover ${transformClass}`}
      />

      {isLoaded && !error && (
        <button 
          onClick={onToggleCamera}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] hud-panel px-6 py-3 border-[var(--color-hud-cyan)] text-[var(--color-hud-cyan)] uppercase tracking-widest text-sm font-bold bg-black/50 hover:bg-[var(--color-hud-cyan)] hover:text-black transition-colors pointer-events-auto"
        >
          {facingMode === 'user' ? 'USE REAR CAMERA' : 'USE FRONT CAMERA'}
        </button>
      )}
      
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center">
            <div className="text-xl mb-4 pulse-glow">INITIALIZING SENSORS...</div>
            <div className="text-sm opacity-50">Loading MediaPipe Models</div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="hud-panel border-[var(--color-hud-red)] p-8 max-w-md text-center">
            <div className="text-[var(--color-hud-red)] text-xl mb-4 font-bold">SYSTEM FAILURE</div>
            <div className="text-[var(--color-hud-red)]">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
