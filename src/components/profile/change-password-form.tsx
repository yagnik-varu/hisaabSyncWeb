"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormError } from "@/components/shared/form-error";
import { TextField } from "@/components/shared/form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { changePassword, type ChangePasswordInput } from "@/lib/api/endpoints/auth";
import { applyApiErrorToForm } from "@/lib/forms";
import { changePasswordSchema, type ChangePasswordValues } from "@/schemas/auth";

const EMPTY: ChangePasswordValues = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePasswordForm() {
  // /auth/me doesn't say whether the account is Google-only, so we learn it from AUTH_NO_PASSWORD_SET.
  const [googleOnly, setGoogleOnly] = useState(false);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (input: ChangePasswordInput) => changePassword(input),
    onSuccess: () => {
      form.reset(EMPTY);
      toast.success("Password changed");
    },
    onError: (error) => {
      const apiError = applyApiErrorToForm(error, form.setError, {
        fields: ["currentPassword", "newPassword"],
        codeToField: { AUTH_INVALID_CREDENTIALS: "currentPassword" },
      });
      if (apiError.code === "AUTH_NO_PASSWORD_SET") {
        form.clearErrors();
        setGoogleOnly(true);
      }
    },
  });

  if (googleOnly) {
    return (
      <Alert>
        <InfoIcon />
        <AlertDescription>
          You sign in with Google, so this account has no password to change.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit((v) =>
        mutation.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
      )}
      noValidate
    >
      <FieldGroup>
        <FormError message={errors.root?.server?.message} />
        <TextField
          control={form.control}
          name="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
        />
        <TextField
          control={form.control}
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          description="At least 8 characters."
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Change password
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
