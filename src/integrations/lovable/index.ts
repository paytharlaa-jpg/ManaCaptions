import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import type { OAuthProvider } from "@lovable.dev/cloud-auth-js";
import { supabase } from "../supabase/client";

const lovableAuth = createLovableAuth();

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

function isLovablePreview(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".gpt-eng.com")
  );
}

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: OAuthProvider, opts?: SignInOptions) => {
      // In production / custom domains (like manacaptions.online), use Supabase's native OAuth
      // so the browser goes directly to Supabase and Google instead of attempting to fetch
      // the Lovable editor broker /~oauth/initiate (which does not exist on self-hosted servers).
      if (!isLovablePreview()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider as "google",
          options: {
            redirectTo: opts?.redirect_uri ?? `${window.location.origin}/auth`,
            queryParams: opts?.extraParams,
          },
        });

        if (error) {
          return { error };
        }

        if (data?.url && typeof window !== "undefined") {
          window.location.href = data.url;
        }

        return { error: null, redirected: true, data };
      }

      // Inside Lovable preview sandbox:
      const result = await lovableAuth.signInWithOAuth(provider, {
        ...opts,
        extraParams: {
          ...opts?.extraParams,
        },
      });

      if (result.redirected) {
        return result;
      }

      if (result.error) {
        return result;
      }

      try {
        await supabase.auth.setSession(result.tokens);
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
      return result;
    },
  },
};
