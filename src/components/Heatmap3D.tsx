import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { WorkoutSession } from '../lib/achievements';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MuscleRegion {
  name: string;
  engagement: number; // 0–1
  position: [number, number, number];
  size: [number, number, number];
  rx?: number; // rotation x
  rz?: number; // rotation z
}

interface HeatmapProps {
  history: WorkoutSession[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map exercise history → per-muscle engagement scores (0–1) */
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

/** Cool-blue → green → yellow → hot-red heatmap gradient */
function engagementColor(t: number): THREE.Color {
  // t = 0 (inactive) → cool; t = 1 (max) → hot
  if (t <= 0.01) return new THREE.Color('#1e293b'); // resting dark
  const stops: Array<{ t: number; c: [number, number, number] }> = [
    { t: 0.0,  c: [0.18, 0.45, 0.80] }, // steel-blue
    { t: 0.25, c: [0.20, 0.75, 0.65] }, // teal
    { t: 0.50, c: [0.55, 0.90, 0.30] }, // lime
    { t: 0.75, c: [1.00, 0.75, 0.00] }, // amber
    { t: 1.0,  c: [1.00, 0.20, 0.10] }, // red
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

// ─── Muscle Block ─────────────────────────────────────────────────────────────

interface MuscleBlockProps {
  region: MuscleRegion;
  onClick: (name: string, eng: number) => void;
  hovered: boolean;
  onHover: (name: string | null) => void;
}

function MuscleBlock({ region, onClick, hovered, onHover }: MuscleBlockProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const color = useMemo(() => engagementColor(region.engagement), [region.engagement]);
  const emissive = useMemo(
    () => engagementColor(region.engagement).multiplyScalar(hovered ? 0.6 : 0.25),
    [region.engagement, hovered],
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    // subtle pulse on hover
    const scale = hovered ? 1.06 : 1.0;
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, scale, 1 - Math.exp(-8 * delta)));
  });

  return (
    <mesh
      ref={ref}
      position={region.position}
      rotation={[region.rx ?? 0, 0, region.rz ?? 0]}
      onClick={(e) => { e.stopPropagation(); onClick(region.name, region.engagement); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(region.name); }}
      onPointerOut={() => onHover(null)}
    >
      <boxGeometry args={region.size} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        roughness={0.35}
        metalness={0.55}
        transparent
        opacity={region.engagement <= 0.01 ? 0.25 : 0.82}
      />
    </mesh>
  );
}

// ─── Wireframe Skeleton Bone ──────────────────────────────────────────────────

function Bone({ from, to }: { from: THREE.Vector3; to: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null!);
  const dir = new THREE.Vector3().subVectors(to, from);
  const length = dir.length();
  const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());

  return (
    <mesh ref={ref} position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[0.02, 0.02, length, 6]} />
      <meshStandardMaterial color="#334155" emissive="#1e3a5f" emissiveIntensity={0.4} roughness={0.8} />
    </mesh>
  );
}

// ─── Full Humanoid Scene ──────────────────────────────────────────────────────

function HumanoidFigure({
  engagement,
  onMuscleClick,
  isInteracting,
  setIsInteracting,
}: {
  engagement: Record<string, number>;
  onMuscleClick: (name: string, eng: number) => void;
  isInteracting: boolean;
  setIsInteracting: (v: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  // Auto-rotate when not interacting
  useFrame((_, delta) => {
    if (!groupRef.current || isInteracting) return;
    groupRef.current.rotation.y += delta * 0.4;
  });

  const muscles: MuscleRegion[] = [
    // ── Torso ─────────────────────────────────────────────────────────────
    { name: 'chest',     engagement: engagement.chest     ?? 0, position: [0, 0.55, 0.1],       size: [0.48, 0.32, 0.22] },
    { name: 'core',      engagement: engagement.core      ?? 0, position: [0, 0.18, 0.08],      size: [0.42, 0.30, 0.20] },
    { name: 'lats',      engagement: engagement.lats      ?? 0, position: [0, 0.50, -0.08],     size: [0.54, 0.30, 0.18] },
    { name: 'traps',     engagement: engagement.traps     ?? 0, position: [0, 0.86, -0.06],     size: [0.44, 0.18, 0.14] },
    // ── Shoulders ─────────────────────────────────────────────────────────
    { name: 'shoulders', engagement: engagement.shoulders ?? 0, position: [0.34, 0.72, 0],      size: [0.18, 0.18, 0.18] },
    { name: 'shoulders', engagement: engagement.shoulders ?? 0, position: [-0.34, 0.72, 0],     size: [0.18, 0.18, 0.18] },
    // ── Arms ──────────────────────────────────────────────────────────────
    { name: 'biceps',    engagement: engagement.biceps    ?? 0, position: [0.38, 0.44, 0.04],   size: [0.14, 0.28, 0.14] },
    { name: 'biceps',    engagement: engagement.biceps    ?? 0, position: [-0.38, 0.44, 0.04],  size: [0.14, 0.28, 0.14] },
    { name: 'triceps',   engagement: engagement.triceps   ?? 0, position: [0.38, 0.44, -0.05],  size: [0.13, 0.26, 0.12] },
    { name: 'triceps',   engagement: engagement.triceps   ?? 0, position: [-0.38, 0.44, -0.05], size: [0.13, 0.26, 0.12] },
    // ── Forearms ──────────────────────────────────────────────────────────
    { name: 'forearms',  engagement: 0.1,                       position: [0.40, 0.16, 0],      size: [0.12, 0.26, 0.12] },
    { name: 'forearms',  engagement: 0.1,                       position: [-0.40, 0.16, 0],     size: [0.12, 0.26, 0.12] },
    // ── Legs ──────────────────────────────────────────────────────────────
    { name: 'glutes',    engagement: engagement.glutes     ?? 0, position: [0, -0.14, -0.10],   size: [0.44, 0.20, 0.22] },
    { name: 'quads',     engagement: engagement.quads      ?? 0, position: [0.14, -0.50, 0.06], size: [0.20, 0.40, 0.20] },
    { name: 'quads',     engagement: engagement.quads      ?? 0, position: [-0.14, -0.50, 0.06],size: [0.20, 0.40, 0.20] },
    { name: 'hamstrings',engagement: engagement.hamstrings ?? 0, position: [0.14, -0.50, -0.08],size: [0.19, 0.38, 0.16] },
    { name: 'hamstrings',engagement: engagement.hamstrings ?? 0, position: [-0.14, -0.50, -0.08],size: [0.19, 0.38, 0.16] },
    { name: 'calves',    engagement: engagement.calves     ?? 0, position: [0.13, -0.92, -0.02],size: [0.15, 0.36, 0.16] },
    { name: 'calves',    engagement: engagement.calves     ?? 0, position: [-0.13, -0.92, -0.02],size: [0.15, 0.36, 0.16] },
  ];

  // Skeleton wire bones
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const bones: [THREE.Vector3, THREE.Vector3][] = [
    [v(0, 1.1, 0), v(0, 0.72, 0)],  // spine top
    [v(0, 0.72, 0), v(0, 0, 0)],    // spine mid
    [v(0, 0.72, 0), v(0.34, 0.72, 0)], // R shoulder
    [v(0, 0.72, 0), v(-0.34, 0.72, 0)], // L shoulder
    [v(0.34, 0.72, 0), v(0.38, 0.44, 0)], // R upper arm
    [v(-0.34, 0.72, 0), v(-0.38, 0.44, 0)], // L upper arm
    [v(0.38, 0.44, 0), v(0.40, 0.16, 0)], // R lower arm
    [v(-0.38, 0.44, 0), v(-0.40, 0.16, 0)], // L lower arm
    [v(0, 0, 0), v(0.14, -0.30, 0)], // R hip
    [v(0, 0, 0), v(-0.14, -0.30, 0)], // L hip
    [v(0.14, -0.30, 0), v(0.13, -0.70, 0)], // R thigh
    [v(-0.14, -0.30, 0), v(-0.13, -0.70, 0)], // L thigh
    [v(0.13, -0.70, 0), v(0.13, -1.10, 0)], // R shin
    [v(-0.13, -0.70, 0), v(-0.13, -1.10, 0)], // L shin
  ];

  return (
    <group
      ref={groupRef}
      onPointerDown={() => setIsInteracting(true)}
    >
      {/* Head */}
      <mesh position={[0, 1.18, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial color="#1e293b" emissive="#1e3a5f" emissiveIntensity={0.5} roughness={0.6} />
      </mesh>

      {/* Skeleton bones */}
      {bones.map(([from, to], i) => <Bone key={i} from={from} to={to} />)}

      {/* Muscle blocks */}
      {muscles.map((r, i) => (
        <MuscleBlock
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

// ─── Tooltip Overlay ──────────────────────────────────────────────────────────

function TooltipOverlay({
  muscle,
  engagement,
}: {
  muscle: string;
  engagement: number;
}) {
  const pct = Math.round(engagement * 100);
  const label = pct === 0 ? 'Not activated' : pct < 30 ? 'Light activation' : pct < 60 ? 'Moderate' : pct < 85 ? 'High activation' : 'Peak activation';
  const color = pct === 0 ? 'text-slate-400' : pct < 30 ? 'text-blue-400' : pct < 60 ? 'text-green-400' : pct < 85 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
    >
      <div className="bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3 shadow-2xl text-center min-w-[160px]">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{muscle}</div>
        <div className={`text-2xl font-black tabular-nums ${color}`}>{pct}%</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
        <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, #3b82f6, ${pct > 75 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e'})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 pointer-events-none">
      <span className="text-[10px] text-slate-500 font-bold">LOW</span>
      <div
        className="h-2 w-24 rounded-full"
        style={{ background: 'linear-gradient(90deg, #2d6fbf, #20c0a5, #8de64c, #ffc000, #ff3319)' }}
      />
      <span className="text-[10px] text-slate-500 font-bold">HIGH</span>
    </div>
  );
}

// ─── WebGL Fallback ───────────────────────────────────────────────────────────

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
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-red-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs font-mono text-white">{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Heatmap3D({ history }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{ name: string; engagement: number } | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const interactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const engagement = useMemo(() => computeEngagement(history ?? []), [history]);

  useEffect(() => {
    // WebGL detection
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  const handlePointerUp = () => {
    if (interactTimerRef.current) clearTimeout(interactTimerRef.current);
    interactTimerRef.current = setTimeout(() => setIsInteracting(false), 1500);
  };

  const handleMuscleClick = (name: string, eng: number) => {
    setTooltip(prev => (prev?.name === name ? null : { name, engagement: eng }));
  };

  if (!webglSupported) {
    return (
      <div className="w-full">
        <div className="text-center text-xs text-yellow-400 mb-2">WebGL not available — 2D mode</div>
        <FallbackHeatmap engagement={engagement} />
      </div>
    );
  }

  return (
    <div
      className="w-full relative"
      style={{ height: '380px' }}
      onPointerUp={handlePointerUp}
    >
      {/* Tooltip */}
      {tooltip && (
        <TooltipOverlay
          muscle={tooltip.name}
          engagement={tooltip.engagement}
        />
      )}

      {/* Hint */}
      {!isInteracting && !tooltip && (
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold tracking-widest z-10 pointer-events-none animate-pulse">
          DRAG TO ROTATE · SCROLL TO ZOOM · TAP MUSCLE FOR DETAILS
        </div>
      )}

      <Legend />

      <Canvas
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}
        camera={{ position: [0, 0.1, 2.8], fov: 45 }}
        gl={{ antialias: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 4, 3]} intensity={1.2} castShadow={false} />
        <directionalLight position={[-2, 2, -2]} intensity={0.4} />
        <pointLight position={[0, 2, 2]} intensity={0.6} color="#4f9eff" />

        <HumanoidFigure
          engagement={engagement}
          onMuscleClick={handleMuscleClick}
          isInteracting={isInteracting}
          setIsInteracting={setIsInteracting}
        />

        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={1.8}
          maxDistance={5}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.85}
          onStart={() => { setIsInteracting(true); if (interactTimerRef.current) clearTimeout(interactTimerRef.current); }}
          onEnd={() => { interactTimerRef.current = setTimeout(() => setIsInteracting(false), 1500); }}
        />
      </Canvas>
    </div>
  );
}
