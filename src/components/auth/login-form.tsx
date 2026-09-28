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
import { loginSchema, type LoginValues } from "@/schemas/auth";

/**
 * Email/password + Google sign-in. On success the session store flips to "authenticated" and
 * RedirectIfAuthenticated (in the (auth) layout) navigates to ?next= or /rooms.
 */
export function LoginForm({ registerHref }: { registerHref: string }) {
  const { login, loginWithGoogle } = useAuth();
  const [googlePending, setGooglePending] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { isSubmitting, errors } = form.formState;
  const busy = isSubmitting || googlePending;

  async function onSubmit(values: LoginValues) {
    try {
      await login(values);
    } catch (error) {
      applyApiErrorToForm(error, form.setError, { fields: ["email", "password"] });
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
          name="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={busy}
        />
        <TextField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          disabled={busy}
        />

        <Button type="submit" className="w-full" disabled={busy}>
          {isSubmitting && <Spinner />}
          Sign in
        </Button>

        {isGoogleSignInEnabled && (
          <>
            <FieldSeparator>or</FieldSeparator>
            <GoogleSignInButton
              onCredential={onGoogleCredential}
              onError={(message) => form.setError("root.server", { message })}
              text="signin_with"
            />
            {googlePending && (
              <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                <Spinner /> Signing in with Google…
              </p>
            )}
          </>
        )}

        <p className="text-muted-foreground text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href={registerHref}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
