"use client";

import { ErrorState } from "@/components/shared/error-state";

/** Catches errors in any page under the root layout (auth pages, /status…). */
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState error={error} retry={retry} />;
}
