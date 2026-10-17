"use client";
// Owner: P1. Phase 0: spinning cube to prove R3F renders locally and on Vercel.
// Phase 1 replaces the cube with the procedural rocket stack.
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Mesh } from "three";

function SpinningCube() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.5;
    ref.current.rotation.y += delta * 0.8;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#e5e5e5" metalness={0.3} roughness={0.4} />
    </mesh>
  );
}

export default function RocketScene() {
  return (
    <Canvas camera={{ position: [3, 2, 4], fov: 50 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <SpinningCube />
      <OrbitControls enablePan={false} />
    </Canvas>
  );
}
