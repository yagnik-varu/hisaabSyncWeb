import type { Metadata } from "next";
import { Suspense } from "react";

import { ContributionsView } from "@/components/contributions/contributions-view";

export const metadata: Metadata = { title: "Contributions" };

export default function ContributionsPage() {
  return (
    <Suspense>
      <ContributionsView />
    </Suspense>
  );
}
