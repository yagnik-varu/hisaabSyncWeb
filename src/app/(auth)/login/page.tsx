import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  // Keep ?next= when switching to the register page so the user still lands where they wanted.
  const registerHref =
    typeof next === "string" ? `/register?next=${encodeURIComponent(next)}` : "/register";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to manage your room treasuries.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm registerHref={registerHref} />
      </CardContent>
    </Card>
  );
}
