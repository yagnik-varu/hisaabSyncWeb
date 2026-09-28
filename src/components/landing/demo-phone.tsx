"use client";

import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BatteryFullIcon,
  BellIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  ClockIcon,
  EllipsisIcon,
  HandCoinsIcon,
  HomeIcon,
  InboxIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SignalIcon,
  WalletIcon,
  WifiIcon,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { flatmate, type Flatmate } from "@/components/landing/people";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Money } from "@/types/api";

/**
 * Hero demo: a phone showing a room's Home screen while the core loop plays out
 * (chip in → approve → spend → owed → paid back).
 *
 * Every number is precomputed as a string and only formatted with formatMoney(), so the
 * "no float maths on money" rule holds even for a fake room: 8,400 + 2,000 = 10,400; 10,400 − 860
 * = 9,540; money in 21,600 → 23,600; paid out 13,200 → 14,060.
 */

/** How long each step stays on screen while playing (also drives the CSS toast + progress bar). */
const STEP_MS = 3400;

type RowStatus = "PENDING" | "APPROVED" | "PENDING_PAYMENT" | "PAID";

/** Same colours and labels as StatusBadge (components/shared/badges.tsx), at mock-up size. */
const STATUS_PILL: Record<RowStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  PENDING_PAYMENT: {
    label: "Awaiting payment",
    className: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  },
  PAID: { label: "Paid", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
};

const TOAST_TONE = {
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
} as const;

interface DemoRow {
  id: string;
  who: Flatmate;
  detail: string;
  amount: Money;
  moneyIn?: boolean;
  status: RowStatus;
}

interface DemoStep {
  label: string;
  caption: string;
  balance: Money;
  moneyIn: Money;
  paidOut: Money;
  toast: { icon: LucideIcon; tone: keyof typeof TOAST_TONE; title: string; body: string };
  rows: DemoRow[];
}

const kabirTopUp: DemoRow = {
  id: "kabir",
  who: flatmate("Kabir"),
  detail: "Added to the pool",
  amount: "3000.00",
  moneyIn: true,
  status: "APPROVED",
};
const wifiBill: DemoRow = {
  id: "wifi",
  who: flatmate("Rohan"),
  detail: "Wi-Fi bill",
  amount: "999.00",
  status: "PAID",
};
const aaravTopUp = (status: RowStatus): DemoRow => ({
  id: "aarav",
  who: flatmate("Aarav"),
  detail: "Added to the pool",
  amount: "2000.00",
  moneyIn: true,
  status,
});
const priyaGroceries = (status: RowStatus, detail: string): DemoRow => ({
  id: "priya",
  who: flatmate("Priya"),
  detail,
  amount: "860.00",
  status,
});

const STEPS: DemoStep[] = [
  {
    label: "Chip in",
    caption: "Aarav adds ₹2,000 to the pool. It waits for a quick check.",
    balance: "8400.00",
    moneyIn: "21600.00",
    paidOut: "13200.00",
    toast: {
      icon: HandCoinsIcon,
      tone: "amber",
      title: "New contribution",
      body: "Aarav wants to add ₹2,000",
    },
    rows: [aaravTopUp("PENDING"), kabirTopUp, wifiBill],
  },
  {
    label: "Approve",
    caption: "Meera, the accountant, confirms it arrived. The balance goes up.",
    balance: "10400.00",
    moneyIn: "23600.00",
    paidOut: "13200.00",
    toast: {
      icon: CircleCheckIcon,
      tone: "emerald",
      title: "Contribution approved",
      body: "₹2,000 is now in the pool",
    },
    rows: [aaravTopUp("APPROVED"), kabirTopUp, wifiBill],
  },
  {
    label: "Spend",
    caption: "Priya buys the week's groceries with her own money and logs the bill.",
    balance: "10400.00",
    moneyIn: "23600.00",
    paidOut: "13200.00",
    toast: {
      icon: ReceiptIcon,
      tone: "amber",
      title: "New expense",
      body: "Priya spent ₹860 on groceries",
    },
    rows: [priyaGroceries("PENDING", "Groceries"), aaravTopUp("APPROVED"), kabirTopUp],
  },
  {
    label: "Owed",
    caption: "Once it's approved, the pool owes Priya ₹860 — automatically.",
    balance: "10400.00",
    moneyIn: "23600.00",
    paidOut: "13200.00",
    toast: {
      icon: ClockIcon,
      tone: "sky",
      title: "Payback created",
      body: "The pool owes Priya ₹860",
    },
    rows: [
      priyaGroceries("PENDING_PAYMENT", "Groceries · owed to her"),
      aaravTopUp("APPROVED"),
      kabirTopUp,
    ],
  },
  {
    label: "Paid back",
    caption: "Priya is paid back from the pool, and everyone sees it. Hisaab barabar.",
    balance: "9540.00",
    moneyIn: "23600.00",
    paidOut: "14060.00",
    toast: {
      icon: CircleCheckIcon,
      tone: "emerald",
      title: "Hisaab barabar",
      body: "Priya was paid back ₹860",
    },
    rows: [priyaGroceries("PAID", "Groceries · paid back"), aaravTopUp("APPROVED"), kabirTopUp],
  },
];

const noopSubscribe = () => () => {};

/**
 * false in the server HTML and during hydration, true right after. CSS animations start at first
 * paint but the step timer can only start once React has hydrated, so playback waits for this —
 * otherwise, on a slow load, the first notification fades out before the step changes.
 */
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function DemoPhone({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [index, setIndex] = useState(0);
  // null = follow the OS setting (auto-play unless reduced motion); true/false = visitor's choice.
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  // Bumped on every manual jump or resume, so the current step's timer and bar restart from zero.
  const [run, setRun] = useState(0);

  const playing = hydrated && (userPlaying ?? !reduceMotion);
  const step = STEPS[index];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % STEPS.length), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, index, run]);

  function goTo(i: number) {
    setIndex(i);
    setRun((r) => r + 1);
  }

  function togglePlaying() {
    setUserPlaying(!playing);
    setRun((r) => r + 1);
  }

  const timing = {
    "--toast-duration": `${STEP_MS}ms`,
    "--fill-duration": `${STEP_MS}ms`,
  } as React.CSSProperties;

  return (
    <figure className={cn("w-72 sm:w-[19.5rem]", className)} style={timing}>
      <PhoneScreen step={step} stepKey={`${index}-${run}`} playing={playing} hydrated={hydrated} />

      <figcaption className="mt-4">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Step ${i + 1} of ${STEPS.length}: ${s.label}`}
              aria-current={i === index ? "step" : undefined}
              className="group focus-visible:ring-ring/50 flex h-10 flex-1 items-center rounded-md outline-none focus-visible:ring-3"
            >
              <span className="bg-foreground/15 group-hover:bg-foreground/25 relative h-1 w-full overflow-hidden rounded-full transition-colors">
                <span
                  // A new key remounts the bar, which restarts its fill animation.
                  key={i === index ? `active-${run}` : "idle"}
                  className={cn(
                    "bg-foreground absolute inset-0 origin-left rounded-full",
                    i < index && "scale-x-100",
                    i > index && "scale-x-0",
                    // Before hydration the bar waits empty; paused, it shows full.
                    i === index &&
                      (playing ? "motion-safe:animate-fill" : !hydrated && "scale-x-0"),
                  )}
                />
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={togglePlaying}
            aria-label={playing ? "Pause the demo" : "Play the demo"}
            className="hover:bg-muted focus-visible:ring-ring/50 ml-1 flex size-10 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3"
          >
            {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
          </button>
        </div>
        <p className="text-muted-foreground min-h-[2.75rem] text-center text-sm text-pretty">
          <span className="text-foreground font-semibold">
            {index + 1}. {step.label} —
          </span>{" "}
          {step.caption}
        </p>
      </figcaption>
    </figure>
  );
}

/** The phone itself. Decorative (aria-hidden): the caption below tells the same story in text. */
function PhoneScreen({
  step,
  stepKey,
  playing,
  hydrated,
}: {
  step: DemoStep;
  stepKey: string;
  hydrated: boolean;
  playing: boolean;
}) {
  const ToastIcon = step.toast.icon;

  return (
    <div
      aria-hidden
      className="rounded-[2.75rem] bg-zinc-950 p-2 shadow-2xl ring-1 shadow-zinc-950/25 ring-zinc-950/10 dark:shadow-black/60 dark:ring-white/15"
    >
      <div className="bg-background relative flex h-[34rem] flex-col overflow-hidden rounded-[2.25rem] select-none sm:h-[35.5rem]">
        {/* Status bar + camera island */}
        <div className="relative flex h-10 shrink-0 items-center justify-between px-6 text-[11px] font-semibold">
          <span>9:41</span>
          <span className="absolute top-2 left-1/2 h-[1.35rem] w-20 -translate-x-1/2 rounded-full bg-zinc-950" />
          <span className="flex items-center gap-1">
            <SignalIcon className="size-3" />
            <WifiIcon className="size-3" />
            <BatteryFullIcon className="size-3.5" />
          </span>
        </div>

        {/* App header */}
        <div className="flex items-center justify-between px-4 pt-1 pb-3">
          <span className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <WalletIcon className="size-3.5" />
            </span>
            <span className="text-sm font-semibold">Flat 4B</span>
            <ChevronDownIcon className="text-muted-foreground size-3.5" />
          </span>
          <span className="relative">
            <BellIcon className="size-4" />
            <span className="ring-background absolute -top-0.5 -right-0.5 size-2 rounded-full bg-red-500 ring-2" />
          </span>
        </div>

        {/* Balance card, mirroring BalanceHero */}
        <div className="bg-primary text-primary-foreground relative mx-3 overflow-hidden rounded-2xl p-4">
          <div className="bg-primary-foreground/10 pointer-events-none absolute -top-12 -right-12 size-32 rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between">
            <span className="text-primary-foreground/70 text-[11px] font-medium">Pool balance</span>
            <span className="bg-primary-foreground/10 text-primary-foreground/80 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]">
              <ShieldCheckIcon className="size-3" />
              Strict
            </span>
          </div>
          <p
            key={step.balance}
            className="motion-safe:animate-rise relative mt-0.5 text-[1.75rem] font-semibold tracking-tight tabular-nums"
          >
            {formatMoney(step.balance)}
          </p>
          <div className="border-primary-foreground/15 relative mt-3 grid grid-cols-2 gap-2 border-t pt-2.5">
            <MiniStat icon={ArrowDownLeftIcon} label="Money in" value={step.moneyIn} />
            <MiniStat icon={ArrowUpRightIcon} label="Paid out" value={step.paidOut} />
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-4 flex items-center justify-between px-4">
          <span className="text-xs font-semibold">Recent activity</span>
          <span className="text-muted-foreground text-[10px]">See all</span>
        </div>
        <ul className="mt-2 space-y-2 px-3">
          {step.rows.map((row) => (
            <DemoRowItem key={row.id} row={row} />
          ))}
        </ul>

        {/* Bottom nav, mirroring RoomBottomNav */}
        <div className="bg-background/95 absolute inset-x-0 bottom-0 grid grid-cols-5 items-center border-t px-2 pt-2 pb-5">
          <NavItem icon={HomeIcon} label="Home" active />
          <NavItem icon={ReceiptIcon} label="Expenses" />
          <span className="flex justify-center">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full shadow-md">
              <PlusIcon className="size-4" />
            </span>
          </span>
          <NavItem icon={InboxIcon} label="Approvals" dot />
          <NavItem icon={EllipsisIcon} label="More" />
        </div>

        {/* This step's notification: drops in, then slides away while playing */}
        <div
          key={stepKey}
          className={cn(
            "bg-background/90 absolute inset-x-2.5 top-11 z-10 flex items-center gap-2.5 rounded-2xl border p-2.5 shadow-lg backdrop-blur-md",
            !hydrated
              ? "opacity-0"
              : playing
                ? "motion-safe:animate-toast"
                : "motion-safe:animate-drop-in",
          )}
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-xl text-white",
              TOAST_TONE[step.toast.tone],
            )}
          >
            <ToastIcon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2 text-[11px] font-semibold">
              <span className="truncate">{step.toast.title}</span>
              <span className="text-muted-foreground shrink-0 font-normal">now</span>
            </span>
            <span className="text-muted-foreground block truncate text-[11px]">
              {step.toast.body}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: Money }) {
  return (
    <div className="min-w-0">
      <p className="text-primary-foreground/70 flex items-center gap-1 text-[10px]">
        <Icon className="size-3" />
        {label}
      </p>
      <p
        key={value}
        className="motion-safe:animate-rise truncate text-xs font-semibold tabular-nums"
      >
        {formatMoney(value)}
      </p>
    </div>
  );
}

function DemoRowItem({ row }: { row: DemoRow }) {
  const pill = STATUS_PILL[row.status];
  return (
    <li className="bg-card motion-safe:animate-rise flex items-center gap-2.5 rounded-xl border p-2.5">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
          row.who.bg,
        )}
      >
        {row.who.initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{row.who.name}</span>
        <span className="text-muted-foreground block truncate text-[10px]">{row.detail}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            row.moneyIn && "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {formatMoney(row.amount, "INR", { signed: row.moneyIn })}
        </span>
        <span
          key={row.status}
          className={cn(
            "motion-safe:animate-pop rounded-full px-1.5 py-px text-[9px] font-medium",
            pill.className,
          )}
        >
          {pill.label}
        </span>
      </span>
    </li>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  dot,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex flex-col items-center gap-0.5 text-[9px] font-medium",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <span className="relative">
        <Icon className="size-4" />
        {dot ? (
          <span className="ring-background absolute -top-0.5 -right-1 size-2 rounded-full bg-amber-500 ring-2" />
        ) : null}
      </span>
      {label}
    </span>
  );
}
