/* global SCENES_MOTION */
/**
 * Frame-accurate compositor. Everything on screen is a pure function of the
 * time `t` (seconds): render.mjs calls STAGE.render(t) for each frame and
 * screenshots the result. No CSS animations or timers are used.
 */
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = {
    io: (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2),
    out: (k) => 1 - (1 - k) ** 3,
    back: (k) => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2,
  };
  const lerp = (a, b, k) => a + (b - a) * k;
  const $ = (sel) => document.querySelector(sel);

  let D; // timeline data from render.mjs
  let W, H;
  const pending = new Set();

  /** Sets an <img> src and remembers to wait for it to decode. */
  function setSrc(img, src) {
    if (img.dataset.src === src) return;
    img.dataset.src = src;
    img.src = src;
    pending.add(img.decode().catch(() => {}));
  }

  // ---------- Captions ----------
  /** Splits narration into caption chunks with word timings across the voice line. */
  function captionChunks(text, start, dur) {
    const sentences = text.match(/[^.?!]+[.?!]*\s*/g) ?? [text];
    const parts = [];
    for (const s of sentences) {
      if (s.length <= 64) parts.push(s.trim());
      else {
        // Break long sentences at commas, keeping pieces readable.
        let cur = "";
        for (const piece of s.split(/(?<=,)\s+/)) {
          if (cur && (cur + " " + piece).length > 64) {
            parts.push(cur.trim());
            cur = piece;
          } else cur = cur ? cur + " " + piece : piece;
        }
        if (cur.trim()) parts.push(cur.trim());
      }
    }
    const weight = (p) => p.replace(/\*/g, "").length + 6;
    const total = parts.reduce((n, p) => n + weight(p), 0);
    let at = start;
    return parts.map((p) => {
      const d = (weight(p) / total) * dur;
      const words = [];
      let em = false;
      let chars = 0;
      const plain = p.replace(/\*/g, "").length;
      for (const raw of p.split(/\s+/)) {
        const open = raw.startsWith("*");
        if (open) em = true;
        const word = raw.replace(/\*/g, "");
        words.push({ word, em, at: at + (chars / plain) * d * 0.92 });
        if (raw.endsWith("*") || raw.endsWith("*,") || raw.endsWith("*.")) em = false;
        chars += word.length + 1;
      }
      const chunk = { start: at, end: at + d, words };
      at += d;
      return chunk;
    });
  }

  let capKey = "";
  function renderCaptions(t) {
    const pill = $("#captions .pill");
    let chunk = null;
    let scene = null;
    for (const s of D.scenes) {
      if (!s.chunks) continue;
      for (const c of s.chunks) if (t >= c.start - 0.12 && t < c.end + (c === s.chunks.at(-1) ? 0.5 : 0)) [chunk, scene] = [c, s];
    }
    if (!chunk || D.noCaptions) {
      pill.style.opacity = 0;
      return;
    }
    const key = scene.id + chunk.start;
    if (key !== capKey) {
      capKey = key;
      pill.innerHTML = chunk.words.map((w) => `<span class="w${w.em ? " em" : ""}">${w.word}</span>`).join(" ");
    }
    [...pill.children].forEach((el, i) => el.classList.toggle("on", t >= chunk.words[i].at));
    const last = chunk === scene.chunks.at(-1);
    const inK = clamp((t - (chunk.start - 0.12)) / 0.18);
    const outK = last ? clamp((chunk.end + 0.5 - t) / 0.25) : 1;
    pill.style.opacity = Math.min(inK, outK);
    pill.style.transform = `translateY(${(1 - ease.out(inK)) * 12}px)`;
  }

  // ---------- Clip scenes: window + camera ----------
  function buildClip(layer, s) {
    const c = s.clip;
    const winW = D.portrait ? 1000 : 1500;
    const scale = winW / c.viewport.width;
    const bar = 40;
    s.geo = { winW, scale, bar, winH: c.viewport.height * scale + bar };
    layer.innerHTML = `<div class="cam"><div class="win" style="width:${winW}px">
      <div class="bar"><i style="background:#f87171"></i><i style="background:#fbbf24"></i><i style="background:#4ade80"></i>
      <span class="url"><i class="ph ph-lock-simple" style="width:auto;height:auto;background:none"></i>${s.url}</span></div>
      <img class="screen" alt="" /></div></div>`;
    s.cam = layer.querySelector(".cam");
    s.img = layer.querySelector(".screen");
    s.camSegs = cameraSegments(s);
  }

  /** Camera target for a focus rect (clip CSS px) or the whole screen. */
  function camTarget(s, cue) {
    const { viewport: vp } = s.clip;
    const { scale } = s.geo;
    if (!cue || !cue.rect) return { cx: vp.width / 2, cy: vp.height / 2, z: D.portrait ? 1.08 : 1 };
    const r = cue.rect;
    const viewW = D.portrait ? W * 0.94 : W * 0.86;
    const viewH = D.portrait ? H * 0.5 : H * 0.72;
    const cap = (cue.scale ?? 1.6) * (D.portrait ? 1.5 : 1);
    const z = Math.max(1, Math.min(cap, viewW / (r.w * scale), viewH / (r.h * scale)));
    return { cx: r.x + r.w / 2, cy: r.y + r.h / 2, z };
  }

  /** Camera moves as eased segments in scene-local seconds. */
  function cameraSegments(s) {
    const focus = s.clip.cues.filter((q) => q.type === "focus");
    const segs = [];
    let from = camTarget(s, null);
    // A cue in the first half-second frames the scene from the start (with a gentle push-in).
    if (focus[0] && s.localOf(focus[0].t) < 0.6) {
      const tgt = camTarget(s, focus.shift());
      from = { ...tgt, z: tgt.z * 0.9 };
      segs.push({ t: -0.3, d: 1.6, from, to: tgt });
      from = tgt;
    }
    for (const q of focus) {
      const t = s.localOf(q.t);
      const to = camTarget(s, q);
      const cur = evalCam(segs, from, t);
      segs.push({ t, d: 1.0, from: cur, to });
      from = to;
    }
    s.camBase = camTarget(s, null);
    return segs;
  }

  function evalCam(segs, base, t) {
    let st = segs.length ? segs[0].from : base;
    for (const g of segs) {
      if (t < g.t) break;
      const k = ease.io(clamp((t - g.t) / g.d));
      st = { cx: lerp(g.from.cx, g.to.cx, k), cy: lerp(g.from.cy, g.to.cy, k), z: lerp(g.from.z, g.to.z, k) };
    }
    return st;
  }

  function renderClip(s, local) {
    const c = s.clip;
    // Frame for this moment (screencast frames only arrive on change: hold the last one).
    const ct = (c.start + clamp(local, 0, s.dur) * s.rate) * 1000;
    let lo = 0;
    let hi = c.frames.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (c.frames[mid].t <= ct) lo = mid;
      else hi = mid - 1;
    }
    setSrc(s.img, `${c.url}/${c.frames[lo].file}`);

    const { scale, bar, winW, winH } = s.geo;
    const cam = evalCam(s.camSegs, s.camBase, local);
    const z = cam.z * (1 + 0.012 * clamp(local / s.dur));
    // Keep the window covering the frame when zoomed in.
    const centerX = W / 2;
    const centerY = D.portrait ? H * 0.47 : H * 0.49;
    let px = cam.cx * scale;
    let py = cam.cy * scale + bar;
    const halfW = centerX / z;
    const halfH = centerY / z;
    if (winW * z > W) px = clamp(px, halfW - 30 / z, winW - halfW + 30 / z);
    else px = winW / 2 + (px - winW / 2) * 0.35;
    if (winH * z > H * 0.9) py = clamp(py, halfH - 20 / z, winH - halfH + 20 / z);
    else py = winH / 2 + (py - winH / 2) * 0.35;
    s.cam.style.transform = `translate(${centerX - z * px}px, ${centerY - z * py}px) scale(${z})`;
  }

  // ---------- Scene layers + transitions ----------
  function build() {
    const root = $("#layers");
    for (const s of D.scenes) {
      const layer = document.createElement("div");
      layer.className = "layer";
      root.appendChild(layer);
      s.layer = layer;
      s.localOf = (clipMs) => (clipMs / 1000 - s.clip.start) / s.rate;
      if (s.clip) buildClip(layer, s);
      else {
        s.motion = SCENES_MOTION[s.motionName];
        s.state = s.motion.build(layer, { W, H, portrait: D.portrait, stills: D.stills, logo: "/public/logo.svg", scene: s });
      }
      if (s.vo) s.chunks = captionChunks(s.vo, s.voStart, s.voDur);
    }
  }

  function render(t) {
    const TR = D.transition;
    // Background drift.
    const bl = document.querySelectorAll(".blob");
    bl[0].style.transform = `translate(${-300 + Math.sin(t * 0.21) * 220}px, ${-420 + Math.cos(t * 0.17) * 160}px)`;
    bl[1].style.transform = `translate(${W - 700 + Math.cos(t * 0.19) * 240}px, ${H - 700 + Math.sin(t * 0.23) * 180}px)`;
    bl[2].style.transform = `translate(${W * 0.35 + Math.sin(t * 0.13 + 1) * 300}px, ${H * 0.2 + Math.cos(t * 0.11) * 260}px)`;
    $(".grid").style.transform = `translate(${(t * 6) % 64}px, ${(t * 4) % 64}px)`;

    for (const [i, s] of D.scenes.entries()) {
      const end = s.start + s.dur;
      const first = i === 0;
      const last = i === D.scenes.length - 1;
      const visible = t >= s.start - TR / 2 && t <= end + TR / 2;
      s.layer.style.display = visible ? "block" : "none";
      if (!visible) continue;
      const local = t - s.start;
      const e = first ? 1 : ease.io(clamp((t - (s.start - TR / 2)) / TR));
      const x = last ? 0 : ease.io(clamp((t - (end - TR / 2)) / TR));
      const y = (1 - e) * 90 - x * 70;
      const sc = (0.955 + 0.045 * e) * (1 - 0.035 * x);
      s.layer.style.opacity = Math.min(e, 1 - x);
      s.layer.style.transform = `translateY(${y}px) scale(${sc})`;
      s.layer.style.filter = e < 1 || x > 0 ? `blur(${(1 - e) * 12 + x * 10}px)` : "none";
      if (s.clip) renderClip(s, local);
      else s.motion.render(s.state, local, s.dur, { W, H, portrait: D.portrait, ease, clamp, lerp });
    }

    // Chapter label + brand bug.
    const cur = D.scenes.find((s) => t >= s.start && t < s.start + s.dur);
    const chap = $("#chapter");
    if (cur?.chapter) {
      const l = t - cur.start;
      // Shown while the scene settles, then out of the way of the UI.
      const k = Math.min(ease.out(clamp((l - 0.25) / 0.45)), clamp((2.9 - l) / 0.35), clamp((cur.dur - l - 0.15) / 0.3));
      chap.querySelector(".num").textContent = String(cur.n).padStart(2, "0");
      chap.querySelector(".name").textContent = cur.chapter;
      chap.style.opacity = k;
      chap.style.transform = D.portrait ? `translateX(-50%) translateY(${(1 - k) * -14}px)` : `translateX(${(1 - k) * -24}px)`;
    } else chap.style.opacity = 0;
    const brand = $("#brand");
    const bk = cur && cur.brand ? Math.min(clamp((t - cur.start - 0.2) / 0.4), clamp((cur.start + cur.dur - t - 0.1) / 0.3)) : 0;
    brand.style.opacity = bk * 0.85;

    renderCaptions(t);
    // Fade in from black, out to black.
    $("#fade").style.opacity = Math.max(1 - clamp(t / 0.6), clamp((t - (D.total - 0.9)) / 0.9));

    const wait = Promise.all([...pending]);
    pending.clear();
    return wait.then(() => true);
  }

  window.STAGE = {
    init(data) {
      D = data;
      document.documentElement.classList.toggle("portrait", !!D.portrait);
      W = D.portrait ? 1080 : 1920;
      H = D.portrait ? 1920 : 1080;
      build();
      return Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode().catch(() => {}))]).then(() => true);
    },
    render,
    /** Sound cues for the mix: [{ t, kind, gain }] in video seconds. */
    sfx() {
      const out = [];
      for (const [i, s] of D.scenes.entries()) {
        if (i > 0) out.push({ t: s.start - 0.38, kind: "whoosh", gain: 0.32 });
        if (s.clip) {
          for (const q of s.clip.cues) {
            const lt = s.localOf(q.t);
            if (lt < 0 || lt > s.dur) continue;
            if (q.type === "click") out.push({ t: s.start + lt, kind: "click", gain: 0.55 });
            if (q.type === "key") out.push({ t: s.start + lt, kind: "key", gain: 0.2 });
          }
        } else for (const e of s.motion.sfx?.(s.dur) ?? []) out.push({ ...e, t: s.start + e.t });
      }
      return out;
    },
  };
})();
