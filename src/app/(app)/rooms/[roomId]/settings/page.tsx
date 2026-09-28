import type { Metadata } from "next";

import { RoomSettingsView } from "@/components/rooms/room-settings-view";

export const metadata: Metadata = { title: "Room settings" };

export default function Page() {
  return <RoomSettingsView />;
}
