const fs = require('fs');

const code = \import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { WorkoutSession } from '../lib/achievements';
import { Skeleton } from './Skeleton';

// --- Types -------------------------------------------------------------------

interface MuscleRegion {
  name: string;
  engagement: number; // 0–1
  position: [number, number, number];
  rotation: [number, number, number];
  type: 'capsule' | 'sphere' | 'cylinder';
  args: any[];
}

interface HeatmapProps {
  history: WorkoutSession[];
}

// --- Helpers -----------------------------------------------------------------

function computeEngagement(history: WorkoutSession[]): Record<string, number> {
  const counts: Record<string, number> = {
    quads: 0, hamstrings: 0, glutes: 0, calves: 0,
    chest: 0, shoulders: 0, triceps: 0, biceps: 0,
    core: 0, lats: 0, traps: 0, cardio: 0,
  };

  const exerciseWeights: Record<string, Record<string, number>> = {
    squat:        { quads: 1.0, glutes: 0.9, hamstrings: 0.7, core: 0.6, calves: 0.4 },
    pushup:       { chest: 1.0, triceps: 0.9, shoulders: 0.8, core: 0.7, lats: 0.4 },
    jumping_jack: { calves: 0.9, cardio: 1.0, shoulders: 0.7, quads: 0.5, core: 0.4 },
    plank:        { core: 1.0, shoulders: 0.8, traps: 0.6, glutes: 0.5 },
  };

  for (const session of history) {
    const weights = exerciseWeights[session.exercise] ?? {};
    const reps = Math.min(session.reps ?? 1, 100);
    const intensity = (reps / 100) * 0.6 + 0.4; // 0.4–1.0
    for (const [muscle, weight] of Object.entries(weights)) {
      counts[muscle] = Math.min(1, (counts[muscle] ?? 0) + weight * intensity * 0.35);
    }
  }
  return counts;
}

function engagementColor(t: number): THREE.Color {
  if (t <= 0.01) return new THREE.Color('#0f172a'); // Very dark slate (almost invisible muscle)
  const stops = [
    { t: 0.0,  c: [0.18, 0.45, 0.80] },
    { t: 0.25, c: [0.20, 0.75, 0.65] },
    { t: 0.50, c: [0.55, 0.90, 0.30] },
    { t: 0.75, c: [1.00, 0.75, 0.00] },
    { t: 1.0,  c: [1.00, 0.20, 0.10] },
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / (b.t - a.t);
      return new THREE.Color(
        a.c[0] + (b.c[0] - a.c[0]) * f,
        a.c[1] + (b.c[1] - a.c[1]) * f,
        a.c[2] + (b.c[2] - a.c[2]) * f,
      );
    }
  }
  return new THREE.Color('#ff3319');
}

// --- Organic Muscle Block -----------------------------------------------------

function MuscleNode({ region, onClick, hovered, onHover }: { region: MuscleRegion, onClick: any, hovered: boolean, onHover: any }) {
  const ref = useRef<THREE.Mesh>(null!);
  const color = useMemo(() => engagementColor(region.engagement), [region.engagement]);
  const emissive = useMemo(
    () => engagementColor(region.engagement).multiplyScalar(hovered ? 0.6 : (region.engagement > 0 ? 0.3 : 0.05)),
    [region.engagement, hovered],
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    const scale = hovered ? 1.08 : 1.0;
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, scale, 1 - Math.exp(-8 * delta)));
  });

  return (
    <mesh
      ref={ref}
      position={region.position}
      rotation={region.rotation}
      onClick={(e) => { e.stopPropagation(); onClick(region.name, region.engagement); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(region.name); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
      castShadow
      receiveShadow
    >
      {region.type === 'capsule' && <capsuleGeometry args={region.args as any} />}
      {region.type === 'sphere' && <sphereGeometry args={region.args as any} />}
      {region.type === 'cylinder' && <cylinderGeometry args={region.args as any} />}
      
      <meshPhysicalMaterial
        color={color}
        emissive={emissive}
        roughness={0.4}
        metalness={0.2}
        clearcoat={0.3}
        clearcoatRoughness={0.2}
        sheen={1}
        sheenRoughness={0.5}
        sheenColor={new THREE.Color(0xa3e635)}
        transparent
        opacity={region.engagement <= 0.01 ? 0.35 : 0.9}
        flatShading={false}
      />
    </mesh>
  );
}

// --- Humanoid Figure ----------------------------------------------------------

function HumanoidFigure({ engagement, onMuscleClick, isInteracting }: { engagement: Record<string, number>, onMuscleClick: any, isInteracting: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Idle breathing & floating
    if (!isInteracting) {
      groupRef.current.rotation.y += delta * 0.2;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02; // subtle float/breathe
      
      // Slight chest expansion on breathe in
      const breathScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      groupRef.current.scale.set(1, breathScale, 1 + (breathScale-1)*1.5);
    } else {
      // Lerp back to neutral scale when interacting
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, 1, 0.1));
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
    }
  });

  // Build anatomy using smooth primitives
  // Args: capsule: [radius, length, capSeg, radSeg]
  // sphere: [radius, widthSeg, heightSeg]
  // cylinder: [radTop, radBot, height, radSeg]
  const muscles: MuscleRegion[] = [
    // Torso (Cylinders & spheres blended)
    { name: 'chest', engagement: engagement.chest ?? 0, position: [0, 0.5, 0.05], rotation: [0.1, 0, 0], type: 'capsule', args: [0.18, 0.2, 16, 16] },
    { name: 'core', engagement: engagement.core ?? 0, position: [0, 0.2, 0.04], rotation: [0, 0, 0], type: 'capsule', args: [0.15, 0.25, 16, 16] },
    { name: 'lats', engagement: engagement.lats ?? 0, position: [0, 0.45, -0.05], rotation: [-0.1, 0, 0], type: 'capsule', args: [0.19, 0.25, 16, 16] },
    { name: 'traps', engagement: engagement.traps ?? 0, position: [0, 0.72, -0.03], rotation: [-0.2, 0, 0], type: 'capsule', args: [0.12, 0.3, 16, 16] },
    
    // Shoulders
    { name: 'shoulders', engagement: engagement.shoulders ?? 0, position: [0.24, 0.65, 0], rotation: [0, 0, 0.4], type: 'sphere', args: [0.11, 16, 16] },
    { name: 'shoulders', engagement: engagement.shoulders ?? 0, position: [-0.24, 0.65, 0], rotation: [0, 0, -0.4], type: 'sphere', args: [0.11, 16, 16] },
    
    // Arms (Capsules)
    { name: 'biceps', engagement: engagement.biceps ?? 0, position: [0.28, 0.42, 0.03], rotation: [0, 0, 0.15], type: 'capsule', args: [0.07, 0.2, 12, 12] },
    { name: 'biceps', engagement: engagement.biceps ?? 0, position: [-0.28, 0.42, 0.03], rotation: [0, 0, -0.15], type: 'capsule', args: [0.07, 0.2, 12, 12] },
    { name: 'triceps', engagement: engagement.triceps ?? 0, position: [0.28, 0.42, -0.02], rotation: [0, 0, 0.15], type: 'capsule', args: [0.065, 0.22, 12, 12] },
    { name: 'triceps', engagement: engagement.triceps ?? 0, position: [-0.28, 0.42, -0.02], rotation: [0, 0, -0.15], type: 'capsule', args: [0.065, 0.22, 12, 12] },
    
    // Forearms
    { name: 'forearms', engagement: 0.1, position: [0.33, 0.12, 0], rotation: [0, 0, 0.1], type: 'capsule', args: [0.05, 0.22, 12, 12] },
    { name: 'forearms', engagement: 0.1, position: [-0.33, 0.12, 0], rotation: [0, 0, -0.1], type: 'capsule', args: [0.05, 0.22, 12, 12] },
    
    // Pelvis/Glutes
    { name: 'glutes', engagement: engagement.glutes ?? 0, position: [0, -0.05, -0.08], rotation: [0.2, 0, 0], type: 'capsule', args: [0.16, 0.15, 16, 16] },
    
    // Thighs (Quads/Hams)
    { name: 'quads', engagement: engagement.quads ?? 0, position: [0.11, -0.35, 0.02], rotation: [0, 0, -0.05], type: 'capsule', args: [0.09, 0.35, 16, 16] },
    { name: 'quads', engagement: engagement.quads ?? 0, position: [-0.11, -0.35, 0.02], rotation: [0, 0, 0.05], type: 'capsule', args: [0.09, 0.35, 16, 16] },
    { name: 'hamstrings', engagement: engagement.hamstrings ?? 0, position: [0.11, -0.35, -0.04], rotation: [0, 0, -0.05], type: 'capsule', args: [0.08, 0.35, 16, 16] },
    { name: 'hamstrings', engagement: engagement.hamstrings ?? 0, position: [-0.11, -0.35, -0.04], rotation: [0, 0, 0.05], type: 'capsule', args: [0.08, 0.35, 16, 16] },
    
    // Calves
    { name: 'calves', engagement: engagement.calves ?? 0, position: [0.11, -0.75, -0.02], rotation: [0, 0, 0], type: 'capsule', args: [0.07, 0.3, 12, 12] },
    { name: 'calves', engagement: engagement.calves ?? 0, position: [-0.11, -0.75, -0.02], rotation: [0, 0, 0], type: 'capsule', args: [0.07, 0.3, 12, 12] },
  ];

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Head */}
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshPhysicalMaterial color="#0f172a" roughness={0.6} clearcoat={0.1} />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
        <meshPhysicalMaterial color="#0f172a" roughness={0.6} />
      </mesh>

      {/* Pelvis Core */}
      <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.15, 0.1, 16, 16]} />
        <meshPhysicalMaterial color="#0f172a" roughness={0.6} />
      </mesh>

      {/* Knees */}
      <mesh position={[0.11, -0.57, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshPhysicalMaterial color="#0f172a" roughness={0.6} />
      </mesh>
      <mesh position={[-0.11, -0.57, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshPhysicalMaterial color="#0f172a" roughness={0.6} />
      </mesh>

      {muscles.map((r, i) => (
        <MuscleNode
          key={i}
          region={r}
          onClick={onMuscleClick}
          hovered={hoveredMuscle === r.name}
          onHover={setHoveredMuscle}
        />
      ))}
    </group>
  );
}

// --- Tooltip & Legend --------------------------------------------------------

function TooltipOverlay({ muscle, engagement }: { muscle: string; engagement: number }) {
  const pct = Math.round(engagement * 100);
  const label = pct === 0 ? 'Not activated' : pct < 30 ? 'Light activation' : pct < 60 ? 'Moderate' : pct < 85 ? 'High activation' : 'Peak activation';
  const color = pct === 0 ? 'text-slate-400' : pct < 30 ? 'text-blue-400' : pct < 60 ? 'text-green-400' : pct < 85 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3 shadow-2xl text-center min-w-[160px]">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{muscle}</div>
        <div className={\	ext-2xl font-black tabular-nums \\}>{pct}%</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
        <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: \\%\, background: \linear-gradient(90deg, #3b82f6, \)\ }} />
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 pointer-events-none">
      <span className="text-[10px] text-slate-500 font-bold">LOW</span>
      <div className="h-2 w-24 rounded-full" style={{ background: 'linear-gradient(90deg, #2d6fbf, #20c0a5, #8de64c, #ffc000, #ff3319)' }} />
      <span className="text-[10px] text-slate-500 font-bold">HIGH</span>
    </div>
  );
}

function FallbackHeatmap({ engagement }: { engagement: Record<string, number> }) {
  const muscles = [
    { name: 'Quads', key: 'quads' }, { name: 'Glutes', key: 'glutes' },
    { name: 'Chest', key: 'chest' }, { name: 'Core', key: 'core' },
    { name: 'Shoulders', key: 'shoulders' }, { name: 'Calves', key: 'calves' },
  ];
  return (
    <div className="w-full grid grid-cols-3 gap-2 p-2">
      {muscles.map(m => {
        const pct = Math.round((engagement[m.key] ?? 0) * 100);
        return (
          <div key={m.key} className="flex flex-col items-center gap-1">
            <div className="text-xs text-slate-400 font-bold">{m.name}</div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-red-500 transition-all" style={{ width: \\%\ }} />
            </div>
            <div className="text-xs font-mono text-white">{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

// --- Main Export -------------------------------------------------------------

export default function Heatmap3D({ history }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{ name: string; engagement: number } | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  const engagement = useMemo(() => computeEngagement(history ?? []), [history]);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  if (!webglSupported) {
    return (
      <div className="w-full">
        <div className="text-center text-xs text-yellow-400 mb-2">WebGL not available ?" 2D mode</div>
        <FallbackHeatmap engagement={engagement} />
      </div>
    );
  }

  // Set frameloop to demand when not interacting to save performance?
  // Wait, we want subtle breathing when idle. But we can limit DPR to improve perf.
  return (
    <div className="w-full relative" style={{ height: '380px' }}>
      {tooltip && <TooltipOverlay muscle={tooltip.name} engagement={tooltip.engagement} />}
      {!isInteracting && !tooltip && (
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold tracking-widest z-10 pointer-events-none animate-pulse">
          DRAG TO ROTATE A SCROLL TO ZOOM A TAP MUSCLE FOR DETAILS
        </div>
      )}
      <Legend />

      <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center"><Skeleton className="w-32 h-64 rounded-full opacity-20" /><div className="absolute font-bold text-slate-400 text-xs tracking-widest animate-pulse">LOADING 3D...</div></div>}>
        <Canvas
          dpr={[1, Math.min(window.devicePixelRatio, 1.5)]} // Cap DPR at 1.5 to fix performance regression
          camera={{ position: [0, 0.2, 2.5], fov: 45 }}
          gl={{ antialias: true, powerPreference: 'low-power' }}
          style={{ background: 'transparent' }}
          shadows
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 4, 3]} intensity={1.5} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} />
          <directionalLight position={[-2, 2, -2]} intensity={0.5} />
          
          {/* Subtle rim light */}
          <spotLight position={[0, 0, -3]} intensity={2} color="#a3e635" distance={10} angle={0.8} penumbra={1} />
          
          <Environment preset="studio" />

          <HumanoidFigure
            engagement={engagement}
            onMuscleClick={(name: string, eng: number) => setTooltip(prev => (prev?.name === name ? null : { name, engagement: eng }))}
            isInteracting={isInteracting}
          />

          <ContactShadows position={[0, -1, 0]} opacity={0.6} scale={2} blur={2.5} far={2} />

          <OrbitControls
            enablePan={false}
            enableZoom
            enableDamping
            dampingFactor={0.05} // Momentum!
            minDistance={1.5}
            maxDistance={4.5}
            minPolarAngle={Math.PI * 0.15}
            maxPolarAngle={Math.PI * 0.85}
            onStart={() => setIsInteracting(true)}
            onEnd={() => setIsInteracting(false)}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
\

fs.writeFileSync('src/components/Heatmap3D.tsx', code);
