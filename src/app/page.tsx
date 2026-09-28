import type { Metadata } from "next";

import { ClosingCta } from "@/components/landing/closing-cta";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { PoolVsWeb } from "@/components/landing/pool-vs-web";
import { Roles } from "@/components/landing/roles";
import { SkipLink } from "@/components/shared/skip-link";

const description =
  "One shared pool for your flat, hostel room or trip. Everyone chips in, spends get approved, and whoever paid gets paid back — on a ledger the whole room can see.";

export const metadata: Metadata = {
  title: { absolute: "HisaabSync — Shared money, zero awkward hisaab" },
  description,
  openGraph: {
    title: "HisaabSync — Shared money, zero awkward hisaab",
    description,
    siteName: "HisaabSync",
    type: "website",
  },
};

/**
 * Public landing page. Only signed-out visitors see it: src/proxy.ts sends anyone with a session
 * cookie straight to /rooms. It's a static server page; only the demo phone and the role switcher
 * ship JavaScript.
 */
export default function LandingPage() {
  return (
    <>
      <SkipLink />
      <LandingHeader />
      <main id="main" tabIndex={-1} className="flex-1 overflow-x-clip outline-none">
        <Hero />
        <PoolVsWeb />
        <HowItWorks />
        <Features />
        <Roles />
        <Faq />
        <ClosingCta />
      </main>
      <LandingFooter />
    </>
  );
}
