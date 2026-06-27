import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { angleBetween, getPoint } from '../lib/angles';

export interface UsePoseDetectionReturn {
  isLoaded: boolean;
  landmarks: { x: number; y: number }[] | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  toggleCamera: () => Promise<void>;
  facingMode: 'user' | 'environment';
  error: string | null;
}

export function usePoseDetection(): UsePoseDetectionReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [landmarks, setLandmarks] = useState<{ x: number; y: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastResultTimeRef = useRef<number>(0);
  const runningRef = useRef(false);

  const startCamera = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: mode },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError(`Camera access denied: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    runningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const predictWebcam = useCallback(async () => {
    if (!runningRef.current || !videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) {
      return;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      // Video not fully ready yet, wait for next frame
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Only run detection every ~50ms (20fps) to save CPU
    const now = performance.now();
    if (now - lastResultTimeRef.current < 50) {
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
      return;
    }
    lastResultTimeRef.current = now;

    const result: PoseLandmarkerResult = poseLandmarkerRef.current.detectForVideo(video, now);

    if (result.landmarks && result.landmarks.length > 0) {
      // Draw pose
      const landmarks = result.landmarks[0];
      const points = landmarks.map(l => ({ x: l.x, y: l.y }));

      // Draw connections
      drawConnections(ctx, landmarks, canvas.width, canvas.height);
      // Draw landmarks
      drawLandmarks(ctx, landmarks, canvas.width, canvas.height);

      setLandmarks(points);
    } else {
      setLandmarks(null);
    }

    animationFrameRef.current = requestAnimationFrame(predictWebcam);
  }, []);

  const toggleCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    
    if (runningRef.current) {
      stopCamera();
      await startCamera(newMode);
      runningRef.current = true;
      predictWebcam();
    }
  }, [facingMode, startCamera, stopCamera, predictWebcam]);

  useEffect(() => {
    const initPose = async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        poseLandmarkerRef.current = poseLandmarker;
        setIsLoaded(true);
      } catch (err) {
        setError(`Failed to load pose detection: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    initPose();

    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (isLoaded && videoRef.current && streamRef.current) {
      runningRef.current = true;
      predictWebcam();
    }

    return () => {
      runningRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLoaded, predictWebcam]);

  return {
    isLoaded,
    landmarks,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    toggleCamera,
    facingMode,
    error,
  };
}

// Helper to draw skeleton
function drawConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number; visibility?: number }[],
  width: number,
  height: number
) {
  const connections = [
    // Torso
    [11, 12], [11, 23], [12, 24], [23, 24],
    // Right arm
    [12, 14], [14, 16],
    // Left arm
    [11, 13], [13, 15],
    // Right leg
    [24, 26], [26, 28],
    // Left leg
    [23, 25], [25, 27],
    // Shoulders to hips (wrap)
  ];

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
  ctx.shadowBlur = 8;

  connections.forEach(([i, j]) => {
    if (landmarks[i] && landmarks[j]) {
      ctx.beginPath();
      ctx.moveTo(landmarks[i].x * width, landmarks[i].y * height);
      ctx.lineTo(landmarks[j].x * width, landmarks[j].y * height);
      ctx.stroke();
    }
  });

  ctx.shadowBlur = 0;
}

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number; visibility?: number }[],
  width: number,
  height: number
) {
  const importantIndices = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

  ctx.fillStyle = 'rgba(0, 240, 255, 1)';
  ctx.shadowColor = 'rgba(0, 240, 255, 1)';
  ctx.shadowBlur = 15;

  importantIndices.forEach(i => {
    const lm = landmarks[i];
    if (lm && (!lm.visibility || lm.visibility > 0.5)) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw outer ring
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 12, 0, 2 * Math.PI);
      ctx.stroke();
    }
  });

  ctx.shadowBlur = 0;

  // Draw angle texts for major joints
  ctx.font = "16px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#00f0ff";
  ctx.shadowColor = "#00f0ff";
  ctx.shadowBlur = 5;

  const drawAngleText = (aIdx: number, bIdx: number, cIdx: number) => {
    const a = landmarks[aIdx], b = landmarks[bIdx], c = landmarks[cIdx];
    if (a && b && c && (b.visibility || 1) > 0.5) {
      const angle = Math.round(angleBetween(getPoint(a), getPoint(b), getPoint(c)));
      ctx.fillText(`${angle}°`, (b.x * width) + 15, (b.y * height) - 15);
    }
  };

  drawAngleText(11, 13, 15); // Left elbow
  drawAngleText(12, 14, 16); // Right elbow
  drawAngleText(23, 25, 27); // Left knee
  drawAngleText(24, 26, 28); // Right knee
  drawAngleText(11, 23, 25); // Left hip
  drawAngleText(12, 24, 26); // Right hip
}
