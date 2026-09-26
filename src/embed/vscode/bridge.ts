import type { HostMessage, WebviewMessage } from "./protocol";

interface VsCodeApi {
  postMessage(message: unknown): void;
}

declare global {
  function acquireVsCodeApi(): VsCodeApi;
}

// `acquireVsCodeApi` may be called only once per webview.
const api: VsCodeApi =
  typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : { postMessage: (m) => console.debug("[slidewise → host]", m) };

export const post = (message: WebviewMessage) => api.postMessage(message);

/** Subscribe to messages from the extension host; returns an unsubscribe function. */
export function onHost(fn: (message: HostMessage) => void) {
  const handler = (e: MessageEvent<HostMessage>) => e.data && typeof e.data.type === "string" && fn(e.data);
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}
