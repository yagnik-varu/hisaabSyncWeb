import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Activity" };

export default function Page() {
  return <ComingSoon title="Activity" phase={8} />;
}
