"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { BackendStatusBanner } from "@/components/shared/backend-status-banner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api/errors";
import { backendStatus, isUnreachableError } from "@/lib/backend-status";

/** Any failed request that looks like "server unreachable" switches on the banner. */
function reportUnreachable(error: unknown) {
  if (isUnreachableError(error)) backendStatus.markDown();
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: reportUnreachable }),
    mutationCache: new MutationCache({ onError: reportUnreachable }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        // Retrying a 4xx (validation, 403, 404…) never helps — only retry network/5xx, and only twice.
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  // useState (not a module-level singleton) so each browser session gets exactly one client
  // and server renders never share a cache between users.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <BackendStatusBanner />
          <AuthProvider>{children}</AuthProvider>
          <Toaster richColors closeButton position="top-right" />
        </TooltipProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
