/**
 * Pure maths for the hero deck animation, so the scene component stays
 * declarative (and this stays testable). `p` is scroll progress 0 → 1:
 * fanned arc → stacked deck → first slide presented full-size.
 */

export interface PanelPose {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  opacity: number;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Smooth 0→1 between `a` and `b`. */
export const ease = (x: number, a: number, b: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: number[], b: number[], t: number) => a.map((v, k) => mix(v, b[k], t)) as [number, number, number];

function fan(i: number, n: number, wide: boolean) {
  const k = i - (n - 1) / 2;
  const angle = k * (wide ? 0.34 : 0.22);
  const radius = wide ? 7 : 4.6;
  // On wide screens the arc sits right of the headline so the text stays readable.
  const shift = wide ? 2.3 : 0;
  return {
    position: [Math.sin(angle) * radius + shift, Math.abs(k) * -0.12 + (wide ? 0.1 : 0.9), -Math.cos(angle) * radius + radius - 1.6 - Math.abs(k) * 0.15],
    rotation: [0, -angle - (wide ? 0.18 : 0), k * -0.02],
  };
}

function stack(i: number) {
  return { position: [0.6, -0.15 + i * 0.09, -0.6 - i * 0.2], rotation: [-0.42, -0.5, -0.06] };
}

/** Pose of panel `i` of `n` at progress `p` (idle float is added by the scene). */
export function panelPose(i: number, n: number, p: number, wide = true): PanelPose {
  const f = fan(i, n, wide);
  const s = stack(i);
  const toStack = ease(p, 0.08, 0.5);
  let position = mix3(f.position, s.position, toStack);
  let rotation = mix3(f.rotation, s.rotation, toStack);
  let scale = 1;
  let opacity = 1;
  const present = ease(p, 0.55, 0.92);
  if (i === 0) {
    position = mix3(position, [0, 0.25, 1.4], present);
    rotation = mix3(rotation, [0, 0, 0], present);
    scale = mix(1, wide ? 1.4 : 0.72, present);
  } else {
    position = mix3(position, [s.position[0] + 0.4, s.position[1] - 1.2, s.position[2] - 1.5], present);
    opacity = 1 - present * 0.85;
  }
  return { position, rotation, scale, opacity };
}

/** Which caption to show for progress `p`. */
export const captionIndex = (p: number) => (p < 0.3 ? 0 : p < 0.62 ? 1 : 2);
