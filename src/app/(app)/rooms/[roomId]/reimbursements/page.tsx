import type { Metadata } from "next";
import { Suspense } from "react";

import { ReimbursementsView } from "@/components/reimbursements/reimbursements-view";

export const metadata: Metadata = { title: "Reimbursements" };

export default function ReimbursementsPage() {
  return (
    <Suspense>
      <ReimbursementsView />
    </Suspense>
  );
}
