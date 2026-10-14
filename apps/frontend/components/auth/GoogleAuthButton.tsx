"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RegistrationRole } from "../../api/types";
import { loginWithGoogle } from "../../api/userApi";
import { useAuthStore } from "../../Store/useUserStore";
import Alert from "../ui/Alert";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type: "standard";
              theme: "outline";
              size: "large";
              text: "continue_with" | "signup_with";
              shape: "rectangular";
              width: number;
              logo_alignment: "left";
            }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleAuthButton({
  role,
  mode,
}: {
  role?: RegistrationRole;
  mode: "login" | "signup";
}) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.login);
  const buttonContainer = useRef<HTMLDivElement>(null);
  const isPending = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    if (window.google?.accounts.id) {
      const readyTimer = window.setTimeout(() => setScriptReady(true), 0);
      return () => window.clearTimeout(readyTimer);
    }

    let script = document.querySelector<HTMLScriptElement>(
      'script[data-google-identity="true"]'
    );
    const ownsScript = !script;
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
    }

    const handleLoad = () => setScriptReady(true);
    const handleError = () => setScriptError(true);
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    if (ownsScript) document.head.appendChild(script);

    return () => {
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, []);

  const handleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential || isPending.current) {
        if (!response.credential) setError("Google did not return a sign-in credential.");
        return;
      }

      isPending.current = true;
      setPending(true);
      setError(null);
      try {
        const result = await loginWithGoogle(response.credential, role);
        setSession(result.user, result.accessToken);
        const roleHome = {
          TENANT: "/tenant",
          LANDLORD: "/landlord",
          ADMIN: "/admin",
        }[result.user.role];
        router.replace(roleHome);
      } catch (authError) {
        setError(
          authError instanceof Error ? authError.message : "Could not sign in with Google."
        );
      } finally {
        isPending.current = false;
        setPending(false);
      }
    },
    [role, router, setSession]
  );

  useEffect(() => {
    const google = window.google;
    const container = buttonContainer.current;
    if (!scriptReady || !google || !container || !GOOGLE_CLIENT_ID) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
    });
    container.replaceChildren();
    google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: mode === "signup" ? "signup_with" : "continue_with",
      shape: "rectangular",
      width: Math.min(Math.max(container.clientWidth, 200), 400),
      logo_alignment: "left",
    });
  }, [handleCredential, mode, scriptReady]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="auth-provider-note">
        Google sign-in is unavailable until NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured.
      </p>
    );
  }

  return (
    <div className="auth-google">
      <div
        ref={buttonContainer}
        className="auth-google-button"
        aria-label={mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
        aria-busy={pending}
      />
      {!scriptReady && !scriptError && (
        <p className="auth-google-pending">Loading Google sign-in…</p>
      )}
      {scriptError && (
        <p className="auth-provider-note" role="status">
          Google sign-in could not load. Check your connection and try again.
        </p>
      )}
      {pending && <p className="auth-google-pending">Connecting your Google account…</p>}
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
