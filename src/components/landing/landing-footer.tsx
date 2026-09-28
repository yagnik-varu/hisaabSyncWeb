import Link from "next/link";

import { Logo } from "@/components/shared/logo";

const LINKS = [
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Create an account" },
  { href: "/status", label: "System status" },
];

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <Logo />
          <p className="text-muted-foreground mt-2 text-sm">
            One shared pool for every room. Made for shared living.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-muted-foreground hover:text-foreground inline-flex h-10 items-center text-sm font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
