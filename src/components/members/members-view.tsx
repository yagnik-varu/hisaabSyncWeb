"use client";

import { formatDistanceToNow } from "date-fns";
import { ChevronDownIcon, UsersIcon } from "lucide-react";
import { useState } from "react";

import { JoinRequestsList } from "@/components/approvals/join-requests-list";
import { LeaveRequestsList } from "@/components/members/leave-requests-list";
import { LeaveRoomButton } from "@/components/members/leave-room-button";
import { MemberActionsMenu } from "@/components/members/member-actions-menu";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { RoleBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError } from "@/components/shared/form-error";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useJoinRequests } from "@/hooks/use-join-requests";
import { useRoomMembers } from "@/hooks/use-treasury";
import { normalizeError } from "@/lib/api/errors";
import { formatDate } from "@/lib/dates";
import type { Role, RoomMemberItem } from "@/types/api";

const ROLE_ORDER: Record<Role, number> = { ADMIN: 0, ACCOUNTANT: 1, MEMBER: 2 };

export function MembersView() {
  const { roomId, can, isArchived } = useCurrentRoom();
  const { user } = useAuth();
  const members = useRoomMembers(roomId);
  const joins = useJoinRequests(roomId, can("joinRequests.view"));
  const [showFormer, setShowFormer] = useState(false);

  if (members.isError) return <FormError message={normalizeError(members.error).message} />;

  const all = members.data ?? [];
  const active = all
    .filter((m) => m.status === "ACTIVE")
    .sort(
      (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.fullName.localeCompare(b.fullName),
    );
  const leaving = all.filter((m) => m.status === "LEAVE_REQUESTED");
  const former = all.filter((m) => m.status === "LEFT");
  const activeAdmins = active.filter((m) => m.role === "ADMIN").length;
  const me = active.find((m) => m.userId === user?.id);
  const isLastAdmin = me?.role === "ADMIN" && activeAdmins <= 1;
  const pendingJoins = joins.data?.filter((r) => r.status === "PENDING").length ?? 0;
  const canManage = can("members.changeRole") && !isArchived;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              Members{" "}
              {!members.isPending && (
                <span className="text-muted-foreground font-normal">({active.length})</span>
              )}
            </h2>
            <p className="text-muted-foreground text-sm">
              Roles apply to this room only.
              {canManage && " You can't change your own role or remove yourself."}
            </p>
          </div>
          <LeaveRoomButton isLastAdmin={isLastAdmin} />
        </div>

        {members.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : active.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No active members" />
        ) : (
          <ul className="divide-y rounded-xl border">
            {active.map((m) => (
              <MemberRow
                key={m.userId}
                member={m}
                isMe={m.userId === user?.id}
                actions={
                  canManage && m.userId !== user?.id ? <MemberActionsMenu member={m} /> : null
                }
              />
            ))}
          </ul>
        )}
      </section>

      {leaving.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Leave requests ({leaving.length})</h2>
            <p className="text-muted-foreground text-sm">
              These members can&apos;t open the room until an admin decides.
            </p>
          </div>
          <LeaveRequestsList members={leaving} />
        </section>
      )}

      {can("joinRequests.view") && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">
              Join requests{pendingJoins > 0 ? ` (${pendingJoins})` : ""}
            </h2>
            <p className="text-muted-foreground text-sm">
              People who entered the room code and are waiting to be let in.
            </p>
          </div>
          <JoinRequestsList requests={joins.data} loading={joins.isPending} error={joins.error} />
        </section>
      )}

      {former.length > 0 && (
        <section className="space-y-3">
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => setShowFormer((v) => !v)}
            aria-expanded={showFormer}
          >
            <ChevronDownIcon
              className={showFormer ? "rotate-180 transition-transform" : "transition-transform"}
            />
            Former members ({former.length})
          </Button>
          {showFormer && (
            <ul className="divide-y rounded-xl border opacity-80">
              {former.map((m) => (
                <MemberRow key={m.userId} member={m} isMe={false} former />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function MemberRow({
  member,
  isMe,
  former,
  actions,
}: {
  member: RoomMemberItem;
  isMe: boolean;
  former?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar name={member.fullName} className="size-9" />
        <div className="min-w-0">
          <p className="truncate font-medium">
            {member.fullName}
            {isMe && <span className="text-muted-foreground font-normal"> (you)</span>}
          </p>
          <p className="text-muted-foreground text-xs" title={formatDate(member.joinedAt)}>
            {former
              ? `Joined ${formatDate(member.joinedAt)}`
              : `Joined ${formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}`}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!former && <RoleBadge role={member.role} />}
        {actions}
      </div>
    </li>
  );
}
