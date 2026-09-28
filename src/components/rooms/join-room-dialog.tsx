"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CircleCheckIcon, ClockIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/shared/form-error";
import { TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useJoinRoom } from "@/hooks/use-rooms";
import { applyApiErrorToForm } from "@/lib/forms";
import { joinRoomSchema, type JoinRoomValues } from "@/schemas/room";
import type { Paginated, RoomListItem } from "@/types/api";

type Result = { kind: "requested"; code: string } | { kind: "member"; room: RoomListItem };

/**
 * Join by room code → creates a PENDING join request that an admin must approve.
 * The backend doesn't stop existing members from requesting again (docs/05 #18), so we check
 * the rooms we already have cached first.
 */
export function JoinRoomDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const joinRoom = useJoinRoom();
  const queryClient = useQueryClient();

  const form = useForm<JoinRoomValues>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: { roomCode: "" },
  });
  const { errors } = form.formState;

  function handleOpenChange(next: boolean) {
    if (joinRoom.isPending) return;
    setOpen(next);
    if (!next) {
      form.reset();
      setResult(null);
    }
  }

  function findCachedRoom(code: string) {
    const cached = queryClient.getQueriesData<Paginated<RoomListItem>>({ queryKey: ["rooms"] });
    for (const [, page] of cached) {
      const room = page?.data.find((r) => r.roomCode === code);
      if (room) return room;
    }
    return null;
  }

  function onSubmit({ roomCode }: JoinRoomValues) {
    const existing = findCachedRoom(roomCode);
    if (existing) {
      setResult({ kind: "member", room: existing });
      return;
    }
    joinRoom.mutate(roomCode, {
      onSuccess: () => setResult({ kind: "requested", code: roomCode }),
      onError: (error) =>
        applyApiErrorToForm(error, form.setError, {
          fields: ["roomCode"],
          codeToField: { ROOM_NOT_FOUND: "roomCode" },
        }),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {result?.kind === "requested" ? (
          <>
            <DialogHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-amber-500/10">
                <ClockIcon className="size-5 text-amber-600" />
              </div>
              <DialogTitle>Request sent</DialogTitle>
              <DialogDescription>
                Your request to join <span className="font-mono font-medium">{result.code}</span> is
                waiting for an admin. The room will appear in your list once approved.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : result?.kind === "member" ? (
          <>
            <DialogHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
                <CircleCheckIcon className="size-5 text-emerald-600" />
              </div>
              <DialogTitle>You&apos;re already a member</DialogTitle>
              <DialogDescription>
                You already belong to <span className="font-medium">{result.room.name}</span>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button asChild>
                <Link href={`/rooms/${result.room.id}`} onClick={() => handleOpenChange(false)}>
                  Open room
                </Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <DialogHeader>
              <DialogTitle>Join a room</DialogTitle>
              <DialogDescription>
                Ask a room admin for the room code, then enter it here.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <FormError message={errors.root?.server?.message} />
              <TextField
                control={form.control}
                name="roomCode"
                label="Room code"
                placeholder="FLAT402"
                autoComplete="off"
                inputClassName="font-mono uppercase tracking-widest"
              />
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={joinRoom.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={joinRoom.isPending}>
                {joinRoom.isPending && <Spinner />}
                Send request
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
