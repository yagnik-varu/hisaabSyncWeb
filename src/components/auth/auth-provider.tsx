"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useAuth } from "@/hooks/use-auth";
import { bootstrapSession } from "@/lib/auth/session";

/**
 * Starts the session bootstrap once per page load, and wipes the React Query cache whenever
 * the user signs out, so the next person on this browser never sees the previous user's data.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { status, user } = useAuth();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    void bootstrapSession();
  }, []);

  useEffect(() => {
    const currentUserId = status === "authenticated" ? (user?.id ?? null) : null;
    if (
      status === "unauthenticated" ||
      (previousUserId.current && currentUserId && previousUserId.current !== currentUserId)
    ) {
      queryClient.clear();
    }
    if (status !== "loading") previousUserId.current = currentUserId;
  }, [status, user?.id, queryClient]);

  return children;
}
