import type { Metadata } from "next";
import { App } from "@/app-shell/app";

export const metadata: Metadata = { title: "Editor", robots: { index: false } };

/** The signed-in editor (GitHub OAuth returns here). */
export default function AppPage() {
  return <App />;
}
