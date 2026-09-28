import type { Metadata } from "next";

import { BackendStatusView } from "@/components/shared/backend-status-view";

export const metadata: Metadata = { title: "Server status" };

/** Public backend connectivity page (also useful to wake up the Render free tier). */
export default function StatusPage() {
  return <BackendStatusView />;
}
