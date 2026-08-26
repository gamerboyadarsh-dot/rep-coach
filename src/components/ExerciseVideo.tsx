import { useRef, useEffect, useState } from 'react';

interface Props {
  src: string;
  poster?: string;
  className?: string;
}

export function ExerciseVideo({ src, poster, className = '' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isVisible]);

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        loop
        className="w-full h-full object-cover opacity-60 mix-blend-screen"
        aria-hidden="true"
      />
    </div>
  );
}
