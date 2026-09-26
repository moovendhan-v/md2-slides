import "@phosphor-icons/web/regular";
import { createRoot } from "react-dom/client";
import { EmbedApp } from "./embed-app";

/** Webview entry, bundled by `vscode-extension/scripts/build.mjs`. */
createRoot(document.getElementById("root")!).render(<EmbedApp />);
