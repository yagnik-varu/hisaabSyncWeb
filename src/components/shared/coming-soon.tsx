import { ConstructionIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

/** Placeholder for room sections that later roadmap phases will build. */
export function ComingSoon({ title, phase }: { title: string; phase: number }) {
  return (
    <EmptyState
      icon={ConstructionIcon}
      title={`${title} is coming soon`}
      description={`This section is planned for Phase ${phase} of the roadmap.`}
    />
  );
}
