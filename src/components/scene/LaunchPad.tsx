"use client";
// Owner: P1. Ground, pad slab and a simple service tower scaled to the rocket.

interface Props {
  rocketHeight_m: number;
  rocketDiameter_m: number;
}

export default function LaunchPad({ rocketHeight_m, rocketDiameter_m }: Props) {
  const towerHeight = rocketHeight_m * 1.08;
  const towerWidth = Math.max(rocketDiameter_m * 0.9, 2.5);
  const towerX = rocketDiameter_m / 2 + towerWidth / 2 + rocketDiameter_m * 0.6;
  const padSize = Math.max(rocketDiameter_m * 6, 24);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[padSize * 6, 64]} />
        <meshStandardMaterial color="#0b0b0c" roughness={1} />
      </mesh>
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <boxGeometry args={[padSize, 1.2, padSize]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.9} />
      </mesh>
      <group position={[towerX, towerHeight / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[towerWidth, towerHeight, towerWidth]} />
          <meshStandardMaterial color="#5a1a14" metalness={0.4} roughness={0.7} wireframe />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[towerWidth * 0.15, towerHeight, towerWidth * 0.15]} />
          <meshStandardMaterial color="#7a2a20" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}
