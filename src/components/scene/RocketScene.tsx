"use client";
// Owner: P1. Canvas, lighting, orbit camera, pad and the rocket stack.
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import LaunchPad from "./LaunchPad";
import Stack, { useStackLayout } from "./Stack";

const FOV = 40;

export default function RocketScene() {
  const layout = useStackLayout();
  const height = layout.totalHeight_m;
  const baseDiameter = layout.stages[0]?.diameter_m ?? layout.fairing.diameter_m;
  // Distance that fits the whole rocket in view, with some breathing room.
  const distance = (height / 2 / Math.tan(((FOV / 2) * Math.PI) / 180)) * 1.25;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: FOV, near: 0.5, far: distance * 20, position: [distance * 0.55, height * 0.55, distance * 0.83] }}
    >
      <color attach="background" args={["#050506"]} />
      <fog attach="fog" args={["#050506", distance * 1.5, distance * 5]} />

      <hemisphereLight args={["#dfe6ff", "#0a0a0a", 0.35]} />
      <directionalLight
        position={[height * 0.6, height * 1.2, height * 0.5]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-height}
        shadow-camera-right={height}
        shadow-camera-top={height * 1.5}
        shadow-camera-bottom={-height * 0.2}
        shadow-camera-far={height * 4}
      />
      <directionalLight position={[-height, height * 0.4, -height * 0.8]} intensity={0.9} color="#7aa2ff" />
      <pointLight position={[0, 1, baseDiameter * 2]} intensity={height * 0.6} distance={height * 0.6} color="#ffb070" />

      <Stack layout={layout} />
      <LaunchPad rocketHeight_m={height} rocketDiameter_m={baseDiameter} />

      <OrbitControls
        target={[0, height * 0.45, 0]}
        enablePan={false}
        minDistance={baseDiameter * 3}
        maxDistance={distance * 2.5}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  );
}
