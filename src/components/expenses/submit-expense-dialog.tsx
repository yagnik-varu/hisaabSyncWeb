"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { AmountField } from "@/components/shared/amount-field";
import { ChoiceChips } from "@/components/shared/choice-chips";
import { FormError } from "@/components/shared/form-error";
import { TextField } from "@/components/shared/form-fields";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/shared/responsive-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCategories, useExpenseMutations } from "@/hooks/use-expenses";
import { applyApiErrorToForm } from "@/lib/forms";
import { formatMoney, toApiAmount } from "@/lib/money";
import { expenseSchema, type ExpenseValues } from "@/schemas/expense";

const DEFAULTS: ExpenseValues = {
  categoryId: "",
  amount: "",
  title: "",
  description: "",
  receiptUrl: "",
};

/**
 * "Log a shared expense" — something you paid for out of pocket that the pool should pay back.
 * Bottom sheet on phones. Amount first (big, decimal keypad), category as one-tap chips.
 */
export function SubmitExpenseDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { roomId, currencyCode, can } = useCurrentRoom();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const categories = useCategories(roomId);
  const { submit } = useExpenseMutations(roomId);

  const form = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: DEFAULTS,
  });
  const { errors } = form.formState;
  const noCategories = categories.isSuccess && categories.data.length === 0;

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  function handleOpenChange(next: boolean) {
    if (submit.isPending) return;
    setOpen(next);
    if (!next) form.reset(DEFAULTS);
  }

  function onSubmit(values: ExpenseValues) {
    const amount = toApiAmount(values.amount);
    submit.mutate(
      {
        categoryId: values.categoryId,
        amount,
        title: values.title,
        description: values.description || undefined,
        receiptUrl: values.receiptUrl || undefined,
      },
      {
        onSuccess: (expense) => {
          toast.success("Expense submitted", {
            description: `${expense.title} · ${formatMoney(amount, currencyCode)} is waiting for approval.`,
          });
          setOpen(false);
          form.reset(DEFAULTS);
        },
        onError: (error) =>
          applyApiErrorToForm(error, form.setError, {
            fields: ["categoryId", "amount", "title", "description", "receiptUrl"],
            codeToField: { CATEGORY_NOT_FOUND: "categoryId" },
          }),
      },
    );
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      dismissible={!submit.isPending}
      className="sm:max-w-lg"
      title="Log a shared expense"
      description="Paid for something the room shares? Once approved, the treasury owes you this amount."
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="contents">
        <ResponsiveDialogBody>
          <FieldGroup>
            <FormError message={errors.root?.server?.message} />

            {noCategories && (
              <Alert>
                <InfoIcon />
                <AlertDescription>
                  This room has no expense categories yet.{" "}
                  {can("categories.create") ? (
                    <Link href={`/rooms/${roomId}/settings`} className="underline">
                      Add one in settings
                    </Link>
                  ) : (
                    "Ask an admin or accountant to add one."
                  )}
                </AlertDescription>
              </Alert>
            )}

            <AmountField control={form.control} name="amount" currencyCode={currencyCode} />

            <TextField
              control={form.control}
              name="title"
              label="What was it?"
              placeholder="Weekly vegetables & dairy"
              autoComplete="off"
            />

            <Controller
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel id="expense-category-label">Category</FieldLabel>
                  {categories.isPending ? (
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-20 rounded-full" />
                      <Skeleton className="h-9 w-24 rounded-full" />
                      <Skeleton className="h-9 w-20 rounded-full" />
                    </div>
                  ) : (
                    <ChoiceChips
                      labelledBy="expense-category-label"
                      value={field.value}
                      onChange={field.onChange}
                      options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                    />
                  )}
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="expense-description">
                    Details <span className="text-muted-foreground font-normal">(optional)</span>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="expense-description"
                    rows={2}
                    placeholder="Bought from Reliance Smart"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <TextField
              control={form.control}
              name="receiptUrl"
              label="Receipt link (optional)"
              type="url"
              placeholder="https://…"
              autoComplete="off"
              description="Uploads aren't supported yet. Paste a link to a photo (Google Drive, Photos…)."
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
          <Button type="submit" disabled={submit.isPending || noCategories}>
            {submit.isPending && <Spinner />}
            Submit expense
          </Button>
        </ResponsiveDialogFooter>
      </form>
    </ResponsiveDialog>
  );
}
