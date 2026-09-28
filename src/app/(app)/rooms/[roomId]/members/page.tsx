import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Members" };

export default function Page() {
  return <ComingSoon title="Members" phase={7} />;
}
