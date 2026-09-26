/* eslint-disable @next/next/no-img-element -- static slide renders, already sized */
import { SLIDE_TEXTURES } from "./slide-textures";

/** Motion-free hero art (reduced motion or no WebGL): three slides fanned with CSS 3D. */
export function FallbackDeck() {
  const fan = [
    { src: SLIDE_TEXTURES[1], style: "rotateY(28deg) translateX(-38%) translateZ(-120px)" },
    { src: SLIDE_TEXTURES[2], style: "rotateY(-28deg) translateX(38%) translateZ(-120px)" },
    { src: SLIDE_TEXTURES[0], style: "translateZ(40px)" },
  ];
  return (
    <div className="absolute inset-0 flex items-start justify-center pt-24 [perspective:1400px] md:items-center md:justify-end md:pt-0 md:pr-[6vw]" aria-hidden>
      <div className="relative aspect-video w-[min(78vw,420px)] [transform-style:preserve-3d] [transform:rotateX(8deg)_rotateY(-14deg)] md:w-[min(42vw,620px)]">
        {fan.map((f) => (
          <img key={f.src} src={f.src} alt="" className="absolute inset-0 h-full w-full rounded-xl border border-zinc-800 shadow-[0_30px_80px_-20px_rgba(59,130,246,.35)]" style={{ transform: f.style }} />
        ))}
      </div>
    </div>
  );
}
