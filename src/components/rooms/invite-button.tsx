"use client";

import { Share2Icon } from "lucide-react";
import { toast } from "sonner";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { Button } from "@/components/ui/button";

/**
 * "Invite": opens the phone's native share sheet (WhatsApp, SMS…) with the room code — the way
 * people actually invite roommates. Falls back to copying the message on desktop browsers.
 */
export function InviteButton({
  variant = "outline",
  size,
  className,
}: {
  variant?: "outline" | "default" | "secondary" | "ghost";
  size?: "sm" | "default";
  className?: string;
}) {
  const { room } = useCurrentRoom();
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/rooms` : "";
  const text = `Join "${room.name}" on HisaabSync to share expenses. Room code: ${room.roomCode}`;

  async function invite() {
    const data = { title: `Join ${room.name} on HisaabSync`, text, url: joinUrl };
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
        await navigator.share(data);
        return;
      }
    } catch (error) {
      // User closed the share sheet → nothing to do.
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${joinUrl}`);
      toast.success("Invite copied", { description: "Paste it in WhatsApp or anywhere." });
    } catch {
      toast.error(`Room code: ${room.roomCode}`, {
        description: "Couldn't copy automatically. Share this code.",
      });
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={() => void invite()}>
      <Share2Icon />
      Invite
    </Button>
  );
}
