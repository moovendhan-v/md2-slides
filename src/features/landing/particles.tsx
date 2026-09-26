"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/** A slow-drifting field of points (a grid of "pixels") behind the deck. */
export function Particles({ count = 1400 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    // Deterministic pseudo-random so server/client and reloads look the same.
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = rnd() * 14;
      pos[i * 3 + 1] = rnd() * 6 - 1;
      pos[i * 3 + 2] = -3 - Math.abs(rnd()) * 8;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.015;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial size={0.035} color="#60a5fa" transparent opacity={0.45} sizeAttenuation depthWrite={false} />
    </points>
  );
}
