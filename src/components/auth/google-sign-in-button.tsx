"use client";

import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useTheme } from "next-themes";

import { GOOGLE_CLIENT_ID } from "@/lib/env";

interface GoogleSignInButtonProps {
  /** Receives the Google ID token (a JWT) to send to POST /auth/google. */
  onCredential: (idToken: string) => void;
  onError: (message: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

/**
 * Official Google Identity Services button. Renders nothing unless NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
 * The provider is scoped here so Google's script only loads on pages that show the button.
 */
export function GoogleSignInButton({
  onCredential,
  onError,
  text = "continue_with",
}: GoogleSignInButtonProps) {
  const { resolvedTheme } = useTheme();

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={(response) => {
            if (response.credential) onCredential(response.credential);
            else onError("Google did not return a credential. Please try again.");
          }}
          onError={() => onError("Google sign-in was cancelled or failed.")}
          theme={resolvedTheme === "dark" ? "filled_black" : "outline"}
          text={text}
          shape="rectangular"
          width={320}
        />
      </div>
    </GoogleOAuthProvider>
  );
}

export const isGoogleSignInEnabled = Boolean(GOOGLE_CLIENT_ID);
