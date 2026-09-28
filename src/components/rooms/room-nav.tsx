"use client";

import {
  ActivityIcon,
  ArrowLeftRightIcon,
  HandCoinsIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LandmarkIcon,
  ReceiptIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { useApprovalCounts } from "@/hooks/use-approval-counts";
import type { Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface NavItem {
  segment: string; // "" = overview
  label: string;
  icon: LucideIcon;
  permission?: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { segment: "", label: "Overview", icon: LayoutDashboardIcon },
  { segment: "approvals", label: "Approvals", icon: InboxIcon, permission: "contributions.review" },
  { segment: "contributions", label: "Contributions", icon: HandCoinsIcon },
  { segment: "expenses", label: "Expenses", icon: ReceiptIcon },
  { segment: "reimbursements", label: "Reimbursements", icon: ArrowLeftRightIcon },
  { segment: "treasury", label: "Treasury", icon: LandmarkIcon },
  { segment: "members", label: "Members", icon: UsersIcon },
  { segment: "activity", label: "Activity", icon: ActivityIcon },
  { segment: "settings", label: "Settings", icon: SettingsIcon, permission: "categories.create" },
];

/**
 * Room section tabs for tablets/desktop (md+). Phones use RoomBottomNav instead.
 */
export function RoomNav() {
  const { roomId, can } = useCurrentRoom();
  const pathname = usePathname();
  const base = `/rooms/${roomId}`;
  const { total: pendingApprovals } = useApprovalCounts();

  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6" aria-label="Room sections">
      <ul className="flex min-w-max gap-1 border-b">
        {NAV_ITEMS.filter((item) => !item.permission || can(item.permission)).map((item) => {
          const href = item.segment ? `${base}/${item.segment}` : base;
          const active = item.segment
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === base;
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground hover:text-foreground -mb-px flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm font-medium transition-colors",
                  active && "border-primary text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
                {item.segment === "approvals" && pendingApprovals > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs tabular-nums">
                    {pendingApprovals}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
