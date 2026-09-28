"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

/** "Log a shared expense" — something you paid for out of pocket that the pool should pay back. */
export function SubmitExpenseDialog({ trigger }: { trigger: React.ReactNode }) {
  const { roomId, currencyCode, can } = useCurrentRoom();
  const [open, setOpen] = useState(false);
  const categories = useCategories(roomId);
  const { submit } = useExpenseMutations(roomId);

  const form = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: DEFAULTS,
  });
  const { errors } = form.formState;
  const noCategories = categories.isSuccess && categories.data.length === 0;

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Log a shared expense</DialogTitle>
            <DialogDescription>
              Paid for something the room shares? Once approved, the treasury owes you this amount.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
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

            <TextField
              control={form.control}
              name="title"
              label="What was it?"
              placeholder="Weekly vegetables & dairy"
              autoComplete="off"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="amount"
                label={`Amount (${currencyCode})`}
                placeholder="1450.00"
                autoComplete="off"
                inputClassName="tabular-nums"
              />
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="expense-category">Category</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={categories.isPending || noCategories}
                    >
                      <SelectTrigger
                        id="expense-category"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder={categories.isPending ? "Loading…" : "Choose…"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.data?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

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

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
