import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "./providers";
import "./globals.css";

// Variable names must match what globals.css / shadcn expect (--font-sans, --font-geist-mono).
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HisaabSync",
    template: "%s · HisaabSync",
  },
  description: "Shared room treasury and pooled expense management.",
  applicationName: "HisaabSync",
  appleWebApp: { capable: true, title: "HisaabSync", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

/**
 * Mobile-first viewport: `viewport-fit=cover` lets the bottom nav extend under the home indicator
 * (we pad it with env(safe-area-inset-bottom)); theme color tints the browser UI on phones.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes sets the `class` on <html> before React hydrates.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
