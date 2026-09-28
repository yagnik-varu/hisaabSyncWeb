"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckIcon, UserPlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError } from "@/components/shared/form-error";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useJoinRequestMutations } from "@/hooks/use-join-requests";
import { useRoomMembers } from "@/hooks/use-treasury";
import { normalizeError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/dates";
import type { JoinRequestWithUser, MemberStatus } from "@/types/api";

/**
 * Pending join requests. Accountants can see them; only admins decide.
 *
 * Backend #18: approving a user who already has a membership row (current OR former member) fails
 * on a unique constraint. We detect that from the members list and only offer "Reject" with an
 * explanation, instead of letting the admin hit an error.
 */
export function JoinRequestsList({
  requests,
  loading,
  error,
}: {
  requests: JoinRequestWithUser[] | undefined;
  loading: boolean;
  error: unknown;
}) {
  const { roomId, can, isArchived } = useCurrentRoom();
  const members = useRoomMembers(roomId);
  const { approve, reject } = useJoinRequestMutations(roomId);
  const canDecide = can("joinRequests.review") && !isArchived;

  if (error) return <FormError message={normalizeError(error).message} />;
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const pending = (requests ?? []).filter((r) => r.status === "PENDING");
  if (pending.length === 0) {
    return (
      <EmptyState
        icon={UserPlusIcon}
        title="No pending join requests"
        description="Share the room code; requests to join show up here."
      />
    );
  }

  const membershipOf = new Map<string, MemberStatus>(
    (members.data ?? []).map((m) => [m.userId, m.status]),
  );

  return (
    <ul className="divide-y rounded-xl border">
      {pending.map((request) => {
        const membership = membershipOf.get(request.userId);
        const blockedReason =
          membership === "LEFT"
            ? "Former member: re-joining isn't supported by the server yet."
            : membership
              ? "Already a member of this room."
              : null;

        return (
          <li
            key={request.id}
            className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar name={request.user.fullName} className="size-9" />
              <div className="min-w-0">
                <p className="truncate font-medium">{request.user.fullName}</p>
                <p className="text-muted-foreground truncate text-sm">{request.user.email}</p>
                <p
                  className="text-muted-foreground text-xs"
                  title={formatDateTime(request.createdAt)}
                >
                  Requested {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </p>
              </div>
              {blockedReason && (
                <Badge variant="secondary" className="shrink-0">
                  {membership === "LEFT" ? "Former member" : "Already a member"}
                </Badge>
              )}
            </div>

            {canDecide ? (
              <div className="flex shrink-0 gap-1 sm:justify-end">
                {blockedReason ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* span wrapper: disabled buttons don't fire hover events for the tooltip */}
                      <span tabIndex={0}>
                        <Button size="sm" variant="outline" disabled>
                          <CheckIcon />
                          Approve
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{blockedReason}</TooltipContent>
                  </Tooltip>
                ) : (
                  <ConfirmDialog
                    trigger={
                      <Button size="sm" variant="outline">
                        <CheckIcon />
                        Approve
                      </Button>
                    }
                    title={`Add ${request.user.fullName} to the room?`}
                    description="They'll join as a Member and can see the treasury, ledger and all expenses."
                    confirmLabel="Approve"
                    onConfirm={() =>
                      approve.mutateAsync(request.id).then(() => {
                        toast.success(`${request.user.fullName} joined the room`);
                      })
                    }
                  />
                )}
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="ghost">
                      <XIcon />
                      Reject
                    </Button>
                  }
                  title={`Reject ${request.user.fullName}'s request?`}
                  confirmLabel="Reject"
                  destructive
                  reason={{ label: "Reason", placeholder: "We don't know you, sorry!" }}
                  onConfirm={(reason) =>
                    reject.mutateAsync({ requestId: request.id, reason }).then(() => {
                      toast.success("Request rejected");
                    })
                  }
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Only admins can approve</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
