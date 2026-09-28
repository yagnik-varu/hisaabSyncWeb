"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { FormError } from "@/components/shared/form-error";
import { TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateRoom } from "@/hooks/use-members";
import type { UpdateRoomInput } from "@/lib/api/endpoints/rooms";
import { applyApiErrorToForm } from "@/lib/forms";
import { roomSettingsSchema, type RoomSettingsValues } from "@/schemas/room-settings";

/**
 * Admin-only room details. Sends ONLY the fields the admin changed: until backend Patch A (#4) the
 * details endpoint doesn't return `description`, so re-sending an unknown value would wipe it.
 */
export function RoomSettingsForm() {
  const { roomId, room } = useCurrentRoom();
  const update = useUpdateRoom(roomId);
  const descriptionKnown = room.description !== undefined;

  const defaults: RoomSettingsValues = {
    name: room.name,
    description: room.description ?? "",
    allowNegativeTreasury: room.settings.allowNegativeTreasury,
  };
  const form = useForm<RoomSettingsValues>({
    resolver: zodResolver(roomSettingsSchema),
    defaultValues: defaults,
  });
  const { errors, isDirty, dirtyFields } = form.formState;

  function onSubmit(values: RoomSettingsValues) {
    const input: UpdateRoomInput = {};
    if (dirtyFields.name) input.name = values.name;
    if (dirtyFields.description) input.description = values.description;
    if (dirtyFields.allowNegativeTreasury)
      input.allowNegativeTreasury = values.allowNegativeTreasury;

    update.mutate(input, {
      onSuccess: () => {
        toast.success("Room settings saved");
        form.reset(values);
      },
      onError: (error) =>
        applyApiErrorToForm(error, form.setError, {
          fields: ["name", "description", "allowNegativeTreasury"],
        }),
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormError message={errors.root?.server?.message} />

        <TextField control={form.control} name="name" label="Room name" autoComplete="off" />

        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="room-settings-description">Description</FieldLabel>
              <Textarea
                {...field}
                id="room-settings-description"
                rows={3}
                placeholder={
                  descriptionKnown
                    ? "What is this room for?"
                    : "Leave untouched to keep the current description"
                }
                aria-invalid={fieldState.invalid}
              />
              {!descriptionKnown && (
                <FieldDescription>
                  The server doesn&apos;t send the current description yet (backend issue #4), so it
                  isn&apos;t shown here. It&apos;s only changed if you type something.
                </FieldDescription>
              )}
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="allowNegativeTreasury"
          render={({ field }) => (
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="room-settings-negative">Allow negative balance</FieldLabel>
                <FieldDescription>
                  Off (strict): reimbursements can&apos;t be paid if the treasury would go below
                  zero. On: payouts can go ahead, and the pool owes money until members top up.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="room-settings-negative"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </Field>
          )}
        />

        <p className="text-muted-foreground text-sm">
          Currency:{" "}
          <span className="text-foreground font-medium">{room.settings.currencyCode}</span>{" "}
          (can&apos;t be changed)
        </p>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || update.isPending}
            onClick={() => form.reset(defaults)}
          >
            Reset
          </Button>
          <Button type="submit" disabled={!isDirty || update.isPending}>
            {update.isPending && <Spinner />}
            Save changes
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
