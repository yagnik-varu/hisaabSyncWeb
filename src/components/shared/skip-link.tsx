/** Keyboard users can jump past the header straight to the page content (WCAG 2.4.1). */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="bg-background focus-visible:ring-ring/50 sr-only z-[60] rounded-md border px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus-visible:ring-3"
    >
      Skip to content
    </a>
  );
}
