import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ManaCaptions" },
      { name: "description", content: "Sign in to ManaCaptions with Google and get 10 free minutes of Telugu captions." },
      { property: "og:title", content: "Sign in — ManaCaptions" },
      { property: "og:description", content: "Start captioning Telugu videos in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    // 1. If user is already authenticated, forward to dashboard
    if (user) {
      void navigate({ to: "/dashboard", replace: true });
      return;
    }

    // 2. Check for OAuth callback or errors in URL (both hash # and query ?)
    if (typeof window !== "undefined") {
      const search = window.location.search;
      const hash = window.location.hash;

      // Check for OAuth error returned by Google or Supabase
      const params = new URLSearchParams(search || hash.replace(/^#/, "?"));
      const errorDesc = params.get("error_description") || params.get("error");
      if (errorDesc) {
        console.error("Auth error:", errorDesc);
        toast.error(`Sign in failed: ${decodeURIComponent(errorDesc.replace(/\+/g, " "))}`);
        setBusy(false);
        setAuthChecking(false);
        return;
      }

      // Check if we arrived with a PKCE code or access_token
      if (search.includes("code=") || hash.includes("access_token=")) {
        setBusy(true);
        supabase.auth.getSession().then(({ data, error }) => {
          if (error) {
            console.error("Session exchange error:", error);
            toast.error(error.message || "Failed to complete sign in.");
            setBusy(false);
          } else if (data.session?.user) {
            void navigate({ to: "/dashboard", replace: true });
          }
          setAuthChecking(false);
        });
        return;
      }
    }

    if (!loading) {
      setAuthChecking(false);
    }
  }, [user, loading, navigate]);

  async function signIn() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) {
        toast.error(result.error.message || "Sign in failed. Please try again.");
        setBusy(false);
      }
    } catch (e) {
      console.error("Sign in exception:", e);
      toast.error(e instanceof Error ? e.message : "Sign in failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero-glow px-4">
      <div className="w-full max-w-sm animate-fade-up rounded-3xl border border-border bg-card p-8 shadow-card">
        <Logo />
        <h1 className="mt-8 text-2xl font-bold">Welcome, creator</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to get 10 free minutes of Telugu captions.</p>
        
        {busy || (loading && authChecking) ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 py-4 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Signing you in...</p>
          </div>
        ) : (
          <Button onClick={signIn} disabled={busy} variant="hero" size="lg" className="mt-8 w-full">
            <GoogleIcon /> Continue with Google
          </Button>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          By continuing you agree to our <a href="/terms" className="underline">Terms</a> and{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.04 0-.6-.07-1.06-.15-1.51z" />
    </svg>
  );
}
