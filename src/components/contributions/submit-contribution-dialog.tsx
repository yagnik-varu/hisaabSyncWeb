"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { FormError } from "@/components/shared/form-error";
import { TextField } from "@/components/shared/form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useContributionMutations } from "@/hooks/use-contributions";
import { applyApiErrorToForm } from "@/lib/forms";
import { formatMoney, toApiAmount } from "@/lib/money";
import { contributionSchema, type ContributionValues } from "@/schemas/contribution";

const DEFAULTS: ContributionValues = { amount: "", note: "" };

/** "Add money to the pool" — creates a PENDING contribution that an approver confirms. */
export function SubmitContributionDialog({ trigger }: { trigger: React.ReactNode }) {
  const { roomId, currencyCode } = useCurrentRoom();
  const [open, setOpen] = useState(false);
  const { submit } = useContributionMutations(roomId);

  const form = useForm<ContributionValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: DEFAULTS,
  });
  const { errors } = form.formState;

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Add money to the pool</DialogTitle>
            <DialogDescription>
              Record money you&apos;ve put into the room treasury (cash, UPI, bank transfer…).
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <FormError message={errors.root?.server?.message} />
            <TextField
              control={form.control}
              name="amount"
              label={`Amount (${currencyCode})`}
              placeholder="2000.00"
              autoComplete="off"
              inputClassName="tabular-nums"
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
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Alert>
              <InfoIcon />
              <AlertDescription>
                The balance goes up once an admin or accountant approves it. You can cancel it while
                it&apos;s pending.
              </AlertDescription>
            </Alert>
          </FieldGroup>

          <DialogFooter>
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
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
