import type { Metadata } from "next";
import { Suspense } from "react";

import { TreasuryView } from "@/components/treasury/treasury-view";

export const metadata: Metadata = { title: "Treasury" };

export default function TreasuryPage() {
  // TreasuryView keeps its filters in the URL (useSearchParams → needs Suspense).
  return (
    <Suspense>
      <TreasuryView />
    </Suspense>
  );
}
