import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  CheckIcon,
  CircleCheckIcon,
  HandCoinsIcon,
  LockIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  WavesIcon,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "@/components/landing/section-heading";
import { addMoney, formatMoney, isNegative } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="features-title"
          eyebrow="Features"
          title="Serious about money. Easy on friendships."
          description="Everything a shared pool needs, and nothing that gets in the way."
        />

        {/* grid-cols-1 = minmax(0, 1fr): without it, long no-wrap text can widen the column past the screen. */}
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            className="md:col-span-2"
            title="A ledger nobody can quietly edit"
            text="Every rupee in and out is written down and never deleted. Mistakes are fixed with a visible adjustment, not a silent edit."
            badge={
              <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
                <LockIcon className="size-3" />
                Append-only
              </span>
            }
          >
            <LedgerVisual />
          </FeatureCard>

          <FeatureCard
            title="Strict or flexible pool"
            text="Strict rooms hold paybacks until the pool can cover them. Flexible rooms can dip below zero while someone fronts the cash."
          >
            <div className="space-y-2">
              <ModeOption icon={ShieldCheckIcon} title="Strict" text="Never below ₹0" selected />
              <ModeOption icon={WavesIcon} title="Flexible" text="Can go negative" />
            </div>
          </FeatureCard>

          <FeatureCard
            title="One inbox for approvals"
            text="Admins and accountants review money in, spends, paybacks and join requests in one place."
          >
            <InboxVisual />
          </FeatureCard>

          <FeatureCard
            title="Everyone stays in the loop"
            text="A shared activity feed, plus a notification when your money is approved, rejected or paid back."
          >
            <NotificationsVisual />
          </FeatureCard>

          <FeatureCard
            title="Precise to the paisa"
            text="Amounts are stored as exact decimals, never floating-point guesses. Each room picks its own currency."
          >
            <PrecisionVisual />
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  text,
  badge,
  className,
  children,
}: {
  title: string;
  text: string;
  badge?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("bg-card flex flex-col gap-6 rounded-3xl border p-6 sm:p-7", className)}>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {badge}
        </div>
        <p className="text-muted-foreground mt-2 text-sm text-pretty">{text}</p>
      </div>
      <div aria-hidden className="mt-auto">
        {children}
      </div>
    </div>
  );
}

const LEDGER = [
  {
    title: "Aarav added money",
    detail: "Contribution · approved by Meera",
    amount: "2000.00",
    when: "Today",
  },
  {
    title: "Paid back Priya",
    detail: "Groceries · marked paid by Meera",
    amount: "-860.00",
    when: "Today",
  },
  {
    title: "Balance adjustment",
    detail: "Cash found in the kitty jar · admin",
    amount: "150.00",
    when: "Mon",
  },
  {
    title: "Paid back Rohan",
    detail: "Wi-Fi bill · marked paid by Aarav",
    amount: "-999.00",
    when: "Sun",
  },
];

function LedgerVisual() {
  return (
    <ul className="divide-y rounded-2xl border">
      {LEDGER.map((entry) => {
        const out = isNegative(entry.amount);
        const Icon = out ? ArrowUpRightIcon : ArrowDownLeftIcon;
        return (
          <li key={entry.title} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                out
                  ? "bg-muted text-muted-foreground"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{entry.title}</span>
              <span className="text-muted-foreground block truncate text-xs">{entry.detail}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end">
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  !out && "text-emerald-700 dark:text-emerald-400",
                )}
              >
                {formatMoney(entry.amount, "INR", { signed: true })}
              </span>
              <span className="text-muted-foreground text-xs">{entry.when}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ModeOption({
  icon: Icon,
  title,
  text,
  selected,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  selected?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3",
        selected && "border-emerald-500/50 bg-emerald-500/5",
      )}
    >
      <Icon
        className={cn(
          "size-5 shrink-0",
          selected ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="text-muted-foreground block text-xs">{text}</span>
      </span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-emerald-600 dark:border-emerald-400" : "border-muted-foreground/40",
        )}
      >
        {selected ? (
          <span className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
        ) : null}
      </span>
    </div>
  );
}

const INBOX: { icon: LucideIcon; label: string; count: number }[] = [
  { icon: HandCoinsIcon, label: "Contributions", count: 2 },
  { icon: ReceiptIcon, label: "Expenses", count: 1 },
  { icon: BanknoteIcon, label: "To pay back", count: 1 },
  { icon: UserPlusIcon, label: "Join requests", count: 1 },
];

function InboxVisual() {
  return (
    <ul className="space-y-1.5">
      {INBOX.map(({ icon: Icon, label, count }) => (
        <li key={label} className="bg-muted/50 flex items-center gap-3 rounded-xl px-3 py-2">
          <Icon className="text-muted-foreground size-4" />
          <span className="flex-1 text-sm">{label}</span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            {count}
          </span>
        </li>
      ))}
    </ul>
  );
}

const NOTIFICATIONS = [
  {
    icon: CircleCheckIcon,
    tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    title: "Your ₹2,000 was approved",
    when: "2m",
    unread: true,
  },
  {
    icon: BanknoteIcon,
    tone: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    title: "Meera paid you back ₹860",
    when: "1h",
    unread: true,
  },
  {
    icon: UserPlusIcon,
    tone: "bg-muted text-muted-foreground",
    title: "Kabir joined Flat 4B",
    when: "1d",
    unread: false,
  },
];

function NotificationsVisual() {
  return (
    <ul className="space-y-1.5">
      {NOTIFICATIONS.map(({ icon: Icon, tone, title, when, unread }) => (
        <li key={title} className="flex items-center gap-3 rounded-xl border px-3 py-2">
          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", tone)}>
            <Icon className="size-3.5" />
          </span>
          <span className={cn("min-w-0 flex-1 truncate text-sm", unread && "font-medium")}>
            {title}
          </span>
          <span className="text-muted-foreground text-xs">{when}</span>
          <span
            className={cn("size-2 shrink-0 rounded-full", unread ? "bg-sky-500" : "bg-transparent")}
          />
        </li>
      ))}
    </ul>
  );
}

function PrecisionVisual() {
  // The real money helper doing the sum: decimal maths, so this is exactly ₹0.30.
  const total = addMoney("0.10", "0.20");
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-2xl p-4 font-mono">
        <p className="text-muted-foreground text-xs line-through decoration-rose-500/70">
          0.1 + 0.2 = 0.30000000000000004
        </p>
        <p className="mt-1.5 flex items-center gap-2 text-base font-semibold tabular-nums sm:text-lg">
          <span>
            {formatMoney("0.10")} + {formatMoney("0.20")} = {formatMoney(total)}
          </span>
          <CheckIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["₹ INR", "$ USD", "€ EUR", "£ GBP", "A$ AUD"].map((currency) => (
          <span key={currency} className="rounded-full border px-2.5 py-1 text-xs font-medium">
            {currency}
          </span>
        ))}
      </div>
    </div>
  );
}
