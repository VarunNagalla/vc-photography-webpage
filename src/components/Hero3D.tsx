"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import ParticleField from "./three/ParticleField";
import FloatingFrames from "./three/FloatingFrames";

function CameraRig() {
  const { camera, pointer } = useThree();
  useFrame(() => {
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.02;
    camera.position.y += (pointer.y * 0.35 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, -4);
  });
  return null;
}

export default function Hero3D({ photoUrls = [] as string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 2], fov: 55 }}
        dpr={[1, 1.6]}
      >
        <color attach="background" args={["#00000000"]} />
        <fog attach="fog" args={["#0a0a0a", 4, 14]} />
        <ambientLight intensity={0.6} />
        <CameraRig />
        <ParticleField />
        <Suspense fallback={null}>
          <FloatingFrames photoUrls={photoUrls} />
        </Suspense>
      </Canvas>
    </div>
  );
}
