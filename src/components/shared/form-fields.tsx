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
}: TextFieldProps<T>) {
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
