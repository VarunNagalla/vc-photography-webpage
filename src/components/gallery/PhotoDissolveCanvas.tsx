"use client";

// Split out from PhotoViewer.tsx: this file is the only place that touches
// @react-three/fiber / drei for the gallery viewer. It is loaded via
// next/dynamic(..., { ssr: false }) from PhotoViewer.tsx, because
// @react-three/fiber's reconciler reaches into React internals
// (ReactCurrentBatchConfig) that only exist in a real browser renderer —
// importing it at module scope in a component that gets server-rendered
// (which "use client" components still are, for the initial HTML) crashes
// every route that mounts PhotoViewerProvider. Keeping it in its own
// ssr:false-loaded module is what the existing Hero3D/Hero3DLoader split
// already does for the same reason.

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform float uProgress;
  uniform vec2 uOrigin;
  uniform vec2 uResolution;
  uniform float uFromAspect;
  uniform float uToAspect;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  vec2 coverUv(vec2 uv, float screenAspect, float texAspect) {
    vec2 scale = screenAspect > texAspect
      ? vec2(texAspect / screenAspect, 1.0)
      : vec2(1.0, screenAspect / texAspect);
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    float screenAspect = uResolution.x / uResolution.y;
    vec2 fromUv = coverUv(vUv, screenAspect, uFromAspect);
    vec2 toUv = coverUv(vUv, screenAspect, uToAspect);

    vec4 fromColor = texture2D(uFrom, clamp(fromUv, 0.0, 1.0));
    vec4 toColor = texture2D(uTo, clamp(toUv, 0.0, 1.0));

    vec2 aspectCorrected = (vUv - uOrigin) * vec2(screenAspect, 1.0);
    float dist = length(aspectCorrected);

    float n = (hash(floor(vUv * 60.0)) - 0.5) * 0.12;
    float maxDist = length(vec2(screenAspect, 1.0)) * 1.05;
    float radius = uProgress * maxDist;

    float edge = smoothstep(radius - 0.08, radius + 0.02, dist + n);
    vec3 color = mix(toColor.rgb, fromColor.rgb, edge);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function DissolvePlane({
  url,
  progressRef,
  origin,
}: {
  url: string;
  progressRef: { v: number };
  origin: { x: number; y: number };
}) {
  const texture = useTexture(url);
  const { viewport, size } = useThree();
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const aspect = useMemo(() => {
    const img = texture.image as { width?: number; height?: number } | undefined;
    return img?.width && img?.height ? img.width / img.height : 1;
  }, [texture]);

  useFrame(() => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uProgress.value = progressRef.v;
    mat.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uFrom: { value: texture },
          uTo: { value: texture },
          uProgress: { value: 0 },
          uOrigin: { value: new THREE.Vector2(origin.x, origin.y) },
          uResolution: { value: new THREE.Vector2(size.width, size.height) },
          uFromAspect: { value: aspect },
          uToAspect: { value: aspect },
        }}
      />
    </mesh>
  );
}

/**
 * Fullscreen WebGL canvas that plays a noise-edged radial dissolve,
 * expanding outward from the clicked point on open and collapsing back
 * toward it on close. Purely a transition effect layered over the real
 * DOM content underneath/after it — never the only way to see a photo.
 */
export default function PhotoDissolveCanvas({
  url,
  origin,
  reverse,
  onDone,
}: {
  url: string;
  origin: { x: number; y: number };
  reverse: boolean;
  onDone: () => void;
}) {
  const progressRef = useRef({ v: reverse ? 1 : 0 });

  useEffect(() => {
    const tween = gsap.to(progressRef.current, {
      v: reverse ? 0 : 1,
      duration: 0.95,
      ease: "power3.inOut",
      onComplete: onDone,
    });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reverse, url]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[65]">
      <Canvas orthographic camera={{ zoom: 1, position: [0, 0, 1] }} gl={{ antialias: true, alpha: false }}>
        <DissolvePlane url={url} progressRef={progressRef.current} origin={origin} />
      </Canvas>
    </div>
  );
}
