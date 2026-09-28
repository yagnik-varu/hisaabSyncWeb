import {
  ArrowRightIcon,
  BanknoteIcon,
  CopyIcon,
  DoorOpenIcon,
  HandCoinsIcon,
  ReceiptIcon,
  Share2Icon,
} from "lucide-react";

import { SectionHeading } from "@/components/landing/section-heading";
import { StatusBadge } from "@/components/shared/badges";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/** The four-step loop from docs/02 §5 (journeys 2–6), in plain words. */
const STEPS = [
  {
    icon: DoorOpenIcon,
    title: "Open a room, share the code",
    text: "Name the room, pick its currency and choose strict or flexible. Send the code on WhatsApp — you approve who gets in.",
    visual: <RoomCodeVisual />,
  },
  {
    icon: HandCoinsIcon,
    title: "Everyone chips in",
    text: "Members add money to the pool. An admin or accountant confirms it actually arrived before the balance moves.",
    visual: (
      <StatusChange
        amount={formatMoney("2000.00", "INR", { signed: true })}
        from="PENDING"
        to="APPROVED"
      />
    ),
  },
  {
    icon: ReceiptIcon,
    title: "Log what you spend",
    text: "Paid for groceries or the electricity bill yourself? Log it with a category and a receipt link, and it goes for approval.",
    visual: <CategoryVisual />,
  },
  {
    icon: BanknoteIcon,
    title: "Get paid back",
    text: "Approved spends become paybacks automatically. Mark one paid and the pool balance updates for everyone.",
    visual: <StatusChange amount={formatMoney("860.00")} from="PENDING_PAYMENT" to="PAID" />,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="bg-muted/30 scroll-mt-16 border-y py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="how-title"
          eyebrow="How it works"
          title="From chipping in to paid back, in four steps."
          description="The same simple loop every month. Nobody has to remember who paid for what — the room does."
        />

        <ol className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text, visual }, i) => (
            <li
              key={title}
              className="bg-card relative flex flex-col overflow-hidden rounded-3xl border p-6"
            >
              <span
                aria-hidden
                className="text-foreground/[0.06] absolute -top-4 right-3 text-8xl font-bold tabular-nums select-none"
              >
                {i + 1}
              </span>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm text-pretty">{text}</p>
              <div className="mt-auto pt-6">
                <div
                  aria-hidden
                  className="bg-muted/60 flex min-h-20 items-center justify-center rounded-2xl p-4"
                >
                  {visual}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function RoomCodeVisual() {
  return (
    <div className="flex items-center gap-2">
      <span className="bg-background flex h-10 items-center gap-2 rounded-xl border px-3 font-mono text-sm font-semibold tracking-[0.2em]">
        FLAT4B
        <CopyIcon className="text-muted-foreground size-3.5" />
      </span>
      <span className="flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-sm font-medium text-white">
        <Share2Icon className="size-3.5" />
        Share
      </span>
    </div>
  );
}

function StatusChange({ amount, from, to }: { amount: string; from: string; to: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-base font-semibold tabular-nums">{amount}</span>
      <span className="flex items-center gap-1.5">
        <StatusBadge status={from} />
        <ArrowRightIcon className="text-muted-foreground size-3.5" />
        <StatusBadge status={to} />
      </span>
    </div>
  );
}

function CategoryVisual() {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {["Groceries", "Rent", "Electricity", "Maintenance"].map((category, i) => (
        <span
          key={category}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-medium",
            i === 0 ? "bg-primary text-primary-foreground border-transparent" : "bg-background",
          )}
        >
          {category}
        </span>
      ))}
    </div>
  );
}
