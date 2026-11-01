import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const requireActiveAccount = createMiddleware({ type: "function" }).middleware([requireSupabaseAuth]).server(async ({ next, context }) => {
  const { data, error } = await context.supabase.from("account_controls").select("suspended").eq("user_id", context.userId).maybeSingle();
  if (error) throw new Error("Could not verify account access");
  if (data?.suspended) throw new Error("Your account is suspended. Contact the application owner.");
  return next();
});