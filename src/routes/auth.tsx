import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function signIn() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) {
      toast.error("Sign in failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero-glow px-4">
      <div className="w-full max-w-sm animate-fade-up rounded-3xl border border-border bg-card p-8 shadow-card">
        <Logo />
        <h1 className="mt-8 text-2xl font-bold">Welcome, creator</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to get 10 free minutes of Telugu captions.</p>
        <Button onClick={signIn} disabled={busy} variant="hero" size="lg" className="mt-8 w-full">
          {busy ? <Loader2 className="animate-spin" /> : <GoogleIcon />} Continue with Google
        </Button>
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
