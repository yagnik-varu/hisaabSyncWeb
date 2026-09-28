"use client";

import { useSyncExternalStore } from "react";

import {
  authStore,
  login,
  loginWithGoogle,
  logout,
  register,
  retryBootstrap,
  type AuthState,
} from "@/lib/auth/session";

/**
 * Read the session from any client component:
 *   const { status, user } = useAuth();
 *
 * useSyncExternalStore gives tear-free reads of our module-level store, and during SSR it
 * uses the server snapshot ("loading") so server and client markup match on hydration.
 */
export function useAuth(): AuthState & {
  login: typeof login;
  register: typeof register;
  loginWithGoogle: typeof loginWithGoogle;
  logout: typeof logout;
  retry: typeof retryBootstrap;
} {
  const state = useSyncExternalStore(
    authStore.subscribe,
    authStore.getState,
    authStore.getServerState,
  );
  return { ...state, login, register, loginWithGoogle, logout, retry: retryBootstrap };
}
