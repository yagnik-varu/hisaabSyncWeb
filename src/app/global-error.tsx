"use client";

/**
 * Last-resort boundary for errors in the root layout itself. It replaces the whole document, so
 * it can't rely on globals.css, providers or the theme — plain inline styles only.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: 16,
          textAlign: "center",
        }}
      >
        <title>Something went wrong · HisaabSync</title>
        <main>
          <h1 style={{ fontSize: 20 }}>HisaabSync ran into a problem</h1>
          <p style={{ color: "#666" }}>Please try again. Your data is safe on the server.</p>
          {error.digest && (
            <p style={{ color: "#999", fontFamily: "monospace", fontSize: 12 }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={() => retry()}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
