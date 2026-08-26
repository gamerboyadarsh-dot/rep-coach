import React, { useState, useEffect } from 'react';

// --- Animations -------------------------------------------------------------
// The shimmer animation should be defined in index.css, but we can do it with a class.
// We'll define the soft light sweep in index.css as well, but for now we'll use a standard Tailwind class.
// 'animate-[shimmer_2s_infinite]' is typical, we want 800ms sweep + pause.
// We'll use a custom style or class. We can add to index.css later.

// --- Primitive Components ---------------------------------------------------

export function SkeletonBlock({ className = '', style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <div 
      aria-hidden="true" 
      className={"relative overflow-hidden bg-slate-800 rounded-2xl " + className}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" style={{ animationDuration: '1.5s' }} />
    </div>
  );
}

export function SkeletonText({ lines = 1, className = '', lastLineShort = false }) {
  return (
    <div aria-hidden="true" className={"flex flex-col gap-2 w-full " + className}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock 
          key={i} 
          className="h-4 w-full rounded-md" 
          style={lastLineShort && i === lines - 1 ? { width: '60%' } : {}}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={"relative overflow-hidden bg-slate-800 rounded-full " + className}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

// --- Loading Boundary -------------------------------------------------------

interface LoadingBoundaryProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback: React.ReactNode;
  onRetry?: () => void;
}

export function LoadingBoundary({ isLoading, children, fallback, onRetry }: LoadingBoundaryProps) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout>;
    let timeoutTimer: ReturnType<typeof setTimeout>;

    if (isLoading) {
      // 300ms delay before showing skeleton to prevent fast-load flashes
      delayTimer = setTimeout(() => setShowSkeleton(true), 300);
      
      // 7s maximum wait before showing error/retry state
      timeoutTimer = setTimeout(() => setShowTimeout(true), 7000);
    } else {
      setShowSkeleton(false);
      setShowTimeout(false);
    }

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(timeoutTimer);
    };
  }, [isLoading]);

  if (!isLoading) {
    return <>{children}</>;
  }

  if (showTimeout) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border border-white/5 rounded-2xl bg-slate-900/50">
        <p className="text-slate-400 text-sm mb-3">Taking longer than usual...</p>
        {onRetry && (
          <button 
            onClick={() => {
              setShowTimeout(false);
              onRetry();
            }}
            className="text-lime-400 font-bold text-sm px-4 py-2 rounded-full border border-lime-500/30 hover:bg-lime-500/10 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (showSkeleton) {
    return (
      <div aria-busy="true" className="w-full relative transition-opacity duration-300">
        <span className="sr-only">Loading...</span>
        {fallback}
      </div>
    );
  }

  return null; // The 0-300ms sweet spot (show nothing until data arrives or delay hits)
}
