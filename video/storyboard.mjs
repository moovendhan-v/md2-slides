/**
 * The product video, scene by scene. Each scene has the narration (spoken by
 * the TTS voice and shown as captions), a chapter label and a visual:
 *   - `clip`:  real app footage captured by capture.mjs (clips/<clip>/)
 *   - `motion`: a motion-graphics scene drawn by stage/scenes.js
 * Scene length = narration length + `tail` (seconds); clips are time-fitted.
 */
export const VOICE = "en_US-ryan-high";

export const SCENES = [
  {
    id: "hook",
    visual: { motion: "hook" },
    vo: "What if your slides were just a Markdown file, living right next to your code?",
    tail: 1.2,
  },
  {
    id: "pain",
    visual: { motion: "pain" },
    vo: "No more copy-pasted code, forty-megabyte decks, or guessing which version the client saw.",
    tail: 0.8,
  },
  {
    id: "live",
    chapter: "Live preview",
    visual: { clip: "live" },
    vo: "Meet md2slides. Write Markdown on the left, and a real engine, compiled from Rust to WebAssembly, redraws every slide as you type.",
    tail: 1,
  },
  {
    id: "restyle",
    chapter: "Designed for you",
    visual: { clip: "restyle" },
    vo: "Click any block to restyle it, or switch the whole theme. It looks designed, and the Markdown stays clean.",
    tail: 0.8,
  },
  {
    id: "components",
    chapter: "Components view",
    visual: { clip: "components" },
    vo: "Prefer blocks? The components view lets you drag slides and cards into place.",
    tail: 0.8,
  },
  {
    id: "slash",
    chapter: "Slash menu",
    visual: { clip: "slash" },
    vo: "Press slash to search blocks, Mermaid diagrams and thousands of icons.",
    tail: 1,
  },
  {
    id: "commit",
    chapter: "Git native",
    visual: { clip: "commit" },
    vo: "Every deck lives in your GitHub repo. Review a git-style diff, then commit and push, right from the browser.",
    tail: 0.8,
  },
  {
    id: "share",
    chapter: "Share & present",
    visual: { clip: "share" },
    vo: "Share a link and the whole deck travels inside the URL, optionally encrypted. No server stores a thing.",
    tail: 1,
  },
  {
    id: "vscode",
    chapter: "VS Code",
    visual: { motion: "vscode" },
    vo: "In VS Code, open any Markdown file as slides, right beside your code.",
    tail: 0.8,
  },
  {
    id: "mcp",
    chapter: "Claude + MCP",
    visual: { motion: "mcp" },
    vo: "Or let Claude write it. Add the md2slides MCP server with one npx command. Claude writes a validated deck straight into your repo.",
    tail: 1,
  },
  {
    id: "dashboard",
    chapter: "Your dashboard",
    visual: { clip: "dashboard" },
    vo: "Push, and it shows up in your dashboard, ready to present to the client.",
    tail: 0.8,
  },
  {
    id: "community",
    chapter: "Open source",
    visual: { clip: "community" },
    vo: "md2slides is free and open source. Contribute templates with your name on them, or sponsor the project.",
    tail: 0.8,
  },
  {
    id: "cta",
    visual: { motion: "cta" },
    vo: "md2slides. Update the file, and your slides follow.",
    tail: 2.6,
  },
];

/** The 30-second vertical cut. */
export const VERTICAL = ["hook", "live", "mcp", "cta"];

/** Transition into each scene (xfade-like, drawn by the stage). */
export const TRANSITION = 0.6;
