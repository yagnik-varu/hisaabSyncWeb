import {
  ArrowRightIcon,
  BedDoubleIcon,
  BuildingIcon,
  CheckIcon,
  CookingPotIcon,
  GraduationCapIcon,
  HouseIcon,
  PlaneIcon,
  TicketIcon,
} from "lucide-react";
import Link from "next/link";

import { DemoPhone } from "@/components/landing/demo-phone";
import { FLATMATES } from "@/components/landing/people";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PROMISES = ["Works on any phone", "Nothing to install", "Every rupee on record"];

const MADE_FOR = [
  { icon: HouseIcon, label: "Flatmates" },
  { icon: BedDoubleIcon, label: "Hostel rooms" },
  { icon: BuildingIcon, label: "PG roommates" },
  { icon: PlaneIcon, label: "Trip groups" },
  { icon: GraduationCapIcon, label: "Student batches" },
  { icon: CookingPotIcon, label: "Shared kitchens" },
];

/** Big, rounded CTA buttons (the shared Button shrinks to h-8/h-9 on desktop, too small here). */
const ctaClass =
  "h-12 rounded-xl px-6 text-base md:h-12 md:px-6 has-data-[icon=inline-end]:pr-5 md:has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5 md:has-data-[icon=inline-start]:pl-5";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <HeroBackdrop />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pt-10 pb-14 sm:px-6 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-8 lg:pt-20 lg:pb-20">
        <div className="text-center lg:text-left">
          <p className="bg-background/70 text-muted-foreground motion-safe:animate-rise inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-xs backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            The room kitty, done right
          </p>

          <h1
            id="hero-title"
            className="motion-safe:animate-rise mt-5 text-[2.5rem] leading-[1.05] font-semibold tracking-tight text-balance motion-safe:[animation-delay:80ms] sm:text-6xl lg:text-7xl"
          >
            Shared money,{" "}
            <span className="bg-linear-to-r from-emerald-600 via-teal-500 to-sky-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-300 dark:to-sky-400">
              zero awkward hisaab.
            </span>
          </h1>

          <p className="text-muted-foreground motion-safe:animate-rise mx-auto mt-5 max-w-xl text-base text-pretty motion-safe:[animation-delay:160ms] sm:text-lg lg:mx-0">
            One shared pool for your flat, hostel room or trip. Everyone chips in, spends get
            approved, and whoever paid out of pocket gets paid back — on a ledger the whole room can
            see.
          </p>

          <div className="motion-safe:animate-rise mt-8 flex flex-col gap-3 motion-safe:[animation-delay:240ms] sm:flex-row sm:justify-center lg:justify-start">
            <Button asChild size="lg" className={ctaClass}>
              <Link href="/register">
                Create your room
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={ctaClass}>
              {/* Joining needs an account first; the code is entered from "My rooms" after sign-up. */}
              <Link href="/register">
                <TicketIcon data-icon="inline-start" />I have a room code
              </Link>
            </Button>
          </div>

          <ul className="text-muted-foreground motion-safe:animate-rise mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm motion-safe:[animation-delay:320ms] lg:justify-start">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-center gap-1.5">
                <CheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                {promise}
              </li>
            ))}
          </ul>
        </div>

        <div className="motion-safe:animate-rise relative flex justify-center motion-safe:[animation-delay:200ms]">
          <Orbit />
          <DemoPhone />
        </div>
      </div>

      <MadeForMarquee />
    </section>
  );
}

function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_65%)] opacity-70" />
      <div className="absolute -top-40 left-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />
      <div className="absolute top-1/3 -right-48 size-[28rem] rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10" />
    </div>
  );
}

/**
 * The flatmates slowly circling the pool (the phone sits in the middle). The ring spins one way
 * and each avatar spins the other way at the same speed, so the faces stay upright.
 */
function Orbit() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-[42%] left-1/2 -z-10 size-[21rem] -translate-x-1/2 -translate-y-1/2 [--radius:10.5rem] sm:size-[30rem] sm:[--radius:15rem]"
    >
      <div className="border-foreground/15 absolute inset-0 rounded-full border border-dashed" />
      <div className="border-foreground/5 absolute inset-[16%] rounded-full border" />
      <div className="motion-safe:animate-orbit absolute inset-0">
        {FLATMATES.map((person, i) => {
          const angle = i * 72 - 90;
          return (
            <span
              key={person.name}
              className="absolute top-1/2 left-1/2 size-0"
              style={{
                transform: `rotate(${angle}deg) translateX(var(--radius)) rotate(${-angle}deg)`,
              }}
            >
              <span
                className={cn(
                  "ring-background motion-safe:animate-orbit-reverse absolute -top-4.5 -left-4.5 flex size-9 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-lg ring-4",
                  person.bg,
                )}
              >
                {person.initials}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MadeForMarquee() {
  return (
    <div className="bg-muted/40 border-y py-3">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 sm:px-6">
        <p className="text-muted-foreground hidden shrink-0 text-sm font-medium sm:block">
          Made for
        </p>
        <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:[mask-image:none]">
          {/* Two copies side by side; sliding by -50% loops seamlessly. Hover pauses it. */}
          <div className="motion-safe:animate-marquee flex w-max hover:[animation-play-state:paused] motion-reduce:w-full">
            <MadeForList label="Made for" />
            <MadeForList hidden className="motion-reduce:hidden" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MadeForList({
  label,
  hidden,
  className,
}: {
  label?: string;
  hidden?: boolean;
  className?: string;
}) {
  return (
    <ul
      aria-label={label}
      aria-hidden={hidden || undefined}
      className={cn(
        "flex shrink-0 gap-2 pr-2 motion-reduce:flex-1 motion-reduce:flex-wrap motion-reduce:justify-center",
        className,
      )}
    >
      {MADE_FOR.map(({ icon: Icon, label: item }) => (
        <li
          key={item}
          className="bg-background flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap"
        >
          <Icon className="text-muted-foreground size-4" />
          {item}
        </li>
      ))}
    </ul>
  );
}
