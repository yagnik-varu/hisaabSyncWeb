"use client";

import { useAuth } from "@/hooks/use-auth";

/** PLACEHOLDER (Phase 1): the real "My Rooms" page arrives in Phase 2. */
export default function RoomsPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Hi {user?.fullName.split(" ")[0]} 👋
      </h1>
      <p className="text-muted-foreground">
        You&apos;re signed in. Your rooms will show up here in the next phase.
      </p>
    </div>
  );
}
