"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

function Frame({
  url,
  position,
  rotationSpeed,
  floatOffset,
}: {
  url: string;
  position: [number, number, number];
  rotationSpeed: number;
  floatOffset: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(url);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = position[1] + Math.sin(t * 0.4 + floatOffset) * 0.35;
    meshRef.current.rotation.y = Math.sin(t * rotationSpeed + floatOffset) * 0.25;
    meshRef.current.rotation.z = Math.cos(t * rotationSpeed * 0.6 + floatOffset) * 0.04;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[2.4, 3.0]} />
      <meshBasicMaterial map={texture} transparent opacity={0.92} toneMapped={false} />
    </mesh>
  );
}

interface FloatingFramesProps {
  photoUrls: string[];
}

export default function FloatingFrames({ photoUrls }: FloatingFramesProps) {
  const slots = useMemo(() => {
    const positions: [number, number, number][] = [
      [-4.2, 0.6, -3],
      [4.0, -0.8, -4.5],
      [-2.4, -1.6, -6],
      [2.6, 1.4, -5.5],
      [0, -2.4, -7.5],
    ];
    return positions.map((position, i) => ({
      position,
      url: photoUrls[i % Math.max(photoUrls.length, 1)],
      rotationSpeed: 0.15 + (i % 3) * 0.05,
      floatOffset: i * 1.3,
    }));
  }, [photoUrls]);

  if (photoUrls.length === 0) return null;

  return (
    <>
      {slots.map((slot, i) => (
        <Frame key={i} {...slot} />
      ))}
    </>
  );
}
