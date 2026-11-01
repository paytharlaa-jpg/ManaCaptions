import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireActiveAccount } from "@/lib/api/account-middleware";
import { creditsForDuration, MAX_AUDIO_SECONDS } from "@/lib/credits";
import type { TranscriptSegment } from "@/lib/captions/types";
import { captionStyleSchema, PRESET_IDS } from "@/lib/captions/style-schema";
import { validateCaptionTiming } from "@/lib/captions/timing";

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  language: z.enum(["te", "mixed", "en"]),
  storagePath: z.string().min(1).max(400),
  durationSeconds: z.number().positive().max(MAX_AUDIO_SECONDS),
});

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireActiveAccount])
  .inputValidator((input: z.infer<typeof createSchema>) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!data.storagePath.startsWith(`${context.userId}/`)) throw new Error("Invalid file path");
    const { getProductPolicy } = await import("@/lib/admin/product-policy.server");
    const policy = await getProductPolicy();
    if (data.durationSeconds > policy.maxVideoSeconds) throw new Error("Video exceeds the configured duration limit");
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({
        user_id: context.userId,
        title: data.title,
        language: data.language,
        storage_path: data.storagePath,
        duration_seconds: data.durationSeconds,
      })
      .select("id")
      .single();
    if (error) throw new Error("Could not create the project");
    return { id: row.id };
  });

const startSchema = z.object({ projectId: z.string().uuid(), audioPath: z.string().min(1).max(400) });

export const startTranscription = createServerFn({ method: "POST" })
  .middleware([requireActiveAccount])
  .inputValidator((input: z.infer<typeof startSchema>) => startSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.audioPath.startsWith(`${userId}/`)) throw new Error("Invalid audio path");
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id, duration_seconds, language")
      .eq("id", data.projectId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!project) throw new Error("Project not found");

    const { getProductPolicy } = await import("@/lib/admin/product-policy.server");
    const policy = await getProductPolicy();
    if (Number(project.duration_seconds) > policy.maxVideoSeconds) throw new Error("Video exceeds the configured duration limit");
    const cost = creditsForDuration(Number(project.duration_seconds)) * policy.transcriptionCreditsPerMinute;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: job, error: jobError } = await supabaseAdmin
      .from("transcription_jobs")
      .insert({ project_id: project.id, user_id: userId, status: "processing", credits_reserved: cost })
      .select("id")
      .single();
    if (jobError || !job) throw new Error("Could not start the job");

    const { error: reserveError } = await supabaseAdmin.rpc("apply_credit", {
      _user_id: userId,
      _kind: "reserve",
      _amount: -cost,
      _reference: job.id,
      _note: `Transcription (${cost} min)`,
    });
    if (reserveError) {
      await supabaseAdmin
        .from("transcription_jobs")
        .update({ status: "failed", credits_reserved: 0, error: "Not enough credits" })
        .eq("id", job.id);
      return { ok: false as const, error: `You need ${cost} credits for this video. Please buy more credits.` };
    }

    try {
      const { data: audio, error: dlError } = await supabase.storage.from("videos").download(data.audioPath);
      if (dlError || !audio) throw new Error("Could not read the audio file");
      const bytes = new Uint8Array(await audio.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      const { getTranscriptionProvider } = await import("@/lib/transcription/provider.server");
      const provider = getTranscriptionProvider();
      const result = await provider.transcribe({
        audioBase64: btoa(binary),
        language: project.language as "te" | "mixed" | "en",
        jobId: job.id,
      });
      if (result.segments.length === 0) throw new Error("No speech was found in this video");

      const { error: transcriptError } = await supabaseAdmin.from("transcripts").upsert({
        project_id: project.id,
        user_id: userId,
        language: result.language,
        segments: result.segments as never,
        romanized_segments: null,
        timing_source: provider.timingSource,
      });
      if (transcriptError) throw new Error("Could not store captions");
      const { error: completionError } = await supabaseAdmin.from("transcription_jobs").update({ status: "completed", provider: provider.id }).eq("id", job.id);
      if (completionError) throw new Error("Could not complete transcription");
      await supabase.storage.from("videos").remove([data.audioPath]);
      return { ok: true as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transcription failed";
      console.error("transcription failed", job.id, message);
      const { error: refundError } = await supabaseAdmin.rpc("apply_credit", {
        _user_id: userId,
        _kind: "refund",
        _amount: cost,
        _reference: job.id,
        _note: "Refund: transcription failed",
      });
      const safeMessage = "Transcription failed. Please try again or contact the application owner.";
      await supabaseAdmin.from("transcription_jobs").update({ status: refundError ? "failed" : "refunded", error: safeMessage }).eq("id", job.id);
      return { ok: false as const, error: refundError ? `${safeMessage} Your credit refund requires review.` : `${safeMessage} Your credits were returned.` };
    }
  });

const segmentSchema = z.object({
  id: z.string(),
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string().max(1000),
  words: z
    .array(z.object({ id: z.string(), text: z.string().max(200), start: z.number(), end: z.number() }))
    .optional(),
});
const saveSchema = z.object({
  projectId: z.string().uuid(),
  segments: z.array(segmentSchema).max(5000),
  script: z.enum(["telugu", "roman"]),
  stylePreset: z.enum(PRESET_IDS),
  captionStyle: captionStyleSchema.optional(),
});

export const saveTranscript = createServerFn({ method: "POST" })
  .middleware([requireActiveAccount])
  .inputValidator((input: z.infer<typeof saveSchema>) => saveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const column = data.script === "roman" ? "romanized_segments" : "segments";
    const { data: project, error: projectError } = await context.supabase.from("projects").select("duration_seconds").eq("id", data.projectId).eq("user_id", context.userId).maybeSingle();
    if (projectError || !project) throw new Error("Project not found");
    validateCaptionTiming(data.segments, Number(project.duration_seconds));
    const { error } = await context.supabase
      .from("transcripts")
      .update({ [column]: data.segments as never })
      .eq("project_id", data.projectId)
      .eq("user_id", context.userId);
    if (error) throw new Error("Could not save");
    const { error: styleError } = await context.supabase
      .from("projects")
      .update({ style_preset: data.stylePreset, ...(data.captionStyle ? { caption_style: data.captionStyle as never } : {}) })
      .eq("id", data.projectId)
      .eq("user_id", context.userId);
    if (styleError) throw new Error("Could not save caption style");
    return { ok: true };
  });

export const romanizeTranscript = createServerFn({ method: "POST" })
  .middleware([requireActiveAccount])
  .inputValidator((input: { projectId: string }) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: t } = await context.supabase
      .from("transcripts")
      .select("segments, romanized_segments")
      .eq("project_id", data.projectId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!t) throw new Error("Transcript not found");
    if (t.romanized_segments) return { segments: t.romanized_segments as unknown as TranscriptSegment[] };

    const segments = t.segments as unknown as TranscriptSegment[];
    const words = segments.flatMap((s) => (s.words ?? []).map((w) => w.text));
    const { streamChatJson } = await import("@/lib/ai-gateway.server");
    const out = await streamChatJson<{ words: string[] }>({
      model: "google/gemini-3.8-flash",
      schemaName: "romanized",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["words"],
        properties: { words: { type: "array", items: { type: "string" } } },
      },
      messages: [
        {
          role: "system",
          content:
            "Convert each Telugu word to casual Romanized Telugu as creators type it on social media (e.g. 'నమస్కారం' -> 'namaskaram', 'ఎలా ఉన్నారు' -> 'ela unnaru'). Keep English words unchanged. Return exactly one output word per input word, same order, same count.",
        },
        { role: "user", content: JSON.stringify(words) },
      ],
    });
    if (out.words.length !== words.length) throw new Error("Romanization did not line up. Please try again.");

    let i = 0;
    const romanized: TranscriptSegment[] = segments.map((s) => {
      const ws = (s.words ?? []).map((w) => ({ ...w, text: out.words[i++] ?? w.text }));
      return { ...s, words: ws, text: ws.map((w) => w.text).join(" ") };
    });
    await context.supabase
      .from("transcripts")
      .update({ romanized_segments: romanized as never })
      .eq("project_id", data.projectId)
      .eq("user_id", context.userId);
    return { segments: romanized };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireActiveAccount])
  .inputValidator((input: { projectId: string }) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: p } = await context.supabase
      .from("projects")
      .select("storage_path")
      .eq("id", data.projectId)
      .eq("user_id", context.userId)
      .maybeSingle();
    const { data: renders, error: renderError } = await context.supabase.from("rendering_jobs").select("id").eq("project_id", data.projectId).eq("user_id", context.userId).limit(1);
    if (renderError) throw new Error("Could not verify project jobs");
    if (renders?.length) throw new Error("Projects with render history cannot be deleted yet");
    if (p?.storage_path) { const { error } = await context.supabase.storage.from("videos").remove([p.storage_path]); if (error) throw new Error("Could not delete video"); }
    const { error } = await context.supabase.from("projects").delete().eq("id", data.projectId).eq("user_id", context.userId);
    if (error) throw new Error("Could not delete project");
    return { ok: true };
  });
