"use client";

import { ErrorState } from "@/components/shared/error-state";

/** Signed-in pages: keeps the app header (layout) visible when a page crashes. */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState error={error} retry={retry} />;
}
