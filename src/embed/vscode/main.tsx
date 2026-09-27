import "@phosphor-icons/web/regular";
import { createRoot } from "react-dom/client";
import { EmbedApp } from "./embed-app";

window.addEventListener("error", (e) => {
  console.error("[md2slides webview error]", e);
  const root = document.getElementById("root");
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `<div style="padding: 24px; color: #f87171; font-family: sans-serif; font-size: 13px;">
      <h3 style="margin-bottom: 8px; font-weight: bold;">Failed to load md2slides preview</h3>
      <pre style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; white-space: pre-wrap;">${e.message || String(e)}</pre>
    </div>`;
  }
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("[md2slides webview unhandled rejection]", e);
});

/** Webview entry, bundled by `vscode-extension/scripts/build.mjs`. */
try {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(<EmbedApp />);
  }
} catch (err) {
  console.error("[md2slides render error]", err);
}

