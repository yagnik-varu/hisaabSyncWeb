"use client";

import {
  ActivityIcon,
  ArrowLeftRightIcon,
  ChevronRightIcon,
  EllipsisIcon,
  HandCoinsIcon,
  HomeIcon,
  InboxIcon,
  LandmarkIcon,
  LayoutGridIcon,
  PlusIcon,
  ReceiptIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SubmitContributionDialog } from "@/components/contributions/submit-contribution-dialog";
import { SubmitExpenseDialog } from "@/components/expenses/submit-expense-dialog";
import { InviteButton } from "@/components/rooms/invite-button";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { RoleBadge } from "@/components/shared/badges";
import { CopyButton } from "@/components/shared/copy-button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useApprovalCounts } from "@/hooks/use-approval-counts";
import type { Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface Section {
  segment: string;
  label: string;
  icon: LucideIcon;
  permission?: Permission;
  description?: string;
}

/** Everything reachable from "More" (sections not in the bar itself). */
const MORE_SECTIONS: Section[] = [
  {
    segment: "contributions",
    label: "Contributions",
    icon: HandCoinsIcon,
    description: "Money members put in",
  },
  {
    segment: "reimbursements",
    label: "Reimbursements",
    icon: ArrowLeftRightIcon,
    description: "What the pool owes and paid back",
  },
  {
    segment: "treasury",
    label: "Treasury & ledger",
    icon: LandmarkIcon,
    description: "Balance and every transaction",
  },
  {
    segment: "members",
    label: "Members",
    icon: UsersIcon,
    description: "Roles, join and leave requests",
  },
  {
    segment: "activity",
    label: "Activity",
    icon: ActivityIcon,
    description: "What happened, and when",
  },
  {
    segment: "settings",
    label: "Settings",
    icon: SettingsIcon,
    permission: "categories.create",
    description: "Categories and room details",
  },
];

type Sheet = "actions" | "more" | null;
type Form = "contribution" | "expense" | null;

/**
 * Phone navigation for a room (hidden from `md` up, where the top tabs are used).
 * Thumb-zone layout: Home · Expenses · [+] · Approvals/Payouts · More.
 */
export function RoomBottomNav() {
  const { roomId, room, myRole, can, isArchived } = useCurrentRoom();
  const pathname = usePathname();
  const base = `/rooms/${roomId}`;
  const [sheet, setSheet] = useState<Sheet>(null);
  const [form, setForm] = useState<Form>(null);

  const reviewer = can("contributions.review");
  const { total: pending } = useApprovalCounts();
  const fourth: Section = reviewer
    ? { segment: "approvals", label: "Approvals", icon: InboxIcon }
    : { segment: "reimbursements", label: "Payouts", icon: ArrowLeftRightIcon };

  const isActive = (segment: string) => {
    const href = segment ? `${base}/${segment}` : base;
    return segment ? pathname === href || pathname.startsWith(`${href}/`) : pathname === base;
  };
  const moreSections = MORE_SECTIONS.filter(
    (s) => (!s.permission || can(s.permission)) && s.segment !== fourth.segment,
  );
  const moreActive = moreSections.some((s) => isActive(s.segment));

  /**
   * Swap the "+" sheet for the chosen form in one step.
   * (Don't wait for vaul's onAnimationEnd: it only fires for user-initiated closes (drag/overlay),
   * never when `open` is changed from code, so a queued form would never open.)
   */
  function chooseForm(next: Form) {
    setSheet(null);
    setForm(next);
  }

  return (
    <>
      <nav
        aria-label="Room"
        className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-stretch">
          <NavTab href={base} label="Home" icon={HomeIcon} active={isActive("")} />
          <NavTab
            href={`${base}/expenses`}
            label="Expenses"
            icon={ReceiptIcon}
            active={isActive("expenses")}
          />
          <li className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setSheet("actions")}
              disabled={isArchived}
              aria-label="Add money or log an expense"
              className="bg-primary text-primary-foreground focus-visible:ring-ring/50 ring-background flex size-13 -translate-y-3 items-center justify-center rounded-full shadow-lg ring-4 transition-transform outline-none focus-visible:ring-3 active:scale-95 disabled:opacity-40"
            >
              <PlusIcon className="size-6" />
            </button>
          </li>
          <NavTab
            href={`${base}/${fourth.segment}`}
            label={fourth.label}
            icon={fourth.icon}
            active={isActive(fourth.segment)}
            badge={reviewer ? pending : 0}
          />
          <li>
            <button
              type="button"
              onClick={() => setSheet("more")}
              aria-current={moreActive ? "page" : undefined}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                moreActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <EllipsisIcon className="size-5" />
              More
            </button>
          </li>
        </ul>
      </nav>

      {/* "+" action sheet */}
      <Drawer open={sheet === "actions"} onOpenChange={(open) => !open && setSheet(null)}>
        {/* No focus return to the "+" button on close: the form sheet opening now owns focus. */}
        <DrawerContent onCloseAutoFocus={(event) => event.preventDefault()}>
          <DrawerHeader className="group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
            <DrawerTitle>Add to {room.name}</DrawerTitle>
            <DrawerDescription>Both need approval by an admin or accountant.</DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-2 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <ActionRow
              icon={HandCoinsIcon}
              title="Add money to the pool"
              description="You paid into the room treasury"
              onClick={() => chooseForm("contribution")}
            />
            <ActionRow
              icon={ReceiptIcon}
              title="Log a shared expense"
              description="You paid for something the room shares"
              onClick={() => chooseForm("expense")}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* "More" sheet */}
      <Drawer open={sheet === "more"} onOpenChange={(open) => !open && setSheet(null)}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
            <div className="flex items-center gap-2">
              <DrawerTitle className="truncate">{room.name}</DrawerTitle>
              <RoleBadge role={myRole} />
            </div>
            <DrawerDescription className="flex items-center gap-1">
              Code{" "}
              <span className="text-foreground font-mono font-medium tracking-wider">
                {room.roomCode}
              </span>
              <CopyButton value={room.roomCode} label="Copy room code" className="size-8" />
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <ul className="divide-y rounded-xl border">
              {moreSections.map((s) => (
                <li key={s.segment}>
                  <Link
                    href={`${base}/${s.segment}`}
                    onClick={() => setSheet(null)}
                    aria-current={isActive(s.segment) ? "page" : undefined}
                    className="active:bg-muted flex items-center gap-3 px-3 py-3"
                  >
                    <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <s.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{s.label}</span>
                      {s.description && (
                        <span className="text-muted-foreground block truncate text-sm">
                          {s.description}
                        </span>
                      )}
                    </span>
                    <ChevronRightIcon className="text-muted-foreground size-4" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <InviteButton />
              <Link
                href="/rooms"
                onClick={() => setSheet(null)}
                className="hover:bg-muted flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium"
              >
                <LayoutGridIcon className="size-4" />
                All rooms
              </Link>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <SubmitContributionDialog
        open={form === "contribution"}
        onOpenChange={(open) => !open && setForm(null)}
      />
      <SubmitExpenseDialog
        open={form === "expense"}
        onOpenChange={(open) => !open && setForm(null)}
      />
    </>
  );
}

function NavTab({
  href,
  label,
  icon: Icon,
  active,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <span className="relative">
          <Icon className={cn("size-5", active && "stroke-[2.5]")} />
          {badge > 0 && (
            <span className="bg-destructive absolute -top-1.5 -right-2.5 min-w-4 rounded-full px-1 text-center text-[10px] leading-4 font-semibold text-white tabular-nums">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>
        {label}
      </Link>
    </li>
  );
}

function ActionRow({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="active:bg-muted hover:bg-muted/60 flex items-center gap-3 rounded-xl border p-3 text-left"
    >
      <span className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="text-muted-foreground block text-sm">{description}</span>
      </span>
    </button>
  );
}
