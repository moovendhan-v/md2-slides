"use client";

import { RoundedBox, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { ease, panelPose } from "./choreography";

import { SLIDE_TEXTURES } from "./slide-textures";
const W = 3.2;
const H = 1.8;

/** Soft radial falloff used for the accent halo behind each panel. */
function useHaloTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 8, 64, 64, 64);
    // Many stops for a smooth falloff (fewer visible bands at low opacity).
    for (let k = 0; k <= 16; k++) r.addColorStop(k / 16, `rgba(255,255,255,${(1 - k / 16) ** 2})`);
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
}

function Panel({ index, count, texture, halo, progress, wide }: { index: number; count: number; texture: THREE.Texture; halo: THREE.Texture; progress: RefObject<number>; wide: boolean }) {
  const group = useRef<THREE.Group>(null);
  const face = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const frame = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current ?? 0;
    const pose = panelPose(index, count, p, wide);
    const idle = 1 - ease(p, 0.5, 0.9);
    const t = clock.elapsedTime;
    const d = (a: number, b: number) => THREE.MathUtils.damp(a, b, 6, delta);
    g.position.set(d(g.position.x, pose.position[0]), d(g.position.y, pose.position[1] + Math.sin(t * 0.8 + index * 1.3) * 0.05 * idle), d(g.position.z, pose.position[2]));
    g.rotation.set(d(g.rotation.x, pose.rotation[0] + Math.sin(t * 0.5 + index) * 0.015 * idle), d(g.rotation.y, pose.rotation[1]), d(g.rotation.z, pose.rotation[2]));
    g.scale.setScalar(d(g.scale.x, pose.scale));
    for (const m of [face.current, frame.current]) if (m) m.opacity = d(m.opacity, pose.opacity);
    if (glow.current) glow.current.opacity = d(glow.current.opacity, 0.16 + 0.12 * ease(p, 0.55, 0.92));
  });

  return (
    <group ref={group} renderOrder={count - index}>
      {/* soft accent halo behind the slide */}
      {index === 0 && wide && (
        <mesh position={[0, -0.05, -0.08]}>
          <planeGeometry args={[W * 1.35, H * 1.55]} />
          <meshBasicMaterial ref={glow} color="#3b82f6" alphaMap={halo} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
      <RoundedBox args={[W + 0.08, H + 0.08, 0.06]} radius={0.05} smoothness={4} position={[0, 0, -0.035]}>
        <meshPhysicalMaterial ref={frame} color="#131316" roughness={0.35} metalness={0.3} clearcoat={0.6} transparent />
      </RoundedBox>
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial ref={face} map={texture} toneMapped={false} transparent />
      </mesh>
    </group>
  );
}

/** The rendered md2slides slides as 3D panels, driven by scroll progress. */
export function DeckPanels({ progress, wide }: { progress: RefObject<number>; wide: boolean }) {
  const textures = useTexture(SLIDE_TEXTURES);
  const halo = useHaloTexture();
  useMemo(() => {
    for (const t of textures) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    }
  }, [textures]);
  const shown = wide ? textures : textures.slice(0, 4);
  return (
    <>
      {shown.map((t, i) => (
        <Panel key={i} index={i} count={shown.length} texture={t} halo={halo} progress={progress} wide={wide} />
      ))}
    </>
  );
}
