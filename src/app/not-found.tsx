import { SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <SearchXIcon className="text-muted-foreground size-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/rooms">Go to my rooms</Link>
      </Button>
    </main>
  );
}
