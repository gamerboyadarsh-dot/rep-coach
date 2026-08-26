import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { WorkoutSession } from '../lib/achievements';
import { SkeletonBlock } from './Skeleton';

interface MuscleRegion {
  name: string;
  engagement: number;
  position: [number, number, number];
  radius: number;
}

interface HeatmapProps {
  history: WorkoutSession[];
}

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
    const intensity = (reps / 100) * 0.6 + 0.4;
    for (const [muscle, weight] of Object.entries(weights)) {
      counts[muscle] = Math.min(1, (counts[muscle] ?? 0) + weight * intensity * 0.35);
    }
  }
  return counts;
}


function engagementColor(t: number): THREE.Color {
  if (t <= 0.01) return new THREE.Color('#0f172a');
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


function AnatomicalFigure({ engagement, onMuscleClick, isInteracting }: { engagement: Record<string, number>, onMuscleClick: any, isInteracting: boolean }) {
  const { scene } = useGLTF('/male_base_mesh.glb');
  const groupRef = useRef<THREE.Group>(null!);

  const rotation: [number, number, number] = [0, -Math.PI / 2, 0];

  const muscles: MuscleRegion[] = useMemo(() => [
    { name: 'chest', engagement: engagement.chest ?? 0, position: [0, 0.45, 0.12], radius: 0.18 },
    { name: 'core', engagement: engagement.core ?? 0, position: [0, 0.15, 0.11], radius: 0.18 },
    { name: 'lats', engagement: engagement.lats ?? 0, position: [0, 0.45, -0.1], radius: 0.22 },
    { name: 'traps', engagement: engagement.traps ?? 0, position: [0, 0.65, -0.06], radius: 0.15 },
    { name: 'shoulders', engagement: engagement.shoulders ?? 0, position: [0.26, 0.58, 0], radius: 0.12 },
    { name: 'shoulders', engagement: engagement.shoulders ?? 0, position: [-0.26, 0.58, 0], radius: 0.12 },
    { name: 'biceps', engagement: engagement.biceps ?? 0, position: [0.3, 0.35, 0.04], radius: 0.12 },
    { name: 'biceps', engagement: engagement.biceps ?? 0, position: [-0.3, 0.35, 0.04], radius: 0.12 },
    { name: 'triceps', engagement: engagement.triceps ?? 0, position: [0.3, 0.35, -0.04], radius: 0.12 },
    { name: 'triceps', engagement: engagement.triceps ?? 0, position: [-0.3, 0.35, -0.04], radius: 0.12 },
    { name: 'forearms', engagement: 0, position: [0.35, 0.1, 0], radius: 0.1 },
    { name: 'forearms', engagement: 0, position: [-0.35, 0.1, 0], radius: 0.1 },
    { name: 'glutes', engagement: engagement.glutes ?? 0, position: [0, -0.05, -0.12], radius: 0.2 },
    { name: 'quads', engagement: engagement.quads ?? 0, position: [0.12, -0.4, 0.08], radius: 0.18 },
    { name: 'quads', engagement: engagement.quads ?? 0, position: [-0.12, -0.4, 0.08], radius: 0.18 },
    { name: 'hamstrings', engagement: engagement.hamstrings ?? 0, position: [0.12, -0.4, -0.08], radius: 0.16 },
    { name: 'hamstrings', engagement: engagement.hamstrings ?? 0, position: [-0.12, -0.4, -0.08], radius: 0.16 },
    { name: 'calves', engagement: engagement.calves ?? 0, position: [0.12, -0.8, -0.04], radius: 0.12 },
    { name: 'calves', engagement: engagement.calves ?? 0, position: [-0.12, -0.8, -0.04], radius: 0.12 },
  ], [engagement]);

  const skinMaterial = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#1e293b'),
      roughness: 0.5,
      metalness: 0.1,
      clearcoat: 0.2,
      clearcoatRoughness: 0.3,
    });

    mat.onBeforeCompile = (shader) => {
      const posArray = muscles.map(m => new THREE.Vector3(...m.position));
      const engArray = muscles.map(m => m.engagement);
      const colArray = muscles.map(m => engagementColor(m.engagement));
      const radArray = muscles.map(m => m.radius);
      
      while(posArray.length < 20) {
        posArray.push(new THREE.Vector3(0,0,0));
        engArray.push(0);
        colArray.push(new THREE.Color(0,0,0));
        radArray.push(0);
      }

      shader.uniforms.uMusclePos = { value: posArray };
      shader.uniforms.uMuscleEng = { value: engArray };
      shader.uniforms.uMuscleColor = { value: colArray };
      shader.uniforms.uMuscleRadius = { value: radArray };
      shader.uniforms.uMuscleCount = { value: muscles.length };
      
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>\n        varying vec3 vWorldPos;`
      ).replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>\n        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>\n        varying vec3 vWorldPos;\n        uniform vec3 uMusclePos[20];\n        uniform float uMuscleEng[20];\n        uniform vec3 uMuscleColor[20];\n        uniform float uMuscleRadius[20];\n        uniform int uMuscleCount;`
      ).replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>\n        vec3 glow = vec3(0.0);\n        for(int i=0; i<20; i++) {\n           if (i >= uMuscleCount) break;\n           float dist = length(vWorldPos - uMusclePos[i]);\n           float intensity = smoothstep(uMuscleRadius[i], uMuscleRadius[i] * 0.2, dist) * uMuscleEng[i];\n           glow += uMuscleColor[i] * intensity * 2.5;\n        }\n        totalEmissiveRadiance += glow;`
      );
    };
    return mat;
  }, [muscles]);


  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = skinMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, skinMaterial]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    if (!isInteracting) {
      groupRef.current.rotation.y += delta * 0.2;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.015;
      const breathScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.01;
      groupRef.current.scale.set(1, breathScale, 1 + (breathScale-1)*1.5);
    } else {
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, 1, 0.1));
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.1, 0]}>
      <primitive object={scene} rotation={rotation} />
      {muscles.map((r, i) => (
        <mesh
          key={i}
          position={r.position}
          visible={true}
          onClick={(e) => { e.stopPropagation(); onMuscleClick(r.name, r.engagement); }}
          onPointerOver={(e) => { e.stopPropagation(); }}
          onPointerOut={(e) => { e.stopPropagation(); }}
        >
          <sphereGeometry args={[r.radius, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthTest={true} />
        </mesh>
      ))}
    </group>
  );
}


function TooltipOverlay({ muscle, engagement }: { muscle: string; engagement: number }) {
  const pct = Math.round(engagement * 100);
  const label = pct === 0 ? 'Not activated' : pct < 30 ? 'Light activation' : pct < 60 ? 'Moderate' : pct < 85 ? 'High activation' : 'Peak activation';
  const color = pct === 0 ? 'text-slate-400' : pct < 30 ? 'text-blue-400' : pct < 60 ? 'text-green-400' : pct < 85 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-2l px-5 py-3 shadow-22l text-center min-w-[160px]">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{muscle}</div>
        <div className={`text-2xl font-black tabular-nums ${color}`}>{pct}%</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
        <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #3b82f6, ${pct > 75 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e'})` }} />
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
              <div className="h-full rounded-full bg-gradient-to-r from-lime-500 to-red-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs font-mono text-white">{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}


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
        <div className="text-center text-xs text-yellow-400 mb-2">WebGL not available -- 2D mode</div>
        <FallbackHeatmap engagement={engagement} />
      </div>
    );
  }

  return (
    <div className="w-full relative" style={{ height: '380px' }}>
      {tooltip && <TooltipOverlay muscle={tooltip.name} engagement={tooltip.engagement} />}
      {!isInteracting && !tooltip && (
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold tracking-widest z-10 pointer-events-none animate-pulse">
          DRAG TO ROTATE - SCROLL TO ZOOM - TAP MUSCLE FOR DETAILS
        </div>
      )}
      <Legend />

      <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center"><SkeletonBlock className="w-32 h-64 rounded-full opacity-20" /><div className="absolute font-bold text-slate-400 text-xs tracking-widest animate-pulse">LOADING ANATOMY...</div></div>}>
        <Canvas
          dpr={[1, Math.min(window.devicePixelRatio || 1, 1.5)]}
          camera={{ position: [0, 0.2, 2.5], fov: 45 }}
          gl={{ antialias: true, powerPreference: 'low-power' }}
          style={{ background: 'transparent' }}
          shadows
          frameloop="demand"
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 4, 3]} intensity={1.2} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} />
          <directionalLight position={[-2, 2, -2]} intensity={0.4} />
          <spotLight position={[0, 0, -3]} intensity={1.5} color="#a3e635" distance={10} angle={0.8} penumbra={1} />
          
          <Environment preset="studio" />

          <AnatomicalFigure
            engagement={engagement}
            onMuscleClick={(name: string, eng: number) => setTooltip(prev => (prev?.name === name ? null : { name, engagement: eng }))}
            isInteracting={isInteracting}
          />

          <ContactShadows position={[0, -1, 0]} opacity={0.6} scale={2} blur={2.5} far={2} />

          <OrbitControls
            enablePan={false}
            enableZoom
            enableDamping
            dampingFactor={0.05}
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

useGLTF.preload('/male_base_mesh.glb');
