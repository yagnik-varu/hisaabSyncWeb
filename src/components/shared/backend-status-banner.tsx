"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudOffIcon, WifiOffIcon } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { getHealth } from "@/lib/api/endpoints/health";
import { backendStatus } from "@/lib/backend-status";

function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

/**
 * Thin banner at the top of every page while the browser is offline or the backend is unreachable.
 * While "down" it pings GET /health every 5 s; when it answers, all active queries are refetched.
 */
export function BackendStatusBanner() {
  const queryClient = useQueryClient();
  const online = useOnline();
  const status = useSyncExternalStore(
    backendStatus.subscribe,
    backendStatus.get,
    backendStatus.getServer,
  );
  const down = status === "down";

  const health = useQuery({
    queryKey: ["health", "watchdog"],
    queryFn: ({ signal }) => getHealth(signal),
    enabled: down && online,
    refetchInterval: 5000,
    retry: false,
    gcTime: 0,
  });

  useEffect(() => {
    if (down && health.data?.status === "ok") {
      backendStatus.markUp();
      void queryClient.refetchQueries({ type: "active" });
      toast.success("Connected to the server again");
    }
  }, [down, health.data, queryClient]);

  if (!online) {
    return (
      <Banner>
        <WifiOffIcon className="size-4" />
        You&apos;re offline. Changes can&apos;t be saved until you reconnect.
      </Banner>
    );
  }
  if (!down) return null;
  return (
    <Banner>
      <CloudOffIcon className="size-4" />
      Can&apos;t reach the HisaabSync server. It may be waking up (can take up to a minute).
      <Spinner className="size-3.5" />
    </Banner>
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-center text-sm font-medium text-amber-950"
    >
      {children}
    </div>
  );
}
