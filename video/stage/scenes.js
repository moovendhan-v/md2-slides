/**
 * Motion-graphics scenes. Each scene builds its DOM once (`build`) and then
 * poses it for any local time (`render`), so frames are deterministic.
 * `sfx(dur)` lists sound cues (local seconds) for the mix.
 */
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const io = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
  const out = (k) => 1 - (1 - k) ** 3;
  const back = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 + 2.4 * (k - 1) ** 3 + 1.4 * (k - 1) ** 2);
  const K = (t, a, d = 0.5) => clamp((t - a) / d);
  const html = (s) => {
    const d = document.createElement("div");
    d.innerHTML = s.trim();
    return d.firstElementChild;
  };
  /** Rise-in pose: opacity + translate + scale from progress k. */
  const rise = (node, k, dy = 30, s0 = 0.96) => {
    node.style.opacity = clamp(k * 1.4);
    node.style.transform = `translateY(${(1 - k) * dy}px) scale(${s0 + (1 - s0) * k})`;
  };
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  /** Minimal Markdown colouring for the fake editors. */
  const mdLine = (l) => {
    if (/^#/.test(l)) return `<span class="md-h">${esc(l)}</span>`;
    if (/^:::/.test(l)) return `<span class="md-k">${esc(l)}</span>`;
    if (/^---/.test(l)) return `<span class="md-d">${esc(l)}</span>`;
    if (/^\^/.test(l)) return `<span class="md-y">${esc(l)}</span>`;
    if (/^[a-z]+:/.test(l)) return l.replace(/^([a-z]+:)(.*)$/, '<span class="md-v">$1</span><span style="color:#e4e4e7">$2</span>');
    if (/^- /.test(l)) return `<span class="md-v">-</span> ${esc(l.slice(2)).replace(/\|/g, '<span class="md-d">|</span>')}`;
    return `<span style="color:#d4d4d8">${esc(l)}</span>`;
  };
  /** Typed text: the first n characters of `lines`, with a caret. */
  const typed = (lines, n, caret = true) => {
    let left = n;
    const outL = [];
    for (const l of lines) {
      if (left <= 0) break;
      const part = l.slice(0, left);
      left -= l.length + 1;
      outL.push(part);
    }
    const lastIdx = outL.length - 1;
    return outL
      .map((l, i) => `<div>${mdLine(l) || "&nbsp;"}${caret && i === lastIdx ? '<span style="display:inline-block;width:3px;height:1.05em;background:#60a5fa;vertical-align:-3px;margin-left:2px"></span>' : ""}</div>`)
      .join("");
  };
  const CURSOR = '<svg class="cursor-fake" viewBox="0 0 28 28"><path d="M5 3l17 10.5-7.6 1.4 4.6 8.6-3.3 1.7-4.6-8.7L5 22z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  const S = {};

  // ---------------------------------------------------------------- hook
  const HOOK_MD = ["## Results", "", ":::stats style=big", "- 4 min | CI time, was 38", "- 0 | Incidents in 90 days", "- 12 | Releases per week", ":::"];
  S.hook = {
    build(layer, c) {
      const P = c.portrait;
      layer.innerHTML = `
        <div class="hk-wrap" style="position:absolute;inset:0">
          <div class="hk-left" style="position:absolute;${P ? "left:80px;right:80px;top:300px;text-align:center" : "left:130px;top:250px;width:900px"}">
            <div class="kicker hk-kick"><img src="${c.logo}"/>md2slides</div>
            <h1 class="hk-h" style="margin-top:34px;font:800 ${P ? 92 : 70}px/1.05 var(--sans);letter-spacing:-.035em">
              ${"What if your slides were"
                .split(" ")
                .map((w) => `<span class="hw" style="display:inline-block;margin-right:.24em">${w}</span>`)
                .join("")}<br/>
              ${["just", "a"].map((w) => `<span class="hw" style="display:inline-block;margin-right:.24em">${w}</span>`).join("")}<span class="hw grad" style="display:inline-block;margin-right:.24em">Markdown</span><span class="hw grad" style="display:inline-block">file?</span>
            </h1>
            <p class="hk-sub" style="margin-top:28px;font:500 ${P ? 36 : 30}px/1.4 var(--sans);color:#a1a1aa">Living right next to your code.</p>
          </div>
          <div class="hk-right" style="position:absolute;${P ? "left:90px;right:90px;top:960px;height:760px" : "left:1060px;top:190px;width:760px;height:700px"}">
            <div class="card hk-ed" style="position:absolute;left:0;top:0;width:${P ? 900 : 540}px;padding:0 0 22px">
              <div style="display:flex;align-items:center;gap:10px;height:48px;padding:0 18px;border-bottom:1px solid var(--line);font:500 17px var(--mono);color:#a1a1aa"><i class="ph ph-file-md" style="color:#60a5fa;font-size:22px"></i>decks/acme-q3.md</div>
              <div class="hk-code mono" style="padding:18px 22px 0;font-size:${P ? 25 : 21}px;line-height:1.65;min-height:${P ? 300 : 250}px"></div>
            </div>
            <div class="hk-arrow" style="position:absolute;${P ? "left:430px;top:420px" : "left:420px;top:330px"};font-size:46px;color:#60a5fa"><i class="ph ph-arrow-${P ? "down" : "down-right"}"></i></div>
            <img class="slideimg hk-slide" src="${c.stills.acme[1]}" style="position:absolute;${P ? "left:40px;top:500px;width:820px" : "left:200px;top:390px;width:560px"}"/>
            <div class="hk-tree" style="position:absolute;${P ? "left:0;top:-120px" : "left:0;top:-96px"};display:flex;gap:10px"></div>
          </div>
        </div>`;
      const tree = layer.querySelector(".hk-tree");
      ["src/", "decks/acme-q3.md", "package.json"].forEach((f, i) => {
        tree.appendChild(html(`<span class="chip" style="${i === 1 ? "border-color:rgba(96,165,250,.6);background:rgba(59,130,246,.14);color:#dbeafe" : ""}"><i class="ph ph-${i === 0 ? "folder" : i === 1 ? "file-md" : "file-code"}"></i>${f}</span>`));
      });
      return {
        wrap: layer.querySelector(".hk-wrap"),
        kick: layer.querySelector(".hk-kick"),
        words: [...layer.querySelectorAll(".hw")],
        sub: layer.querySelector(".hk-sub"),
        ed: layer.querySelector(".hk-ed"),
        code: layer.querySelector(".hk-code"),
        arrow: layer.querySelector(".hk-arrow"),
        slide: layer.querySelector(".hk-slide"),
        tree: [...tree.children],
      };
    },
    render(s, t, dur) {
      s.wrap.style.transform = `scale(${1 + 0.035 * clamp(t / dur)})`;
      rise(s.kick, out(K(t, 0.1, 0.5)), 16);
      s.words.forEach((w, i) => rise(w, out(K(t, 0.3 + i * 0.12, 0.55)), 40, 1));
      rise(s.sub, out(K(t, 2.2, 0.6)), 18);
      rise(s.ed, out(K(t, 0.6, 0.7)), 50);
      const total = HOOK_MD.join("\n").length;
      s.code.innerHTML = typed(HOOK_MD, Math.round(total * clamp((t - 1.0) / 1.6)), true);
      const a = out(K(t, 2.5, 0.4));
      s.arrow.style.opacity = a;
      s.arrow.style.transform = `translate(${(1 - a) * -10}px, ${(1 - a) * -10}px)`;
      const k = back(K(t, 2.7, 0.7));
      s.slide.style.opacity = clamp(K(t, 2.7, 0.3));
      s.slide.style.transform = `scale(${0.85 + 0.15 * k}) rotate(${(1 - k) * -3}deg)`;
      s.slide.style.boxShadow = `0 0 0 1px rgba(255,255,255,.1), 0 40px 90px -30px rgba(0,0,0,.9), 0 0 ${80 * clamp(K(t, 2.8, 0.8))}px rgba(59,130,246,.35)`;
      s.tree.forEach((c, i) => rise(c, out(K(t, 3.3 + i * 0.12, 0.45)), 14));
    },
    sfx: () => [
      ...Array.from({ length: 40 }, (_, i) => ({ t: 1.0 + i * 0.04, kind: "key", gain: 0.12 })),
      { t: 2.7, kind: "pop", gain: 0.5 },
    ],
  };

  // ---------------------------------------------------------------- pain
  S.pain = {
    build(layer, c) {
      const P = c.portrait;
      const cards = [
        {
          title: "Copy-pasted code",
          body: `<div class="mono" style="font-size:17px;line-height:1.6;padding:16px 18px;border-radius:12px;background:#0a0a0c;border:1px solid var(--line);color:#d4d4d8">
            <div><span style="color:#c084fc">const</span> deck = <span style="color:#93c5fd">render</span>(q3)</div>
            <div><span style="color:#c084fc">await</span> deck.<span style="color:#93c5fd">export</span>(<span style="color:#fbbf24">"v2"</span>)</div>
            <div style="color:#52525b">// TODO: update before Friday</div></div>
            <div style="margin-top:16px;display:flex;gap:10px"><span class="chip" style="height:38px;font-size:16px;color:#fca5a5;border-color:rgba(239,68,68,.4)"><i class="ph ph-warning"></i>stale since v1.4</span></div>`,
          icon: "copy",
        },
        {
          title: "40 MB decks",
          body: `<div style="display:flex;align-items:center;gap:18px"><div style="width:86px;height:104px;border-radius:12px;background:linear-gradient(160deg,#fb923c,#c2410c);display:grid;place-items:center;font:800 42px var(--sans)">P</div>
            <div><div class="mono" style="font-size:19px;color:#e4e4e7">Q3_final_v7_REAL.pptx</div><div style="margin-top:6px;font:600 30px var(--sans)">40.2 MB</div></div></div>
            <div style="margin-top:18px"><span class="chip" style="height:38px;font-size:16px;color:#fca5a5;border-color:rgba(239,68,68,.4)"><i class="ph ph-paperclip"></i>attachment too large</span></div>`,
          icon: "paperclip",
        },
        {
          title: "Which version did they see?",
          body: ["Q3_review_v5.pptx", "Q3_review_v6_final.pptx", "Q3_review_v7_final_2.pptx"]
            .map((f, i) => `<div class="mono" style="display:flex;align-items:center;gap:10px;height:44px;padding:0 14px;margin-top:${i ? 8 : 0}px;border-radius:10px;border:1px solid var(--line);font-size:17px;color:#d4d4d8"><i class="ph ph-file"></i>${f}<span style="margin-left:auto;color:#fbbf24">?</span></div>`)
            .join(""),
          icon: "question",
        },
      ];
      const cw = P ? 860 : 520;
      layer.innerHTML = `<div class="pn-wrap" style="position:absolute;inset:0">
        <div class="pn-title" style="position:absolute;left:0;right:0;top:${P ? 260 : 150}px;text-align:center;font:700 ${P ? 64 : 56}px/1.1 var(--sans);letter-spacing:-.03em">Presentations shouldn't <span style="color:#f87171">fight you</span>.</div>
        ${cards
          .map(
            (cd, i) => `<div class="card pn-card" style="position:absolute;width:${cw}px;${P ? `left:${(1080 - cw) / 2}px;top:${470 + i * 380}px` : `left:${(1920 - 3 * cw - 2 * 40) / 2 + i * (cw + 40)}px;top:330px`};padding:26px 26px 28px">
            <div style="display:flex;align-items:center;gap:12px;font:700 27px var(--sans);margin-bottom:20px"><span style="display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:rgba(239,68,68,.14);color:#f87171;font-size:24px"><i class="ph ph-${cd.icon}"></i></span>${cd.title}</div>
            ${cd.body}
            <div class="strike"></div></div>`,
          )
          .join("")}
        <div class="pn-better" style="position:absolute;left:0;right:0;top:${P ? 1640 : 840}px;text-align:center;font:600 ${P ? 46 : 40}px var(--sans);color:#93c5fd">There's a developer way.</div>
      </div>`;
      return { title: layer.querySelector(".pn-title"), cards: [...layer.querySelectorAll(".pn-card")], strikes: [...layer.querySelectorAll(".strike")], better: layer.querySelector(".pn-better") };
    },
    render(s, t, dur) {
      rise(s.title, out(K(t, 0.05, 0.5)), 20);
      const at = [0.5, 1.7, 3.0];
      s.cards.forEach((c, i) => {
        const k = back(K(t, at[i], 0.55));
        const gone = io(K(t, dur - 1.45, 0.7));
        c.style.opacity = clamp(K(t, at[i], 0.25)) * (1 - gone * 0.85);
        c.style.transform = `translateY(${(1 - k) * 60 + gone * 40}px) scale(${0.9 + 0.1 * k - gone * 0.06}) rotate(${(i - 1) * (1 - k) * 4}deg)`;
        c.style.filter = `saturate(${1 - io(K(t, 4.1 + i * 0.12, 0.4)) * 0.8})`;
        s.strikes[i].style.transform = `rotate(-8deg) scaleX(${io(K(t, 4.0 + i * 0.12, 0.35))})`;
      });
      rise(s.better, out(K(t, dur - 1.2, 0.6)), 20);
    },
    sfx: () => [
      { t: 0.5, kind: "pop", gain: 0.45 },
      { t: 1.7, kind: "pop", gain: 0.45 },
      { t: 3.0, kind: "pop", gain: 0.45 },
      { t: 4.0, kind: "click", gain: 0.5 },
      { t: 4.12, kind: "click", gain: 0.5 },
      { t: 4.24, kind: "click", gain: 0.5 },
    ],
  };

  // ---------------------------------------------------------------- vscode
  const VS_MD = ["---", "theme: midnight", "accent: #60a5fa", "---", "", "^ Client update", "# Q3 platform review", "What we shipped for Acme Corp", "", "---", "", "## Results", "", ":::stats style=big", "- 4 min | CI time, was 38", "- 0 | Incidents in 90 days", "- 12 | Releases per week", ":::"];
  S.vscode = {
    build(layer, c) {
      const P = c.portrait;
      const w = P ? 1000 : 1640;
      const h = P ? 1300 : 860;
      layer.innerHTML = `<div class="vs" style="position:absolute;left:${(c.W - w) / 2}px;top:${(c.H - h) / 2 - 20}px;width:${w}px;height:${h}px;border-radius:14px;overflow:hidden;background:#1e1e1e;box-shadow:0 0 0 1px rgba(255,255,255,.1),0 50px 120px -20px rgba(0,0,0,.85);font-family:var(--sans)">
        <div style="height:38px;background:#2b2b2b;display:flex;align-items:center;padding:0 14px;gap:8px;color:#9d9d9d;font-size:14px"><i style="width:12px;height:12px;border-radius:50%;background:#f87171"></i><i style="width:12px;height:12px;border-radius:50%;background:#fbbf24"></i><i style="width:12px;height:12px;border-radius:50%;background:#4ade80"></i><span style="margin:0 auto">acme-platform — Visual Studio Code</span></div>
        <div style="display:flex;height:calc(100% - 38px)">
          <div style="width:56px;background:#333;display:flex;flex-direction:column;align-items:center;gap:22px;padding-top:16px;font-size:26px;color:#858585"><i class="ph ph-files" style="color:#fff"></i><i class="ph ph-magnifying-glass"></i><i class="ph ph-git-branch"></i><i class="ph ph-puzzle-piece"></i></div>
          ${P ? "" : `<div style="width:250px;background:#252526;color:#ccc;font-size:15px;padding:12px 0"><div style="padding:0 18px 10px;font-size:12px;letter-spacing:.08em;color:#9d9d9d">EXPLORER</div>
            ${[["folder-open", "decks", 0], ["file-md", "acme-q3.md", 1], ["file-md", "launch-plan.md", 1], ["folder", "src", 0], ["file-code", "package.json", 0], ["file-md", "README.md", 0]]
              .map(([ic, n, ind], i) => `<div style="height:30px;display:flex;align-items:center;gap:8px;padding-left:${18 + ind * 18}px;${i === 1 ? "background:#37373d;color:#fff" : ""}"><i class="ph ph-${ic}" style="color:${ic.startsWith("file-md") ? "#60a5fa" : "#c5c5c5"}"></i>${n}</div>`)
              .join("")}</div>`}
          <div class="vs-main" style="flex:1;position:relative;display:flex;min-width:0">
            <div class="vs-ed" style="flex:1;min-width:0;background:#1e1e1e">
              <div style="height:38px;background:#252526;display:flex"><div style="background:#1e1e1e;color:#fff;display:flex;align-items:center;gap:8px;padding:0 16px;font-size:14px"><i class="ph ph-file-md" style="color:#60a5fa"></i>acme-q3.md</div></div>
              <div class="mono" style="padding:14px 0;font-size:${P ? 22 : 17}px;line-height:1.62">${VS_MD.map((l, i) => `<div style="display:flex"><span style="width:52px;text-align:right;padding-right:18px;color:#6e7681">${i + 1}</span>${mdLine(l) || "&nbsp;"}</div>`).join("")}</div>
            </div>
            <div class="vs-web" style="position:absolute;top:0;bottom:0;right:0;width:${P ? "100%" : "56%"};background:#18181b;border-left:1px solid #333">
              <div style="height:38px;background:#252526;display:flex"><div style="background:#18181b;color:#fff;display:flex;align-items:center;gap:8px;padding:0 16px;font-size:14px"><i class="ph ph-presentation" style="color:#a78bfa"></i>acme-q3.md — Slides</div></div>
              <div style="padding:${P ? 60 : 34}px ${P ? 40 : 30}px"><div style="position:relative"><img class="slideimg vs-s1" src="${c.stills.acme[0]}" style="width:100%"/><img class="slideimg vs-s2" src="${c.stills.acme[1]}" style="width:100%;position:absolute;left:0;top:0"/></div>
              <div style="display:flex;gap:12px;margin-top:22px">${c.stills.acme.map((u, i) => `<img class="vs-th" src="${u}" style="width:calc(25% - 9px);border-radius:8px;box-shadow:0 0 0 ${i === 1 ? 2 : 1}px ${i === 1 ? "#60a5fa" : "rgba(255,255,255,.12)"}"/>`).join("")}</div></div>
            </div>
            <div class="vs-toast" style="position:absolute;right:22px;bottom:22px;width:${P ? 700 : 520}px;padding:18px 20px;border-radius:10px;background:#252526;box-shadow:0 12px 40px rgba(0,0,0,.6);border:1px solid #3c3c3c;color:#ccc;font-size:${P ? 22 : 16}px">
              <div style="display:flex;gap:12px"><i class="ph ph-presentation" style="color:#60a5fa;font-size:22px"></i><div><b style="color:#fff">md2slides</b>: this Markdown file looks like a slide deck.</div></div>
              <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px"><span style="padding:6px 14px;border-radius:4px;color:#ccc">Not now</span><span class="vs-btn" style="padding:6px 14px;border-radius:4px;background:#0e639c;color:#fff">Open as slides</span></div>
            </div>
          </div>
        </div>
        ${CURSOR}<div class="ripple" style="opacity:0"></div>
      </div>`;
      return {
        root: layer.querySelector(".vs"),
        web: layer.querySelector(".vs-web"),
        toast: layer.querySelector(".vs-toast"),
        btn: layer.querySelector(".vs-btn"),
        s2: layer.querySelector(".vs-s2"),
        cursor: layer.querySelector(".cursor-fake"),
        ripple: layer.querySelector(".ripple"),
        P: c.portrait,
      };
    },
    render(s, t) {
      rise(s.root, out(K(t, 0, 0.6)), 30, 0.97);
      const tk = out(K(t, 0.8, 0.45));
      const toastGone = io(K(t, 2.35, 0.3));
      s.toast.style.opacity = tk * (1 - toastGone);
      s.toast.style.transform = `translateY(${(1 - tk) * 40}px)`;
      // Cursor glides to the button and clicks.
      const root = s.root.getBoundingClientRect();
      const b = s.btn.getBoundingClientRect();
      const scaleX = root.width / s.root.offsetWidth || 1;
      const tx = (b.left - root.left) / scaleX + b.width / scaleX / 2;
      const ty = (b.top - root.top) / scaleX + b.height / scaleX / 2;
      const m = io(K(t, 1.2, 0.8));
      const sx = s.root.offsetWidth * 0.45;
      const sy = s.root.offsetHeight * 0.55;
      s.cursor.style.left = `${sx + (tx - sx) * m}px`;
      s.cursor.style.top = `${sy + (ty - sy) * m}px`;
      s.cursor.style.opacity = clamp(K(t, 1.0, 0.3)) * (1 - K(t, 3.0, 0.3));
      const r = K(t, 2.1, 0.5);
      s.ripple.style.left = `${tx}px`;
      s.ripple.style.top = `${ty}px`;
      s.ripple.style.opacity = r > 0 && r < 1 ? 1 - r : 0;
      s.ripple.style.transform = `scale(${0.3 + r})`;
      const w = io(K(t, 2.4, 0.7));
      s.web.style.transform = `translateX(${(1 - w) * 105}%)`;
      s.web.style.opacity = clamp(w * 3);
      s.s2.style.opacity = io(K(t, 3.9, 0.5));
    },
    sfx: () => [{ t: 2.1, kind: "click", gain: 0.6 }, { t: 2.45, kind: "whoosh", gain: 0.18 }],
  };

  // ---------------------------------------------------------------- mcp
  const CMD = "claude mcp add md2slides -- npx -y md2slides-mcp";
  S.mcp = {
    build(layer, c) {
      const P = c.portrait;
      const tw = P ? 960 : 860;
      layer.innerHTML = `<div class="mc" style="position:absolute;inset:0">
        <div class="card mc-term" style="position:absolute;width:${tw}px;${P ? "left:60px;top:250px" : "left:120px;top:200px"};overflow:hidden">
          <div style="height:44px;display:flex;align-items:center;gap:8px;padding:0 16px;border-bottom:1px solid var(--line);color:#71717a;font:500 15px var(--mono)"><i style="width:12px;height:12px;border-radius:50%;background:#3f3f46"></i><i style="width:12px;height:12px;border-radius:50%;background:#3f3f46"></i><i style="width:12px;height:12px;border-radius:50%;background:#3f3f46"></i><span style="margin-left:12px">~/acme-platform</span></div>
          <div class="term mc-lines" style="padding:22px 26px;min-height:${P ? 250 : 230}px;font-size:${P ? 25 : 23}px"></div>
        </div>
        <div class="card mc-chat" style="position:absolute;width:${P ? 960 : 780}px;${P ? "left:60px;top:640px" : "left:1020px;top:140px"};padding:24px">
          <div style="display:flex;align-items:center;gap:10px;font:600 18px var(--sans);color:#a1a1aa;margin-bottom:18px"><i class="ph-fill ph-sparkle" style="color:#d97757;font-size:22px"></i>Claude</div>
          <div class="mc-user" style="margin-left:auto;max-width:86%;padding:14px 18px;border-radius:16px 16px 4px 16px;background:#27272a;font:500 ${P ? 25 : 22}px/1.4 var(--sans)">Make a 3-slide launch plan for Acme Edge in <span class="mono" style="color:#93c5fd">decks/launch-plan.md</span></div>
          <div class="mc-tools" style="display:flex;flex-direction:column;gap:12px;margin-top:22px"></div>
          <div class="mc-done" style="margin-top:18px;font:500 ${P ? 24 : 21}px/1.45 var(--sans);color:#d4d4d8">Done. 3 slides, 0 problems. Commit and push, and it shows up in your dashboard.</div>
        </div>
        <div class="mc-slides" style="position:absolute;${P ? "left:60px;right:60px;top:1350px" : "left:120px;top:560px;width:860px"};height:340px"></div>
      </div>`;
      const tools = layer.querySelector(".mc-tools");
      [
        ["get_syntax", "md2slides Markdown spec"],
        ["validate_deck", "3 slides · 0 problems"],
        ["create_deck", "→ decks/launch-plan.md"],
      ].forEach(([n, d]) =>
        tools.appendChild(html(`<div class="chip" style="height:52px;justify-content:flex-start;font-size:${c.portrait ? 21 : 19}px"><i class="ph ph-wrench" style="color:#a78bfa"></i><span style="color:#e4e4e7">md2slides · ${n}</span><span style="color:#71717a">${d}</span><i class="ph-fill ph-check-circle ok" style="margin-left:auto;font-size:22px"></i></div>`)),
      );
      const slides = layer.querySelector(".mc-slides");
      c.stills.launch.forEach((u) => slides.appendChild(html(`<img class="slideimg" src="${u}" style="position:absolute;left:0;top:0;width:${P ? 480 : 420}px"/>`)));
      slides.appendChild(html(`<div class="chip mc-file" style="position:absolute;${P ? "left:0;top:300px" : "left:0;top:-70px"};border-color:rgba(74,222,128,.4);color:#bbf7d0"><i class="ph ph-file-md"></i>decks/launch-plan.md · written by Claude</div>`));
      return {
        term: layer.querySelector(".mc-term"),
        lines: layer.querySelector(".mc-lines"),
        chat: layer.querySelector(".mc-chat"),
        user: layer.querySelector(".mc-user"),
        tools: [...tools.children],
        done: layer.querySelector(".mc-done"),
        slides: [...slides.querySelectorAll("img")],
        file: slides.querySelector(".mc-file"),
        P,
      };
    },
    render(s, t, dur) {
      rise(s.term, out(K(t, 0, 0.5)), 30);
      const n = Math.round(CMD.length * clamp((t - 0.6) / 1.9));
      const lines = [`<div><span style="color:#4ade80">$</span> <span style="color:#e4e4e7">${CMD.slice(0, n)}</span>${t < 2.6 ? '<span style="display:inline-block;width:12px;height:1.05em;background:#e4e4e7;vertical-align:-3px;margin-left:2px"></span>' : ""}</div>`];
      if (t > 2.75) lines.push('<div style="color:#a1a1aa">Added stdio MCP server <span style="color:#e4e4e7">md2slides</span></div>');
      if (t > 3.05) lines.push('<div><span class="ok">✓</span> <span style="color:#a1a1aa">md2slides connected · 8 tools</span></div>');
      s.lines.innerHTML = lines.join("");
      rise(s.chat, out(K(t, 3.4, 0.6)), 40);
      rise(s.user, out(K(t, 3.8, 0.45)), 16);
      const at = [4.6, 5.3, 6.0];
      s.tools.forEach((c, i) => rise(c, back(K(t, at[i], 0.45)), 16, 0.92));
      rise(s.done, out(K(t, 6.7, 0.5)), 12);
      // Slides fan out from the create_deck call.
      const P = s.P;
      s.slides.forEach((img, i) => {
        const k = back(K(t, 6.5 + i * 0.25, 0.7));
        const x = P ? i * 245 : i * 220;
        const y = P ? 0 : i * 40;
        img.style.opacity = clamp(K(t, 6.5 + i * 0.25, 0.25));
        img.style.transform = `translate(${x * k}px, ${y * k + (1 - k) * 60}px) rotate(${(i - 1) * 4 * k}deg) scale(${0.8 + 0.2 * k})`;
        img.style.zIndex = i;
      });
      rise(s.file, out(K(t, 7.5, 0.5)), 12);
      // Terminal steps back once Claude takes over.
      const back2 = io(K(t, 3.4, 0.8));
      s.term.style.opacity = clamp(K(t, 0, 0.5)) * (1 - back2 * 0.45);
      void dur;
    },
    sfx: () => [
      ...Array.from({ length: 34 }, (_, i) => ({ t: 0.6 + i * 0.056, kind: "key", gain: 0.14 })),
      { t: 2.75, kind: "pop", gain: 0.35 },
      { t: 3.8, kind: "pop", gain: 0.4 },
      { t: 4.6, kind: "pop", gain: 0.4 },
      { t: 5.3, kind: "pop", gain: 0.4 },
      { t: 6.0, kind: "pop", gain: 0.45 },
      { t: 6.5, kind: "whoosh", gain: 0.2 },
    ],
  };

  // ---------------------------------------------------------------- cta
  S.cta = {
    build(layer, c) {
      const P = c.portrait;
      const all = [...c.stills.acme, ...c.stills.launch];
      const row = (y, dir) =>
        `<div class="cta-row" data-dir="${dir}" style="position:absolute;left:-400px;top:${y}px;display:flex;gap:40px;opacity:.28;filter:blur(1.5px)">${[...all, ...all]
          .map((u) => `<img src="${u}" style="width:${P ? 420 : 460}px;border-radius:12px;box-shadow:0 0 0 1px rgba(255,255,255,.1)"/>`)
          .join("")}</div>`;
      layer.innerHTML = `<div style="position:absolute;inset:0">
        ${row(P ? 150 : 40, 1)}${row(P ? 1480 : 760, -1)}
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%, rgba(5,6,10,.92) 30%, rgba(5,6,10,.4) 75%)"></div>
        <div class="center" style="flex-direction:column;text-align:center">
          <img class="cta-logo" src="${c.logo}" style="width:${P ? 170 : 150}px;height:${P ? 170 : 150}px;border-radius:32px"/>
          <div class="cta-name" style="margin-top:34px;font:800 ${P ? 130 : 128}px/1 var(--sans);letter-spacing:-.045em">md2slides</div>
          <div class="cta-tag" style="margin-top:24px;font:500 ${P ? 46 : 44}px var(--sans);color:#d4d4d8">Update the file. <span class="grad">Your slides follow.</span></div>
          <div class="cta-pills" style="margin-top:48px;display:flex;${P ? "flex-direction:column;align-items:center" : ""};gap:18px">
            <span class="chip" style="height:62px;font-size:26px;padding:0 24px;color:#e4e4e7"><span style="color:#4ade80">$</span> npx -y md2slides-mcp</span>
            <span class="chip" style="height:62px;font-size:26px;padding:0 24px;background:#fafafa;color:#09090b;font-family:var(--sans);font-weight:700"><i class="ph ph-arrow-up-right"></i>md2slides.app</span>
          </div>
          <div class="cta-foot" style="margin-top:44px;font:500 ${P ? 28 : 24}px var(--sans);color:#71717a"><i class="ph ph-github-logo"></i> Free &amp; open source · github.com/moovendhan-v/md2-slides</div>
        </div></div>`;
      return {
        rows: [...layer.querySelectorAll(".cta-row")],
        logo: layer.querySelector(".cta-logo"),
        name: layer.querySelector(".cta-name"),
        tag: layer.querySelector(".cta-tag"),
        pills: layer.querySelector(".cta-pills"),
        foot: layer.querySelector(".cta-foot"),
      };
    },
    render(s, t) {
      s.rows.forEach((r) => (r.style.transform = `translateX(${r.dataset.dir * (t * 60) - (r.dataset.dir < 0 ? 600 : 0)}px)`));
      const k = back(K(t, 0.1, 0.8));
      s.logo.style.opacity = clamp(K(t, 0.1, 0.3));
      s.logo.style.transform = `scale(${0.5 + 0.5 * k}) rotate(${(1 - k) * -12}deg)`;
      s.logo.style.boxShadow = `0 0 ${120 * clamp(K(t, 0.3, 1))}px rgba(59,130,246,.45)`;
      rise(s.name, out(K(t, 0.45, 0.6)), 30);
      rise(s.tag, out(K(t, 1.0, 0.6)), 20);
      rise(s.pills, out(K(t, 1.8, 0.6)), 20);
      rise(s.foot, out(K(t, 2.4, 0.6)), 12);
    },
    sfx: () => [{ t: 0.1, kind: "pop", gain: 0.5 }],
  };

  window.SCENES_MOTION = S;
})();
