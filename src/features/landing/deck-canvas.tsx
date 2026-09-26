"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, type RefObject } from "react";
import * as THREE from "three";
import { DeckPanels } from "./deck-panels";
import { Particles } from "./particles";

/** Gentle camera parallax that follows the pointer. */
function CameraRig() {
  useFrame(({ camera, pointer }, delta) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.6, 3, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.35 + pointer.y * 0.3, 3, delta);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/**
 * The hero's WebGL scene (three.js via React Three Fiber). Loaded with
 * `next/dynamic` (no SSR) so the landing page's HTML ships without it.
 */
export default function DeckCanvas({ progress, active, wide }: { progress: RefObject<number>; active: boolean; wide: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.35, wide ? 8.6 : 10], fov: 35 }}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <pointLight position={[-4, -2, 3]} color="#3b82f6" intensity={25} />
      <Suspense fallback={null}>
        <DeckPanels progress={progress} wide={wide} />
      </Suspense>
      <Particles count={wide ? 1400 : 600} />
      <CameraRig />
    </Canvas>
  );
}
