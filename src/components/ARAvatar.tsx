import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Line, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { PoseLandmark } from '../hooks/usePoseDetection';

// Map mediapipe connections (pairs of indices)
const CONNECTIONS = [
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left Arm
  [11, 13], [13, 15],
  // Right Arm
  [12, 14], [14, 16],
  // Left Leg
  [23, 25], [25, 27], [27, 29], [29, 31], [31, 27],
  // Right Leg
  [24, 26], [26, 28], [28, 30], [30, 32], [32, 28],
  // Head
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10]
];

interface AvatarProps {
  landmarks: PoseLandmark[] | null;
}

function HologramLines({ landmarks }: { landmarks: PoseLandmark[] }) {
  const linesRef = useRef<THREE.Group>(null);

  // Smooth the points so they don't jitter
  useFrame(() => {
    if (!linesRef.current || !landmarks) return;
    // We could add lerping here, but usePoseDetection already has some built-in stability
    // For now we just render raw points
  });

  // MediaPipe coordinates: X [0,1], Y [0,1], Z [0,1]
  // We need to map them to Three.js space: [-2, 2] roughly
  const getPoint = (idx: number) => {
    const lm = landmarks[idx];
    if (!lm || lm.visibility < 0.5) return null;
    // Map mediapipe coords to a nice 3D bounding box
    return new THREE.Vector3(
      -(lm.x - 0.5) * 4,
      -(lm.y - 0.5) * 4, // invert Y because MediaPipe Y goes down
      -(lm.z) * 4
    );
  };

  const lineGeo = useMemo(() => {
    const segments: [THREE.Vector3, THREE.Vector3][] = [];
    for (const [a, b] of CONNECTIONS) {
      const p1 = getPoint(a);
      const p2 = getPoint(b);
      if (p1 && p2) segments.push([p1, p2]);
    }
    return segments;
  }, [landmarks]);

  const points = useMemo(() => {
    return landmarks.map((_, i) => getPoint(i)).filter(Boolean) as THREE.Vector3[];
  }, [landmarks]);

  if (!landmarks || landmarks.length === 0) return null;

  return (
    <group ref={linesRef}>
      {/* Draw joints */}
      {points.map((p, i) => (
        <Sphere key={`joint-${i}`} args={[0.04, 16, 16]} position={p}>
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.8} />
        </Sphere>
      ))}

      {/* Draw connections */}
      {lineGeo.map((segment, i) => (
        <Line
          key={`line-${i}`}
          points={[segment[0], segment[1]]}
          color="#60a5fa"
          lineWidth={3}
          transparent
          opacity={0.6}
        />
      ))}
    </group>
  );
}

export function ARAvatar({ landmarks }: AvatarProps) {
  if (!landmarks) return null;

  return (
    <div className="absolute inset-y-0 right-0 w-1/3 md:w-1/4 pointer-events-none z-20 mix-blend-screen opacity-80">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#3b82f6" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#8b5cf6" />
        
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
          <HologramLines landmarks={landmarks} />
        </Float>
      </Canvas>
    </div>
  );
}
