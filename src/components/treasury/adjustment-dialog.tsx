"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { FormError } from "@/components/shared/form-error";
import { TextField } from "@/components/shared/form-fields";
import { Money } from "@/components/shared/money";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAdjustment, useTreasurySummary } from "@/hooks/use-treasury";
import { applyApiErrorToForm } from "@/lib/forms";
import { isNegative, isValidAmount, toApiAmount, toDecimal } from "@/lib/money";
import { adjustmentSchema, type AdjustmentValues } from "@/schemas/treasury";

const DEFAULTS: AdjustmentValues = { transactionType: "CREDIT", amount: "", description: "" };

/**
 * ADMIN-only manual ledger entry (e.g. cashback received, bank charges, correcting a mistake).
 * Shows the resulting balance before submitting. The backend does NOT enforce strict mode for
 * adjustments (docs/05 #13), so we warn loudly when a debit would go below zero.
 */
export function AdjustmentDialog({ trigger }: { trigger: React.ReactNode }) {
  const { roomId, room, currencyCode } = useCurrentRoom();
  const [open, setOpen] = useState(false);
  const summary = useTreasurySummary(roomId);
  const mutation = useCreateAdjustment(roomId);

  const form = useForm<AdjustmentValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: DEFAULTS,
  });
  const { errors } = form.formState;
  const [type, amount] = useWatch({ control: form.control, name: ["transactionType", "amount"] });

  const currentBalance = summary.data?.currentBalance ?? room.treasuryBalance;
  const validAmount = isValidAmount(amount ?? "");
  const resulting = validAmount
    ? (type === "CREDIT"
        ? toDecimal(currentBalance).plus(toDecimal(amount))
        : toDecimal(currentBalance).minus(toDecimal(amount))
      ).toFixed(2)
    : null;
  const breaksStrictMode =
    resulting !== null && isNegative(resulting) && !room.settings.allowNegativeTreasury;

  function handleOpenChange(next: boolean) {
    if (mutation.isPending) return;
    setOpen(next);
    if (!next) form.reset(DEFAULTS);
  }

  function onSubmit(values: AdjustmentValues) {
    mutation.mutate(
      {
        transactionType: values.transactionType,
        amount: toApiAmount(values.amount),
        description: values.description,
      },
      {
        onSuccess: () => {
          toast.success("Adjustment recorded", {
            description: "The ledger and balance are updated.",
          });
          // Not handleOpenChange(): its isPending guard still sees the submit-time value here.
          setOpen(false);
          form.reset(DEFAULTS);
        },
        onError: (error) =>
          applyApiErrorToForm(error, form.setError, {
            fields: ["transactionType", "amount", "description"],
          }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Manual adjustment</DialogTitle>
            <DialogDescription>
              Record money that entered or left the treasury outside the normal flow. This is
              permanent and visible to every member.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <FormError message={errors.root?.server?.message} />

            <Controller
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <Tabs value={field.value} onValueChange={field.onChange}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="CREDIT">Credit (money in)</TabsTrigger>
                      <TabsTrigger value="DEBIT">Debit (money out)</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </Field>
              )}
            />

            <TextField
              control={form.control}
              name="amount"
              label={`Amount (${currencyCode})`}
              placeholder="500.00"
              autoComplete="off"
              inputClassName="tabular-nums"
            />

            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="adjustment-description">Reason</FieldLabel>
                  <Textarea
                    {...field}
                    id="adjustment-description"
                    rows={3}
                    placeholder="Cashback received on electricity bill refund"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <div className="bg-muted/50 space-y-1 rounded-lg border p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current balance</span>
                <Money value={currentBalance} currency={currencyCode} />
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground font-normal">After adjustment</span>
                {resulting !== null ? (
                  <Money value={resulting} currency={currencyCode} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>

            {breaksStrictMode && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertDescription>
                  This room is in strict mode, but this debit would make the balance negative. The
                  server will still accept it, so double-check before continuing.
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={breaksStrictMode ? "destructive" : "default"}
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Spinner />}
              Record {type === "CREDIT" ? "credit" : "debit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
