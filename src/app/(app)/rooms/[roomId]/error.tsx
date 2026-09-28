"use client";

import { ErrorState } from "@/components/shared/error-state";

/** Room sections: keeps the room header + nav (RoomShell layout) so users can switch sections. */
export default function RoomSectionError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState error={error} retry={retry} compact />;
}
