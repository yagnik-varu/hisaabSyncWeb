"use client";

import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { PasswordInput } from "@/components/shared/password-input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  type?: "text" | "email" | "tel" | "url" | "password";
  placeholder?: string;
  autoComplete?: string;
  description?: React.ReactNode;
  disabled?: boolean;
  /** Extra content next to the label (e.g. a "Forgot?" link). */
  labelAction?: React.ReactNode;
  /** Extra classes for the <input> itself. */
  inputClassName?: string;
  /** Override the mobile keyboard's auto-capitalization (e.g. "characters" for room codes). */
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  /** Mobile keyboard "enter" key label. */
  enterKeyHint?: "next" | "done" | "go" | "send" | "search";
}

/**
 * RHF + shadcn Field text input. Wires id/label/aria-invalid/error message in one place so every
 * form in the app looks and behaves the same.
 */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  description,
  disabled,
  labelAction,
  inputClassName,
  autoCapitalize,
  enterKeyHint,
}: TextFieldProps<T>) {
  // Phones: never auto-capitalize/autocorrect emails, links, passwords or codes.
  const literal = type === "email" || type === "url" || type === "password";
  const id = `field-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const inputProps = {
          ...field,
          value: field.value ?? "",
          id,
          placeholder,
          autoComplete,
          disabled,
          className: inputClassName,
          autoCapitalize: autoCapitalize ?? (literal ? "none" : undefined),
          autoCorrect: literal || autoCapitalize === "characters" ? "off" : undefined,
          spellCheck: literal || autoCapitalize === "characters" ? false : undefined,
          inputMode:
            type === "tel"
              ? ("tel" as const)
              : type === "url"
                ? ("url" as const)
                : type === "email"
                  ? ("email" as const)
                  : undefined,
          enterKeyHint,
          "aria-invalid": fieldState.invalid,
          "aria-describedby": description ? `${id}-description` : undefined,
        };
        return (
          <Field data-invalid={fieldState.invalid}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor={id}>{label}</FieldLabel>
              {labelAction}
            </div>
            {type === "password" ? (
              <PasswordInput {...inputProps} />
            ) : (
              <Input {...inputProps} type={type} />
            )}
            {description && (
              <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
            )}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
