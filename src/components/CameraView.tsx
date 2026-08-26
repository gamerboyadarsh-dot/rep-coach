import React from 'react';
import { Camera, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isLoaded: boolean;
  error: string | null;
  isFrontFacing: boolean;
  cameraCount: number;
  onToggleCamera: () => void;
}

export function CameraView({ videoRef, canvasRef, isLoaded, error, isFrontFacing, cameraCount, onToggleCamera }: Props) {
  // Mirror the video for front-facing camera (like a real mirror)
  const mirrorClass = isFrontFacing ? '-scale-x-100' : '';

  return (
    <div className="absolute inset-0 z-0 bg-slate-950">
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover ${mirrorClass}`}
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover ${mirrorClass}`}
      />

      {/* Camera toggle — only shown when more than one camera is available */}
      {isLoaded && !error && cameraCount > 1 && (
        <button
          onClick={onToggleCamera}
          aria-label={isFrontFacing ? 'Switch to rear camera' : 'Switch to front camera'}
          className="absolute bottom-40 md:bottom-12 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 text-white hover:text-blue-400 px-6 py-3 rounded-full flex items-center gap-3 transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-auto active:scale-95"
        >
          <Camera className="w-5 h-5" />
          <span className="text-sm font-bold tracking-widest uppercase">
            {isFrontFacing ? 'Rear Camera' : 'Front Camera'}
          </span>
        </button>
      )}

      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-[100]" role="status" aria-live="polite">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_50%)] animate-pulse" />
          <div className="flex flex-col items-center relative z-10">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-[20px] opacity-40 animate-pulse" />
              <div className="w-20 h-20 bg-slate-900 border border-blue-500/30 rounded-full flex items-center justify-center relative shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mb-3 tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">LOADING MODELS...</div>
            <div className="text-sm text-blue-400/80 font-bold tracking-widest uppercase flex flex-col items-center gap-2">
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Vision Network</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" style={{animationDelay: '0.5s'}} /> Pose Landmarker</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/95 backdrop-blur-md z-20" role="alert">
          <div className="bg-slate-900/80 border border-red-500/30 p-8 rounded-3xl max-w-md text-center shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col items-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-red-400 text-xl font-black mb-3 tracking-wide">Camera Error</h2>
            <p className="text-slate-300 mb-8 leading-relaxed font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white py-3 px-8 rounded-xl font-bold tracking-widest uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95 w-full justify-center"
            >
              <RefreshCw className="w-5 h-5" /> Retry Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
