"use client";

import { InfoIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { OutstandingMoneyNotice } from "@/components/members/outstanding-money-notice";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRequestLeave } from "@/hooks/use-members";

/**
 * Ask to leave the current room. The backend locks the member out as soon as the request is sent
 * (status LEAVE_REQUESTED fails the membership guard, docs/05 #11), so we say that clearly and
 * take the user back to "My rooms" afterwards.
 */
export function LeaveRoomButton({ isLastAdmin }: { isLastAdmin: boolean }) {
  const { roomId, room, isArchived } = useCurrentRoom();
  const { user } = useAuth();
  const router = useRouter();
  const leave = useRequestLeave(roomId);

  if (isArchived || !user) return null;

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline">
          <LogOutIcon />
          Leave room
        </Button>
      }
      title={`Leave ${room.name}?`}
      description="An admin has to approve your request."
      confirmLabel="Request to leave"
      destructive
      confirmDisabled={isLastAdmin}
      onConfirm={async () => {
        await leave.mutateAsync();
        toast.success("Leave request sent", {
          description: "An admin will review it. You won't see this room meanwhile.",
        });
        router.replace("/rooms");
      }}
    >
      {isLastAdmin ? (
        <Alert variant="destructive">
          <InfoIcon />
          <AlertDescription>
            You&apos;re the only admin. Make another member an admin first, then you can leave.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Alert>
            <InfoIcon />
            <AlertDescription>
              While your request is pending you won&apos;t be able to open this room. If it&apos;s
              rejected, your access comes back.
            </AlertDescription>
          </Alert>
          <OutstandingMoneyNotice userId={user.id} isSelf />
        </>
      )}
    </ConfirmDialog>
  );
}
