"use client";

/**
 * TEMPORARY (Phase 0): backend connectivity check.
 * Replaced in Phase 1/2 by a redirect to /login or /rooms.
 */

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { RefreshCwIcon, ServerIcon } from "lucide-react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getHealth } from "@/lib/api/endpoints/health";
import { normalizeError } from "@/lib/api/errors";
import { PUBLIC_API_URL } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { queryKeys } from "@/lib/query-keys";

export default function BackendStatusPage() {
  const health = useQuery({
    queryKey: queryKeys.health(),
    queryFn: ({ signal }) => getHealth(signal),
    retry: false,
    refetchInterval: 30_000,
  });

  const error = health.error ? normalizeError(health.error) : null;
  const indicators = health.data?.details ?? {};

  let statusBadge: React.ReactNode;
  if (health.isPending) {
    statusBadge = <Badge variant="secondary">Checking…</Badge>;
  } else if (health.data?.status === "ok") {
    statusBadge = <Badge className="bg-emerald-600 text-white">Online</Badge>;
  } else if (error?.status === 503) {
    statusBadge = <Badge variant="destructive">Degraded</Badge>;
  } else {
    statusBadge = <Badge variant="destructive">Unreachable</Badge>;
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="size-4" />
            HisaabSync backend
          </CardTitle>
          <CardDescription className="font-mono text-xs break-all">
            {PUBLIC_API_URL}
          </CardDescription>
          <CardAction>{statusBadge}</CardAction>
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          {health.isPending && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {Object.entries(indicators).map(([name, indicator]) => (
            <div key={name} className="flex items-center justify-between">
              <span className="text-muted-foreground">{name}</span>
              <Badge variant={indicator.status === "up" ? "outline" : "destructive"}>
                {indicator.status}
              </Badge>
            </div>
          ))}

          {error && (
            <p className="text-destructive">
              {error.message}
              <span className="text-muted-foreground block font-mono text-xs">
                {error.code}
                {error.status ? ` · HTTP ${error.status}` : ""}
              </span>
            </p>
          )}

          <p className="text-muted-foreground border-t pt-3 text-xs">
            Money formatting check: {formatMoney("150000.5", "INR")} · {formatMoney("-20", "USD")}
          </p>
        </CardContent>

        <CardFooter className="justify-between">
          <span className="text-muted-foreground text-xs">
            {health.dataUpdatedAt || health.errorUpdatedAt
              ? `Checked ${formatDistanceToNow(Math.max(health.dataUpdatedAt, health.errorUpdatedAt), { addSuffix: true })}`
              : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => health.refetch()}
            disabled={health.isFetching}
          >
            <RefreshCwIcon className={health.isFetching ? "animate-spin" : undefined} />
            Recheck
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
