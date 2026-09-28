"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { AmountField } from "@/components/shared/amount-field";
import { FormError } from "@/components/shared/form-error";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useContributionMutations } from "@/hooks/use-contributions";
import { applyApiErrorToForm } from "@/lib/forms";
import { formatMoney, toApiAmount } from "@/lib/money";
import { contributionSchema, type ContributionValues } from "@/schemas/contribution";

const DEFAULTS: ContributionValues = { amount: "", note: "" };
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

/**
 * "Add money to the pool" — creates a PENDING contribution that an approver confirms.
 * Bottom sheet on phones, dialog on desktop. Pass `open`/`onOpenChange` to control it from
 * elsewhere (e.g. the bottom-nav "+" menu) instead of a `trigger`.
 */
export function SubmitContributionDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { roomId, currencyCode } = useCurrentRoom();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const { submit } = useContributionMutations(roomId);

  const form = useForm<ContributionValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: DEFAULTS,
  });
  const { errors } = form.formState;

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  function handleOpenChange(next: boolean) {
    if (submit.isPending) return;
    setOpen(next);
    if (!next) form.reset(DEFAULTS);
  }

  function onSubmit(values: ContributionValues) {
    const amount = toApiAmount(values.amount);
    submit.mutate(
      { amount, note: values.note || undefined },
      {
        onSuccess: () => {
          toast.success("Contribution submitted", {
            description: `${formatMoney(amount, currencyCode)} is waiting for approval.`,
          });
          setOpen(false);
          form.reset(DEFAULTS);
        },
        onError: (error) =>
          applyApiErrorToForm(error, form.setError, { fields: ["amount", "note"] }),
      },
    );
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      dismissible={!submit.isPending}
      title="Add money to the pool"
      description="Record money you've put into the room treasury (cash, UPI, bank transfer…). It counts once an admin or accountant approves it."
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="contents">
        <ResponsiveDialogBody>
          <FieldGroup>
            <FormError message={errors.root?.server?.message} />
            <AmountField
              control={form.control}
              name="amount"
              currencyCode={currencyCode}
              quickAmounts={QUICK_AMOUNTS}
            />
            <Controller
              control={form.control}
              name="note"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="contribution-note">
                    Note <span className="text-muted-foreground font-normal">(optional)</span>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="contribution-note"
                    rows={2}
                    placeholder="September share, paid via UPI (ref 4821…)"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>You can cancel it while it&apos;s pending.</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
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
            disabled={submit.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submit.isPending}>
            {submit.isPending && <Spinner />}
            Submit contribution
          </Button>
        </ResponsiveDialogFooter>
      </form>
    </ResponsiveDialog>
  );
}
