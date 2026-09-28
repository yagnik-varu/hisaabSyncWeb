"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { OutstandingMoneyNotice } from "@/components/members/outstanding-money-notice";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { RoleBadge } from "@/components/shared/badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useMemberMutations } from "@/hooks/use-members";
import type { RoomMemberItem } from "@/types/api";

/**
 * Leave requests aren't a separate resource: they're members whose status is LEAVE_REQUESTED,
 * and the approve/reject routes take the member's userId (docs/05 #12).
 */
export function LeaveRequestsList({ members }: { members: RoomMemberItem[] }) {
  const { roomId, can, isArchived } = useCurrentRoom();
  const { approveLeaveRequest, rejectLeaveRequest } = useMemberMutations(roomId);
  const canDecide = can("leaveRequests.review") && !isArchived;

  return (
    <ul className="divide-y rounded-xl border">
      {members.map((m) => (
        <li
          key={m.userId}
          className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar name={m.fullName} className="size-9" />
            <div className="min-w-0">
              <p className="truncate font-medium">{m.fullName}</p>
              <p className="text-muted-foreground text-sm">Wants to leave the room</p>
            </div>
            <RoleBadge role={m.role} />
          </div>
          {canDecide ? (
            <div className="flex shrink-0 gap-1">
              <ConfirmDialog
                trigger={
                  <Button size="sm" variant="outline">
                    <CheckIcon />
                    Approve
                  </Button>
                }
                title={`Let ${m.fullName} leave?`}
                description="They'll be moved to former members. Their history stays in the room."
                confirmLabel="Approve"
                onConfirm={() =>
                  approveLeaveRequest
                    .mutateAsync(m.userId)
                    .then(() => toast.success(`${m.fullName} left the room`))
                }
              >
                <OutstandingMoneyNotice userId={m.userId} />
              </ConfirmDialog>
              <ConfirmDialog
                trigger={
                  <Button size="sm" variant="ghost">
                    <XIcon />
                    Reject
                  </Button>
                }
                title={`Keep ${m.fullName} in the room?`}
                description="Their access is restored as an active member."
                confirmLabel="Reject request"
                reason={{
                  label: "Reason",
                  placeholder: "Please settle your dues first",
                  description: "Not stored by the server at the moment; tell them directly too.",
                }}
                onConfirm={(reason) =>
                  rejectLeaveRequest
                    .mutateAsync({ userId: m.userId, reason })
                    .then(() => toast.success("Leave request rejected"))
                }
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Waiting for an admin</p>
          )}
        </li>
      ))}
    </ul>
  );
}
