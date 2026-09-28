import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  const loginHref = typeof next === "string" ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>Pool money with your roommates, transparently.</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm loginHref={loginHref} />
      </CardContent>
    </Card>
  );
}
