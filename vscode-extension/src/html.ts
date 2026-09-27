import * as vscode from "vscode";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Instrument+Serif&family=JetBrains+Mono:wght@400;500;700&display=swap";

const nonce = () => Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join("");

/**
 * Webview document for the bundled md2slides app. `<base>` points at the
 * deck's folder so relative image paths in the Markdown resolve.
 */
export function webviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri, document: vscode.TextDocument): string {
  const asset = (file: string) => webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "dist", "webview", file)).toString();
  const base = webview.asWebviewUri(vscode.Uri.joinPath(document.uri, "..")).toString() + "/";
  const n = nonce();
  const csp = [
    "default-src 'none'",
    `img-src ${webview.cspSource} https: data: blob:`,
    `media-src ${webview.cspSource} https:`,
    `style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src ${webview.cspSource} https://fonts.gstatic.com data:`,
    // Allow all extension assets, inline scripts, chunks, and WebAssembly evaluation.
    `script-src ${webview.cspSource} 'nonce-${n}' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'`,
    `connect-src ${webview.cspSource} https: data: blob:`,
  ].join("; ");

  return `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <base href="${base}" />
  <link rel="stylesheet" href="${FONTS}" />
  <link rel="stylesheet" href="${asset("app.css")}" />
  <link rel="stylesheet" href="${asset("main.css")}" />
  <title>md2slides</title>
</head>
<body class="bg-zinc-950 text-[13px] text-zinc-50 antialiased">
  <div id="root"></div>
  <script nonce="${n}">window.__MD2SLIDES_WASM__ = ${JSON.stringify(asset("slide_engine_bg.wasm"))};</script>
  <script type="module" nonce="${n}" src="${asset("main.js")}"></script>
</body>
</html>`;
}
