import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { angleBetween, getPoint } from '../lib/angles';

export type PoseLandmark = { x: number; y: number; visibility: number };

export interface UsePoseDetectionReturn {
  isLoaded: boolean;
  landmarks: PoseLandmark[] | null;
  poseConfidence: number;
  cameraCount: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  toggleCamera: () => Promise<void>;
  isFrontFacing: boolean;
  error: string | null;
}

// Pinned version to avoid silent WASM breakage from @latest
const MEDIAPIPE_VERSION = '0.10.21';

function humanizeError(err: unknown): string {
  if (!(err instanceof Error)) return 'Unknown camera error.';
  if (err.name === 'NotAllowedError') return 'Camera access denied. Please allow camera permission and reload.';
  if (err.name === 'NotFoundError') return 'No camera found on this device.';
  if (err.name === 'OverconstrainedError') return 'The selected camera could not be started. Try switching cameras.';
  if (err.name === 'NotReadableError') return 'Camera is already in use by another app.';
  return `Camera error: ${err.message}`;
}

function labelIsFrontFacing(label: string): boolean {
  const lower = label.toLowerCase();
  return lower.includes('front') || lower.includes('user') || lower.includes('facetime');
}

export function usePoseDetection(): UsePoseDetectionReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [landmarks, setLandmarks] = useState<PoseLandmark[] | null>(null);
  const [poseConfidence, setPoseConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFrontFacing, setIsFrontFacing] = useState(true);
  const [cameraCount, setCameraCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastResultTimeRef = useRef<number>(0);
  const runningRef = useRef(false);
  const cameraListRef = useRef<MediaDeviceInfo[]>([]);
  const currentDeviceIdRef = useRef<string | null>(null);

  // Enumerate real cameras on the device
  const refreshCameraList = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      cameraListRef.current = cameras;
      setCameraCount(cameras.length);

      // Restore last-used camera if saved
      const savedId = localStorage.getItem('repCoach_cameraDeviceId');
      if (savedId && cameras.find(c => c.deviceId === savedId)) {
        currentDeviceIdRef.current = savedId;
      } else if (cameras.length > 0) {
        currentDeviceIdRef.current = cameras[0].deviceId;
        // Prefer front-facing for fitness app
        const front = cameras.find(c => labelIsFrontFacing(c.label));
        if (front) currentDeviceIdRef.current = front.deviceId;
      }
    } catch {
      // enumerateDevices can fail silently — fall back to facingMode constraints
    }
  }, []);

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

  const startCamera = useCallback(async (deviceId?: string | null) => {
    setError(null);
    try {
      // Always stop existing stream first to prevent "camera in use" errors
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // After getting the stream, refresh device list (labels are available post-permission)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      cameraListRef.current = cameras;
      setCameraCount(cameras.length);

      // Determine if this camera is front-facing from track settings or label
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      let front = true;
      if (settings.facingMode) {
        front = settings.facingMode === 'user';
      } else if (track.label) {
        front = labelIsFrontFacing(track.label);
      }
      setIsFrontFacing(front);

      // Save selected camera
      const activeDeviceId = settings.deviceId ?? deviceId;
      if (activeDeviceId) {
        currentDeviceIdRef.current = activeDeviceId;
        localStorage.setItem('repCoach_cameraDeviceId', activeDeviceId);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError(humanizeError(err));
      throw err;
    }
  }, []);

  const predictWebcam = useCallback(async () => {
    if (!runningRef.current || !videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) {
      return;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Throttle to ~25fps
    const now = performance.now();
    if (now - lastResultTimeRef.current < 40) {
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
      return;
    }
    lastResultTimeRef.current = now;

    const result: PoseLandmarkerResult = poseLandmarkerRef.current.detectForVideo(video, now);

    if (result.landmarks && result.landmarks.length > 0) {
      const rawLandmarks = result.landmarks[0];

      // Carry visibility through — critical for confidence-based filtering
      const points: PoseLandmark[] = rawLandmarks.map(l => ({
        x: l.x,
        y: l.y,
        visibility: l.visibility ?? 1,
      }));

      // Compute average confidence for key body joints
      const keyJoints = [11, 12, 13, 14, 23, 24, 25, 26];
      const avgConf = keyJoints.reduce((sum, i) => sum + (points[i]?.visibility ?? 0), 0) / keyJoints.length;
      setPoseConfidence(Math.round(avgConf * 100));

      drawConnections(ctx, rawLandmarks, canvas.width, canvas.height);
      drawLandmarks(ctx, rawLandmarks, canvas.width, canvas.height);

      setLandmarks(points);
    } else {
      setLandmarks(null);
      setPoseConfidence(0);
    }

    animationFrameRef.current = requestAnimationFrame(predictWebcam);
  }, []);

  const toggleCamera = useCallback(async () => {
    if (cameraListRef.current.length <= 1) return; // No-op if only one camera

    const cameras = cameraListRef.current;
    const currentIndex = cameras.findIndex(c => c.deviceId === currentDeviceIdRef.current);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    const wasRunning = runningRef.current;
    stopCamera();

    try {
      await startCamera(nextCamera.deviceId);
      if (wasRunning) {
        runningRef.current = true;
        predictWebcam();
      }
    } catch {
      // Error is already set in startCamera
    }
  }, [startCamera, stopCamera, predictWebcam]);

  // Override startCamera used in App to also start the detection loop
  const startCameraAndDetect = useCallback(async () => {
    await refreshCameraList();
    await startCamera(currentDeviceIdRef.current);
    runningRef.current = true;
    predictWebcam();
  }, [refreshCameraList, startCamera, predictWebcam]);

  useEffect(() => {
    const initPose = async () => {
      try {
        // Try GPU first, fall back to CPU
        let poseLandmarker: PoseLandmarker | null = null;
        try {
          const fileset = await FilesetResolver.forVisionTasks(
            `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
          );
          poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
          });
        } catch {
          // GPU failed, retry with CPU
          const fileset = await FilesetResolver.forVisionTasks(
            `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
          );
          poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
          });
        }

        poseLandmarkerRef.current = poseLandmarker;
        setIsLoaded(true);

        // Pre-enumerate cameras so UI can show/hide switch button before permission
        await refreshCameraList();
      } catch (err) {
        setError(`Failed to load pose detection model: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    initPose();

    return () => {
      stopCamera();
      // Free WASM model resources
      poseLandmarkerRef.current?.close();
      poseLandmarkerRef.current = null;
    };
  }, [stopCamera, refreshCameraList]);

  return {
    isLoaded,
    landmarks,
    poseConfidence,
    cameraCount,
    videoRef,
    canvasRef,
    startCamera: startCameraAndDetect,
    stopCamera,
    toggleCamera,
    isFrontFacing,
    error,
  };
}

// Helper to draw skeleton connections
function drawConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number; visibility?: number }[],
  width: number,
  height: number
) {
  const connections = [
    [11, 12], [11, 23], [12, 24], [23, 24],
    [12, 14], [14, 16],
    [11, 13], [13, 15],
    [24, 26], [26, 28],
    [23, 25], [25, 27],
  ];

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'; // Blue-500
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
  ctx.shadowBlur = 4;

  connections.forEach(([i, j]) => {
    const a = landmarks[i];
    const b = landmarks[j];
    if (a && b && (a.visibility ?? 1) > 0.4 && (b.visibility ?? 1) > 0.4) {
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
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

  ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // White core
  ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
  ctx.shadowBlur = 8;

  importantIndices.forEach(i => {
    const lm = landmarks[i];
    if (lm && (lm.visibility ?? 1) > 0.5) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // Blue ring
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 8, 0, 2 * Math.PI);
      ctx.stroke();
    }
  });

  ctx.shadowBlur = 0;

  // Draw joint angles for the user's reference
  ctx.font = "600 13px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;

  const drawAngleText = (aIdx: number, bIdx: number, cIdx: number) => {
    const a = landmarks[aIdx], b = landmarks[bIdx], c = landmarks[cIdx];
    if (a && b && c && (b.visibility ?? 1) > 0.5) {
      const angle = Math.round(angleBetween(getPoint(a), getPoint(b), getPoint(c)));
      // Draw a subtle pill background
      const textX = (b.x * width) + 15;
      const textY = (b.y * height) - 15;
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'; // slate-900/60
      ctx.beginPath();
      ctx.roundRect(textX - 6, textY - 14, 32, 20, 6);
      ctx.fill();
      
      ctx.fillStyle = '#93c5fd'; // blue-300
      ctx.fillText(`${angle}°`, textX, textY);
    }
  };

  drawAngleText(11, 13, 15); // Left elbow
  drawAngleText(12, 14, 16); // Right elbow
  drawAngleText(23, 25, 27); // Left knee
  drawAngleText(24, 26, 28); // Right knee
}
