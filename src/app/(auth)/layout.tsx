import { Suspense } from "react";

import { RedirectIfAuthenticated } from "@/components/auth/guards";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/** Centered card layout for /login and /register. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Logo href="/login" />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <Suspense>
        <RedirectIfAuthenticated />
      </Suspense>
    </div>
  );
}
