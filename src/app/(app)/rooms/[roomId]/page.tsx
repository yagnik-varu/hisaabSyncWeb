import type { Metadata } from "next";

import { RoomOverview } from "@/components/rooms/room-overview";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return <RoomOverview />;
}
