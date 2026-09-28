"use client";

import { formatDistanceToNow } from "date-fns";
import { ChevronRightIcon, ScrollTextIcon } from "lucide-react";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { describeActivity } from "@/lib/activity";
import { formatDateTime } from "@/lib/dates";
import type { MemberNames } from "@/lib/ledger";
import type { AuditLogItem } from "@/types/api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "approvedBy" → "Approved by" */
function humanizeKey(key: string) {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function MetadataValue({
  name,
  value,
  names,
  currencyCode,
}: {
  name: string;
  value: unknown;
  names: MemberNames;
  currencyCode: string;
}) {
  if (typeof value === "string" && UUID.test(value)) {
    const person = names.get(value);
    return <span title={value}>{person ?? <code className="text-xs">{value}</code>}</span>;
  }
  if (name === "amount" && (typeof value === "string" || typeof value === "number")) {
    return <Money value={String(value)} currency={currencyCode} />;
  }
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (typeof value === "object") {
    return <code className="text-xs break-all">{JSON.stringify(value)}</code>;
  }
  return <span className="break-words">{String(value)}</span>;
}

/** Admin audit log: every recorded action with its raw metadata (ids resolved to names). */
export function AuditLogList({
  items,
  names,
  loading,
  filtered,
}: {
  items: AuditLogItem[] | undefined;
  names: MemberNames;
  loading?: boolean;
  filtered?: boolean;
}) {
  const { currencyCode } = useCurrentRoom();

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <EmptyState
        icon={ScrollTextIcon}
        title={filtered ? "No matching audit entries" : "The audit log is empty"}
        description="Approvals, payouts, adjustments and role changes are recorded here."
      />
    );
  }

  return (
    <ul className="divide-y rounded-xl border">
      {items.map((item) => {
        const { icon: Icon } = describeActivity({ ...item, details: {} });
        const entries = Object.entries(item.metadata ?? {});
        return (
          <li key={item.id}>
            <details className="group">
              <summary className="hover:bg-muted/40 flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
                <ChevronRightIcon className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-90" />
                <Icon className="text-muted-foreground size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{item.actor.fullName}</span>{" "}
                    <code className="bg-muted rounded px-1 text-xs">{item.action}</code>
                  </p>
                  <p
                    className="text-muted-foreground text-xs"
                    title={formatDateTime(item.createdAt)}
                  >
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="outline" className="hidden font-normal sm:inline-flex">
                  {item.entityType}
                </Badge>
              </summary>
              <dl className="bg-muted/30 grid gap-x-4 gap-y-2 border-t px-10 py-3 text-sm sm:grid-cols-[max-content_1fr]">
                <dt className="text-muted-foreground">Entity</dt>
                <dd>
                  {item.entityType} · <code className="text-xs break-all">{item.entityId}</code>
                </dd>
                <dt className="text-muted-foreground">When</dt>
                <dd>{formatDateTime(item.createdAt)}</dd>
                {entries.map(([key, value]) => (
                  <div key={key} className="contents">
                    <dt className="text-muted-foreground">{humanizeKey(key)}</dt>
                    <dd>
                      <MetadataValue
                        name={key}
                        value={value}
                        names={names}
                        currencyCode={currencyCode}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
