import { Canvas } from '@react-three/fiber';

export default function Heatmap3D() {
  return (
    <div className="w-full h-64 bg-slate-900 rounded-xl flex items-center justify-center">
      {/* 3D Canvas will go here in Phase 6 */}
      <Canvas>
        <ambientLight />
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      </Canvas>
    </div>
  );
}
