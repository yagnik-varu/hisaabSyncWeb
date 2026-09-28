"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { GoogleSignInButton, isGoogleSignInEnabled } from "@/components/auth/google-sign-in-button";
import { FormError } from "@/components/shared/form-error";
import { TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { applyApiErrorToForm } from "@/lib/forms";
import { normalizePhone, registerSchema, type RegisterValues } from "@/schemas/auth";

export function RegisterForm({ loginHref }: { loginHref: string }) {
  const { register, loginWithGoogle } = useAuth();
  const [googlePending, setGooglePending] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });
  const { isSubmitting, errors } = form.formState;
  const busy = isSubmitting || googlePending;

  async function onSubmit(values: RegisterValues) {
    try {
      await register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        // Optional field: omit entirely when empty (backend @IsOptional + @IsString).
        phone: values.phone ? normalizePhone(values.phone) : undefined,
      });
    } catch (error) {
      applyApiErrorToForm(error, form.setError, {
        fields: ["fullName", "email", "phone", "password"],
        codeToField: { AUTH_EMAIL_ALREADY_EXISTS: "email" },
      });
    }
  }

  async function onGoogleCredential(idToken: string) {
    form.clearErrors();
    setGooglePending(true);
    try {
      await loginWithGoogle(idToken);
    } catch (error) {
      applyApiErrorToForm(error, form.setError);
    } finally {
      setGooglePending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormError message={errors.root?.server?.message} />

        <TextField
          control={form.control}
          name="fullName"
          label="Full name"
          placeholder="Yagnik Varu"
          autoComplete="name"
          disabled={busy}
        />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={busy}
        />
        <TextField
          control={form.control}
          name="phone"
          label="Phone (optional)"
          type="tel"
          placeholder="+919876543210"
          autoComplete="tel"
          description="International format with country code."
          disabled={busy}
        />
        <TextField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          description="At least 8 characters."
          disabled={busy}
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          disabled={busy}
        />

        <Button type="submit" className="w-full" disabled={busy}>
          {isSubmitting && <Spinner />}
          Create account
        </Button>

        {isGoogleSignInEnabled && (
          <>
            <FieldSeparator>or</FieldSeparator>
            <GoogleSignInButton
              onCredential={onGoogleCredential}
              onError={(message) => form.setError("root.server", { message })}
              text="signup_with"
            />
          </>
        )}

        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
