import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/landing-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} — ${BRAND.tagline}` },
  alternates: { canonical: "/" },
};

export default function Home() {
  return <LandingPage />;
}
