"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CircleCheckIcon, ClockIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/shared/form-error";
import { TextField } from "@/components/shared/form-fields";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
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

  const title =
    result?.kind === "requested"
      ? "Request sent"
      : result?.kind === "member"
        ? "You're already a member"
        : "Join a room";
  const description =
    result === null ? "Ask a room admin for the room code, then enter it here." : undefined;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      dismissible={!joinRoom.isPending}
      className="sm:max-w-sm"
      title={title}
      description={description}
    >
      {result?.kind === "requested" ? (
        <>
          <ResponsiveDialogBody>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                <ClockIcon className="size-5 text-amber-600" />
              </div>
              <p className="text-muted-foreground text-sm">
                Your request to join{" "}
                <span className="text-foreground font-mono font-medium">{result.code}</span> is
                waiting for an admin. The room will appear in your list once approved.
              </p>
            </div>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          </ResponsiveDialogFooter>
        </>
      ) : result?.kind === "member" ? (
        <>
          <ResponsiveDialogBody>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <CircleCheckIcon className="size-5 text-emerald-600" />
              </div>
              <p className="text-muted-foreground text-sm">
                You already belong to{" "}
                <span className="text-foreground font-medium">{result.room.name}</span>.
              </p>
            </div>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button asChild>
              <Link href={`/rooms/${result.room.id}`} onClick={() => handleOpenChange(false)}>
                Open room
              </Link>
            </Button>
          </ResponsiveDialogFooter>
        </>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="contents">
          <ResponsiveDialogBody>
            <FieldGroup>
              <FormError message={errors.root?.server?.message} />
              <TextField
                control={form.control}
                name="roomCode"
                label="Room code"
                placeholder="FLAT402"
                autoComplete="off"
                autoCapitalize="characters"
                enterKeyHint="go"
                inputClassName="h-14 text-center font-mono text-2xl tracking-[0.3em] uppercase md:h-12 md:text-xl"
              />
            </FieldGroup>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
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
          </ResponsiveDialogFooter>
        </form>
      )}
    </ResponsiveDialog>
  );
}
