"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormError } from "@/components/shared/form-error";
import { TextField } from "@/components/shared/form-fields";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRoom } from "@/hooks/use-rooms";
import { applyApiErrorToForm } from "@/lib/forms";
import { CURRENCIES, createRoomSchema, type CreateRoomValues } from "@/schemas/room";

const DEFAULTS: CreateRoomValues = {
  name: "",
  description: "",
  currencyCode: "INR",
  allowNegativeTreasury: false,
};

export function CreateRoomDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const createRoom = useCreateRoom();

  const form = useForm<CreateRoomValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: DEFAULTS,
  });
  const { errors } = form.formState;

  function handleOpenChange(next: boolean) {
    if (createRoom.isPending) return;
    setOpen(next);
    if (!next) form.reset(DEFAULTS);
  }

  function onSubmit(values: CreateRoomValues) {
    createRoom.mutate(
      {
        name: values.name,
        description: values.description || undefined,
        currencyCode: values.currencyCode,
        allowNegativeTreasury: values.allowNegativeTreasury,
      },
      {
        onSuccess: (room) => {
          toast.success(`"${room.name}" created`, {
            description: `Share the code ${room.roomCode} so others can join.`,
          });
          setOpen(false);
          form.reset(DEFAULTS);
          router.push(`/rooms/${room.id}`);
        },
        onError: (error) =>
          applyApiErrorToForm(error, form.setError, {
            fields: ["name", "description", "currencyCode", "allowNegativeTreasury"],
          }),
      },
    );
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      dismissible={!createRoom.isPending}
      title="Create a room"
      description="A room has one shared treasury. You'll be its admin."
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="contents">
        <ResponsiveDialogBody>
          <FieldGroup>
            <FormError message={errors.root?.server?.message} />

            <TextField
              control={form.control}
              name="name"
              label="Room name"
              placeholder="Flat 402"
              autoComplete="off"
              autoCapitalize="words"
            />

            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="room-description">
                    Description{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="room-description"
                    rows={2}
                    placeholder="Shared apartment expense pool"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="currencyCode"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="room-currency">Currency</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="room-currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>Can&apos;t be changed later.</FieldDescription>
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
                    <FieldLabel htmlFor="room-negative">Allow negative balance</FieldLabel>
                    <FieldDescription>
                      Off (strict): reimbursements can&apos;t be paid if the treasury would go below
                      zero. You can change this later.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="room-negative"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
          </FieldGroup>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={createRoom.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createRoom.isPending}>
            {createRoom.isPending && <Spinner />}
            Create room
          </Button>
        </ResponsiveDialogFooter>
      </form>
    </ResponsiveDialog>
  );
}
