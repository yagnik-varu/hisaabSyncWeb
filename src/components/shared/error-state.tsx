"use client";

import { HomeIcon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Shared UI for route error boundaries (error.tsx). Shows the digest so a user can quote it when
 * reporting a problem; the message is only shown in development (production messages from server
 * components are generic anyway).
 */
export function ErrorState({
  error,
  retry,
  homeHref = "/rooms",
  compact,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref?: string;
  compact?: boolean;
}) {
  useEffect(() => {
    // Hook for an error reporting service (Sentry etc.) later.
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className={
        compact
          ? "flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-12 text-center"
          : "flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
      }
    >
      <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
        <TriangleAlertIcon className="text-destructive size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          This part of the page crashed. Trying again usually fixes it. If it keeps happening,
          reload the page.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="bg-muted mt-2 max-w-lg overflow-x-auto rounded p-2 text-left text-xs">
            {error.message}
          </pre>
        )}
        {error.digest && (
          <p className="text-muted-foreground font-mono text-xs">Error ID: {error.digest}</p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()}>
          <RotateCcwIcon />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href={homeHref}>
            <HomeIcon />
            My rooms
          </Link>
        </Button>
      </div>
    </div>
  );
}
