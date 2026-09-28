"use client";

import { useId, useState } from "react";

import { FormError } from "@/components/shared/form-error";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { normalizeError } from "@/lib/api/errors";

export interface ConfirmReasonOptions {
  label: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  /** Minimum characters when required (default 3). */
  minLength?: number;
  /** Help text under the field. Default explains the reason is shown to the submitter; null hides it. */
  description?: string | null;
}

/**
 * Confirmation for irreversible / financial actions (approve, reject, pay, remove…).
 * - Stays open while `onConfirm` runs and shows its error inline (no silent failures).
 * - Closes itself on success.
 * - Optional reason textarea (e.g. rejection reason), required or optional.
 * - Uncontrolled (pass `trigger`) or controlled (pass `open` + `onOpenChange`, e.g. opened from a
 *   dropdown menu item, which unmounts as soon as the menu closes).
 * Uses a plain Button instead of AlertDialogAction because Action closes immediately on click.
 */
export function ConfirmDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  confirmDisabled,
  reason,
  children,
  onConfirm,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  /** Block confirming (e.g. strict-mode balance too low); explain why via children. */
  confirmDisabled?: boolean;
  reason?: ConfirmReasonOptions;
  /** Extra content (summary of the item, warnings…) shown above the reason field. */
  children?: React.ReactNode;
  onConfirm: (reason: string | undefined) => Promise<unknown>;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    controlledOnOpenChange?.(next);
  };
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const reasonId = useId();

  const trimmed = text.trim();
  const minLength = reason?.minLength ?? 3;
  const reasonInvalid = !!reason?.required && trimmed.length < minLength;

  function handleOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (!next) {
      setError(null);
      setText("");
    }
  }

  async function confirm() {
    if (reasonInvalid) {
      setError(`Please enter a reason (at least ${minLength} characters).`);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onConfirm(reason ? trimmed || undefined : undefined);
      setOpen(false);
      setText("");
    } catch (e) {
      setError(normalizeError(e).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      {/* Wider on phones than shadcn's 320px default: room for the summary + reason field. */}
      <AlertDialogContent className="max-h-[90dvh] overflow-y-auto data-[size=default]:max-w-[calc(100%-2rem)] sm:data-[size=default]:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>

        {children}

        {reason && (
          <Field>
            <FieldLabel htmlFor={reasonId}>
              {reason.label}
              {!reason.required && (
                <span className="text-muted-foreground font-normal">(optional)</span>
              )}
            </FieldLabel>
            <Textarea
              id={reasonId}
              rows={3}
              value={text}
              maxLength={reason.maxLength ?? 500}
              placeholder={reason.placeholder}
              onChange={(e) => setText(e.target.value)}
              disabled={pending}
            />
            {reason.description !== null && (
              <FieldDescription>
                {reason.description ?? "Shown to the person who submitted it."}
              </FieldDescription>
            )}
          </Field>
        )}

        <FormError message={error ?? undefined} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => void confirm()}
            disabled={pending || confirmDisabled}
          >
            {pending && <Spinner />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
