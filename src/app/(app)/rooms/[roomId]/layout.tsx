import { RoomShell } from "@/components/rooms/room-shell";

/** Shared shell for every page inside a room (header, nav, room context). */
export default async function RoomLayout({ children, params }: LayoutProps<"/rooms/[roomId]">) {
  const { roomId } = await params;
  return <RoomShell roomId={roomId}>{children}</RoomShell>;
}
