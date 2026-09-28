import type { Metadata } from "next";
import { Suspense } from "react";

import { RoomsView } from "@/components/rooms/rooms-view";

export const metadata: Metadata = { title: "My rooms" };

export default function RoomsPage() {
  // RoomsView reads ?status/&page with useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <RoomsView />
    </Suspense>
  );
}
