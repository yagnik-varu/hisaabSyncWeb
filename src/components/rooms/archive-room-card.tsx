"use client";

import { ArchiveIcon, InfoIcon } from "lucide-react";
import { toast } from "sonner";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdateRoom } from "@/hooks/use-members";

/**
 * Danger zone: archive the room (read-only forever).
 * - Backend #2: PATCH { status: "ARCHIVED" } is accepted but not saved, so we verify the returned
 *   status and report failure instead of pretending it worked.
 * - Backend #2b: PATCH is blocked on archived rooms, so an archived room can't be reactivated.
 */
export function ArchiveRoomCard() {
  const { roomId, room, isArchived } = useCurrentRoom();
  const update = useUpdateRoom(roomId);

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>Archive room</CardTitle>
        <CardDescription>
          Freezes the room: no new contributions, expenses, payouts or member changes. Everything
          stays readable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isArchived ? (
          <Alert>
            <InfoIcon />
            <AlertDescription>
              This room is archived. Archived rooms can&apos;t be reactivated at the moment.
            </AlertDescription>
          </Alert>
        ) : (
          <ConfirmDialog
            trigger={
              <Button variant="destructive">
                <ArchiveIcon />
                Archive room
              </Button>
            }
            title={`Archive ${room.name}?`}
            description="The room becomes read-only for everyone. This can't be undone."
            confirmLabel="Archive"
            destructive
            reason={{
              label: `Type the room code ${room.roomCode} to confirm`,
              required: true,
              minLength: room.roomCode.length,
              maxLength: 20,
              description: null,
            }}
            onConfirm={async (typed) => {
              if (typed?.toUpperCase() !== room.roomCode) {
                throw new Error(`Type ${room.roomCode} exactly to confirm.`);
              }
              const updated = await update.mutateAsync({ status: "ARCHIVED" });
              if (updated.status !== "ARCHIVED") {
                throw new Error(
                  "The server accepted the request but didn't archive the room. This is a known backend bug (#2) and needs a backend fix.",
                );
              }
              toast.success("Room archived");
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
