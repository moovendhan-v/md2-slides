import "@phosphor-icons/web/regular";
import { createRoot } from "react-dom/client";
import { ShareGate } from "./share-gate";

declare global {
  interface Window {
    /** Encoded share payload embedded by the HTML export. */
    __SLIDEWISE_DECK__?: string;
  }
}

/** Standalone player entry, bundled by scripts/build-player.mjs and inlined into exported HTML. */
createRoot(document.getElementById("root")!).render(<ShareGate encoded={window.__SLIDEWISE_DECK__ ?? ""} />);
