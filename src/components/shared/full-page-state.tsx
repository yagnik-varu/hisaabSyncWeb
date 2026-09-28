"use client";

import { ServerCrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function FullPageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="text-muted-foreground flex flex-1 items-center justify-center gap-2 p-8 text-sm">
      <Spinner />
      {label}
    </div>
  );
}

/** Shown when the backend can't be reached (e.g. Render free tier waking up). */
export function ServerUnreachable({
  message,
  onRetry,
  retrying,
}: {
  message?: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <ServerCrashIcon className="text-muted-foreground size-10" />
      <div className="space-y-1">
        <h2 className="font-semibold">Can&apos;t reach the server</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          {message ??
            "The HisaabSync server may be starting up. This can take up to a minute on the free tier."}
        </p>
      </div>
      <Button onClick={onRetry} disabled={retrying}>
        {retrying && <Spinner />}
        Try again
      </Button>
    </div>
  );
}
