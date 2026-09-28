import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#roles", label: "Roles" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Sticky, blurred header. Phones get logo + theme + "Log in" (the hero carries the main CTA);
 * section links appear from `lg`.
 */
export function LandingHeader() {
  return (
    <header className="bg-background/70 supports-[backdrop-filter]:bg-background/55 sticky top-0 z-40 border-b backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Page sections" className="hidden items-center gap-1 lg:flex">
          {SECTIONS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
