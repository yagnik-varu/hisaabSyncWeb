import { WalletIcon } from "lucide-react";

import { FLATMATES } from "@/components/landing/people";
import { SectionHeading } from "@/components/landing/section-heading";
import { cn } from "@/lib/utils";

/**
 * "A web of IOUs vs one pool": the core idea of HisaabSync in one picture (docs/02 §1).
 * Both diagrams place the same five flatmates on a pentagon in a 200×200 space. The viewBox is
 * cropped to the drawing (the pentagon sits a little high), so there's no empty band underneath.
 */
const VIEW_BOX = "0 6 200 174";

const CENTER = 100;
const RADIUS = 70;

const round = (n: number) => Math.round(n * 100) / 100;

const NODES = FLATMATES.map((person, i) => {
  const angle = ((i * 72 - 90) * Math.PI) / 180;
  return {
    person,
    x: round(CENTER + RADIUS * Math.cos(angle)),
    y: round(CENTER + RADIUS * Math.sin(angle)),
  };
});

type Node = (typeof NODES)[number];

/** Every pair of flatmates (5 people → 10 pairs), drawn as slightly bent curves so it looks tangled. */
const IOU_CURVES = NODES.flatMap((a, i) =>
  NODES.slice(i + 1).map((b, k) => bentCurve(a, b, (i + k) % 2 === 0 ? 14 : -14)),
);

function bentCurve(a: Node, b: Node, bend: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  // Control point: the chord's midpoint pushed sideways by `bend`.
  const cx = (a.x + b.x) / 2 - (dy / length) * bend;
  const cy = (a.y + b.y) / 2 + (dx / length) * bend;
  return {
    d: `M${a.x} ${a.y} Q${round(cx)} ${round(cy)} ${b.x} ${b.y}`,
    // Point on the curve at t = 0.5, where the little "₹" markers sit.
    mid: {
      x: round(0.25 * a.x + 0.5 * cx + 0.25 * b.x),
      y: round(0.25 * a.y + 0.5 * cy + 0.25 * b.y),
    },
  };
}

export function PoolVsWeb() {
  return (
    <section aria-labelledby="why-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="why-title"
          eyebrow="Why a pool"
          title="Stop keeping score between friends."
          description="Split-the-bill apps track who owes whom. HisaabSync gives the room one shared pool instead, so everyone settles with the pool — never with each other."
        />

        <div className="relative mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <CompareCard
            kicker="The usual way"
            count="10"
            countLabel="IOUs between 5 flatmates"
            text="Every bill becomes a debt between two people. Who paid for the gas cylinder? Who owes whom after the Goa trip? Nobody is quite sure."
            diagram={<WebDiagram />}
            legend={<LegendDot className="bg-rose-400" label="A debt someone has to remember" />}
          />
          <CompareCard
            good
            kicker="The HisaabSync way"
            count="1"
            countLabel="pool everyone settles with"
            text="Money goes into the pool and paybacks come out of it. Nobody chases a roommate, and every rupee sits on a ledger the whole room can check."
            diagram={<PoolDiagram />}
            legend={
              <>
                <LegendDot className="bg-emerald-500" label="Money in" />
                <LegendDot className="bg-sky-500" label="Paid back" />
              </>
            }
          />
          <span
            aria-hidden
            className="bg-background text-muted-foreground absolute top-1/2 left-1/2 hidden size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-sm font-semibold shadow-sm md:flex"
          >
            vs
          </span>
        </div>
      </div>
    </section>
  );
}

function CompareCard({
  good,
  kicker,
  count,
  countLabel,
  text,
  diagram,
  legend,
}: {
  good?: boolean;
  kicker: string;
  count: string;
  countLabel: string;
  text: string;
  diagram: React.ReactNode;
  legend: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl border p-6 sm:p-8",
        good ? "bg-card border-emerald-500/30 shadow-xl shadow-emerald-500/5" : "bg-muted/40",
      )}
    >
      <p
        className={cn(
          "text-sm font-semibold",
          good ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400",
        )}
      >
        {kicker}
      </p>
      <div className="my-6 flex flex-col items-center gap-3">
        {diagram}
        <div className="text-muted-foreground flex items-center gap-4 text-xs">{legend}</div>
      </div>
      <p className="flex items-baseline gap-2.5">
        <span className="text-5xl font-semibold tracking-tight tabular-nums">{count}</span>
        <span className="text-muted-foreground font-medium">{countLabel}</span>
      </p>
      <p className="text-muted-foreground mt-2 text-sm text-pretty sm:text-base">{text}</p>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} />
      {label}
    </span>
  );
}

function WebDiagram() {
  return (
    <svg
      viewBox={VIEW_BOX}
      role="img"
      aria-label="Five flatmates connected by ten separate debts"
      className="h-auto w-full max-w-60"
    >
      {IOU_CURVES.map((curve) => (
        <path
          key={curve.d}
          d={curve.d}
          fill="none"
          strokeWidth={1.5}
          className="stroke-rose-500/45 dark:stroke-rose-400/45"
        />
      ))}
      {IOU_CURVES.filter((_, i) => i % 3 === 0).map(({ mid }) => (
        <g key={`${mid.x}-${mid.y}`}>
          <circle
            cx={mid.x}
            cy={mid.y}
            r={6.5}
            strokeWidth={1}
            className="fill-background stroke-rose-500/60 dark:stroke-rose-400/60"
          />
          <text
            x={mid.x}
            y={mid.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-rose-600 text-[7px] font-semibold dark:fill-rose-400"
          >
            ₹
          </text>
        </g>
      ))}
      <PeopleNodes />
    </svg>
  );
}

function PoolDiagram() {
  return (
    <svg
      viewBox={VIEW_BOX}
      role="img"
      aria-label="Five flatmates each connected only to one shared pool in the middle"
      className="h-auto w-full max-w-60"
    >
      {NODES.map(({ person, x, y }, i) => {
        // Lines run person → pool, so the dash "flow" moves inward; reversed = paid back out.
        const moneyIn = i % 2 === 0;
        return (
          <line
            key={person.name}
            x1={x}
            y1={y}
            x2={CENTER}
            y2={CENTER}
            strokeWidth={2.5}
            strokeDasharray="3 5"
            strokeLinecap="round"
            className={cn(
              "motion-safe:animate-flow",
              moneyIn ? "stroke-emerald-500" : "stroke-sky-500 [animation-direction:reverse]",
            )}
          />
        );
      })}
      <circle cx={CENTER} cy={CENTER} r={34} className="fill-emerald-500/10" />
      <circle cx={CENTER} cy={CENTER} r={24} className="fill-emerald-600 dark:fill-emerald-500" />
      <WalletIcon x={CENTER - 11} y={CENTER - 11} width={22} height={22} className="text-white" />
      <PeopleNodes />
    </svg>
  );
}

function PeopleNodes() {
  return NODES.map(({ person, x, y }) => (
    <g key={person.name}>
      <circle
        cx={x}
        cy={y}
        r={15}
        strokeWidth={2}
        className={cn("fill-background", person.stroke)}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-[9px] font-semibold"
      >
        {person.initials}
      </text>
    </g>
  ));
}
