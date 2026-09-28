"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { FullPageSpinner, ServerUnreachable } from "@/components/shared/full-page-state";
import { useAuth } from "@/hooks/use-auth";
import { LOGIN_PATH, safeNextPath } from "@/lib/auth/constants";

/**
 * For /login and /register: once the session is authenticated (form submit, Google, or a login
 * in another tab), go to ?next= (validated) or /rooms.
 * Uses useSearchParams → must be rendered inside <Suspense>.
 */
export function RedirectIfAuthenticated() {
  const { status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(safeNextPath(searchParams.get("next")));
    }
  }, [status, router, searchParams]);

  return null;
}

/**
 * For every signed-in page. src/proxy.ts already bounced visitors without a session cookie;
 * this handles the real validation result from the bootstrap:
 * - loading       → spinner
 * - error         → "server unreachable" with retry (cookie kept, user not logged out)
 * - unauthenticated → /login (with ?next= unless the user logged out on purpose)
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, error, signedOutByUser, retry } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    if (signedOutByUser) {
      router.replace(LOGIN_PATH);
    } else {
      const next = `${pathname}${window.location.search}`;
      router.replace(`${LOGIN_PATH}?next=${encodeURIComponent(next)}`);
    }
  }, [status, signedOutByUser, pathname, router]);

  if (status === "authenticated") return children;
  if (status === "error") {
    return <ServerUnreachable message={error?.message} onRetry={() => void retry()} />;
  }
  return (
    <FullPageSpinner label={status === "loading" ? "Loading your session…" : "Redirecting…"} />
  );
}
