import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TranscriptSegment } from "@/lib/captions/types";

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export const walletQuery = queryOptions({
  queryKey: ["wallet"],
  queryFn: async () => {
    const id = await uid();
    const { data } = await supabase.from("credit_wallets").select("balance").eq("user_id", id).maybeSingle();
    return data?.balance ?? 0;
  },
});

export const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, language, duration_seconds, created_at, transcription_jobs(status), transcripts(project_id)")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const ledgerQuery = queryOptions({
  queryKey: ["ledger"],
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase
      .from("credit_ledger")
      .select("id, kind, amount, balance_after, note, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data;
  },
});

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
});

export const studioQuery = (projectId: string) =>
  queryOptions({
    queryKey: ["studio", projectId],
    queryFn: async () => {
      const { data: project, error } = await supabase
        .from("projects")
        .select("id, title, storage_path, style_preset, caption_style, language, duration_seconds, created_at")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      const [{ data: transcript }, signed] = await Promise.all([
        supabase.from("transcripts").select("segments, romanized_segments, timing_source").eq("project_id", projectId).maybeSingle(),
        project.storage_path
          ? supabase.storage.from("videos").createSignedUrl(project.storage_path, Math.max(1, Math.min(300, Math.floor((Date.parse(project.created_at) + 72 * 3600000 - Date.now()) / 1000))))
          : Promise.resolve({ data: null }),
      ]);
      return {
        project,
        videoUrl: signed.data?.signedUrl ?? null,
        segments: (transcript?.segments ?? null) as unknown as TranscriptSegment[] | null,
        romanized: (transcript?.romanized_segments ?? null) as unknown as TranscriptSegment[] | null,
        timingSource: transcript?.timing_source ?? "estimated",
      };
    },
  });
