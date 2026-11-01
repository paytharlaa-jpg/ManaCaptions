import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
export async function assertOwner(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_app_owner", { _user_id: context.userId });
  if (error || !data) throw new Error("Owner access required");
}