"use client";

import { CalculatorIcon, CrownIcon, EllipsisIcon, UserIcon, UserMinusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { OutstandingMoneyNotice } from "@/components/members/outstanding-money-notice";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemberMutations } from "@/hooks/use-members";
import type { Role, RoomMemberItem } from "@/types/api";

const ROLE_OPTIONS: { role: Role; label: string; icon: typeof UserIcon; explain: string }[] = [
  {
    role: "ADMIN",
    label: "Make admin",
    icon: CrownIcon,
    explain: "Admins have full control: settings, members, roles, approvals and adjustments.",
  },
  {
    role: "ACCOUNTANT",
    label: "Make accountant",
    icon: CalculatorIcon,
    explain:
      "Accountants approve contributions and expenses, pay reimbursements and manage categories.",
  },
  {
    role: "MEMBER",
    label: "Make member",
    icon: UserIcon,
    explain: "Members submit contributions and expenses and can see everything, but can't approve.",
  },
];

type PendingAction = { kind: "role"; role: Role } | { kind: "remove" } | null;

/**
 * Admin-only "…" menu on a member row. Confirmations are CONTROLLED dialogs rendered next to the
 * menu (a dialog inside a DropdownMenuItem would unmount the moment the menu closes).
 */
export function MemberActionsMenu({ member }: { member: RoomMemberItem }) {
  const { roomId } = useCurrentRoom();
  const { changeRole, remove } = useMemberMutations(roomId);
  const [action, setAction] = useState<PendingAction>(null);

  const roleOption =
    action?.kind === "role" ? ROLE_OPTIONS.find((o) => o.role === action.role) : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Manage ${member.fullName}`}
          >
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-muted-foreground text-xs">
            Change role
          </DropdownMenuLabel>
          {ROLE_OPTIONS.filter((o) => o.role !== member.role).map((o) => (
            <DropdownMenuItem
              key={o.role}
              onSelect={() => setAction({ kind: "role", role: o.role })}
            >
              <o.icon />
              {o.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setAction({ kind: "remove" })}>
            <UserMinusIcon />
            Remove from room
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={!!roleOption}
        onOpenChange={(open) => !open && setAction(null)}
        title={roleOption ? `Make ${member.fullName} ${roleLabel(roleOption.role)}?` : ""}
        description={roleOption?.explain}
        confirmLabel="Change role"
        onConfirm={async () => {
          if (!roleOption) return;
          await changeRole.mutateAsync({ userId: member.userId, role: roleOption.role });
          toast.success(`${member.fullName} is now ${roleLabel(roleOption.role)}`);
        }}
      />

      <ConfirmDialog
        open={action?.kind === "remove"}
        onOpenChange={(open) => !open && setAction(null)}
        title={`Remove ${member.fullName}?`}
        description="They lose access to the room immediately. Their history (contributions, expenses, ledger entries) stays."
        confirmLabel="Remove"
        destructive
        onConfirm={() =>
          remove
            .mutateAsync(member.userId)
            .then(() => toast.success(`${member.fullName} was removed`))
        }
      >
        {action?.kind === "remove" && <OutstandingMoneyNotice userId={member.userId} />}
      </ConfirmDialog>
    </>
  );
}

function roleLabel(role: Role) {
  return role === "ADMIN" ? "an admin" : role === "ACCOUNTANT" ? "an accountant" : "a member";
}
