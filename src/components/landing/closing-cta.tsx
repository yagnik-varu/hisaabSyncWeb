import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ClosingCta() {
  return (
    <section aria-labelledby="cta-title" className="px-4 pb-16 sm:px-6 sm:pb-24">
      <div className="bg-primary text-primary-foreground relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 size-80 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="absolute -right-24 -bottom-24 size-80 rounded-full bg-sky-500/25 blur-3xl" />
        </div>

        {/* A tiny dictionary entry, for anyone who doesn't speak Hindi. */}
        <p className="text-primary-foreground/60 font-mono text-xs tracking-wide text-balance">
          <span lang="hi">बराबर</span> · ba·ra·bar · <em>adj.</em> even, settled
        </p>
        <h2
          id="cta-title"
          className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
        >
          Keep the hisaab barabar.
        </h2>
        <p className="text-primary-foreground/70 mx-auto mt-4 max-w-md text-base text-pretty sm:text-lg">
          Open a room, share the code, and let the pool keep score.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-12 rounded-xl px-6 text-base has-data-[icon=inline-end]:pr-5 md:h-12 md:px-6 md:has-data-[icon=inline-end]:pr-5"
          >
            <Link href="/register">
              Create your room
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground h-12 rounded-xl px-6 text-base md:h-12 md:px-6"
          >
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
