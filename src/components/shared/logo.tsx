import { WalletIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * App logo. `compactOnMobile` hides the word mark below the `sm` breakpoint so the app header
 * (room switcher + bell + theme + avatar) fits on 360px-wide phones.
 */
export function Logo({
  href = "/",
  className,
  compactOnMobile,
}: {
  href?: string;
  className?: string;
  compactOnMobile?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="HisaabSync home"
      className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}
    >
      <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
        <WalletIcon className="size-4" />
      </span>
      <span className={compactOnMobile ? "hidden sm:inline" : undefined}>HisaabSync</span>
    </Link>
  );
}
