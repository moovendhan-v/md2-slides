import type { Metadata } from "next";
import { ShareViewer } from "./viewer";

export const metadata: Metadata = {
  title: "Shared deck · Slidewise",
  description: "A view-only Slidewise deck. The slides travel inside the link; nothing is stored on a server.",
  robots: { index: false, follow: false },
};

/** Public, view-only deck. The deck is in the URL fragment, which never reaches this server. */
export default function SharedDeckPage() {
  return <ShareViewer />;
}
