"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

/**
 * List filters stored in the URL (?status=PENDING&page=2), so reloads, the back button and shared
 * links all keep them. Must be used under a <Suspense> boundary (useSearchParams).
 *
 *   const { searchParams, update, page } = useUrlFilters();
 *   update({ status: "PENDING" })          // any filter change → back to page 1
 *   update({ page: "3" }, { keepPage: true })
 */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (changes: Record<string, string | undefined>, options: { keepPage?: boolean } = {}) => {
      const params = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(changes)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      if (!options.keepPage && !("page" in changes)) params.delete("page");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const setPage = useCallback(
    (page: number) => update({ page: page > 1 ? String(page) : undefined }, { keepPage: true }),
    [update],
  );

  return {
    searchParams,
    update,
    setPage,
    page: Math.max(1, Number(searchParams.get("page")) || 1),
  };
}

/** Return `value` only if it is one of `options` (guards enum filters read from the URL). */
export function oneOf<T extends string>(
  value: string | null,
  options: readonly T[],
): T | undefined {
  return options.includes(value as T) ? (value as T) : undefined;
}

/** Keep only UUID-looking values from the URL (backend validates ids with @IsUUID → 400 otherwise). */
export function uuidParam(value: string | null): string | undefined {
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : undefined;
}

/**
 * If the current page became empty (e.g. you approved or cancelled everything on page 2), jump back
 * to page 1 instead of showing a misleading "nothing here yet" empty state.
 * Pass `isEmpty` only for settled data (not while fetching / showing placeholder data).
 */
export function useResetEmptyPage(isEmpty: boolean, page: number, setPage: (page: number) => void) {
  useEffect(() => {
    if (isEmpty && page > 1) setPage(1);
  }, [isEmpty, page, setPage]);
}
