"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { RoleBadge } from "@/components/shared/badges";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/api";

const ROLES: { role: Role; label: string; who: string }[] = [
  {
    role: "ADMIN",
    label: "Admin",
    who: "Usually whoever opened the room. Runs it and has the final say.",
  },
  {
    role: "ACCOUNTANT",
    label: "Accountant",
    who: "The friend who's good with money. Keeps the books without running the room.",
  },
  {
    role: "MEMBER",
    label: "Member",
    who: "Everyone else. Adds money, logs spends and can see every rupee.",
  },
];

/** The role matrix from docs/02 §3, in plain words. */
const CAPABILITIES: { label: string; roles: Role[] }[] = [
  { label: "See the balance, ledger and activity", roles: ["ADMIN", "ACCOUNTANT", "MEMBER"] },
  { label: "Add money and log expenses", roles: ["ADMIN", "ACCOUNTANT", "MEMBER"] },
  { label: "Approve money in and expenses", roles: ["ADMIN", "ACCOUNTANT"] },
  { label: "Mark paybacks as paid", roles: ["ADMIN", "ACCOUNTANT"] },
  { label: "Let people join or leave", roles: ["ADMIN"] },
  { label: "Change roles and remove members", roles: ["ADMIN"] },
  { label: "Adjust the balance and room settings", roles: ["ADMIN"] },
];

/** Phones: a segmented control picks one role. From `lg`, all three cards sit side by side. */
export function RoleSwitcher() {
  const [selected, setSelected] = useState<Role>("ADMIN");

  return (
    <>
      <div
        role="group"
        aria-label="Choose a role"
        className="bg-muted mx-auto mt-10 grid max-w-md grid-cols-3 gap-1 rounded-2xl p-1 lg:hidden"
      >
        {ROLES.map(({ role, label }) => (
          <button
            key={role}
            type="button"
            aria-pressed={selected === role}
            onClick={() => setSelected(role)}
            className={cn(
              "focus-visible:ring-ring/50 h-10 rounded-xl text-sm font-medium transition-colors outline-none focus-visible:ring-3",
              selected === role
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-4 grid max-w-md grid-cols-1 gap-4 lg:mt-12 lg:max-w-none lg:grid-cols-3">
        {ROLES.map(({ role, who }) => (
          <RoleCard
            key={role}
            role={role}
            who={who}
            className={cn(selected !== role && "hidden lg:flex")}
          />
        ))}
      </div>
    </>
  );
}

function RoleCard({ role, who, className }: { role: Role; who: string; className?: string }) {
  const allowed = CAPABILITIES.filter((c) => c.roles.includes(role)).length;

  return (
    <div className={cn("bg-card flex flex-col rounded-3xl border p-6", className)}>
      <div className="flex items-center justify-between gap-2">
        <RoleBadge role={role} className="h-6 px-2.5 text-sm" />
        <span className="text-muted-foreground text-xs tabular-nums">
          {allowed} of {CAPABILITIES.length}
        </span>
      </div>
      <p className="text-muted-foreground mt-3 text-sm text-pretty">{who}</p>
      <ul className="mt-5 space-y-2.5">
        {CAPABILITIES.map(({ label, roles }) => {
          const can = roles.includes(role);
          return (
            <li
              key={label}
              className={cn("flex items-start gap-2.5 text-sm", !can && "text-muted-foreground")}
            >
              <span
                className={cn(
                  "mt-px flex size-5 shrink-0 items-center justify-center rounded-full",
                  can
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {can ? <CheckIcon className="size-3" /> : <XIcon className="size-3" />}
              </span>
              <span className={cn(!can && "line-through decoration-1 opacity-70")}>
                <span className="sr-only">{can ? "Can: " : "Cannot: "}</span>
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
