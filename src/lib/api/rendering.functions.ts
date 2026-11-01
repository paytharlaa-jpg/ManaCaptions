import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireActiveAccount } from "@/lib/api/account-middleware";
import { authorizeResolution, resolutionSchema, validateRenderDuration } from "@/lib/rendering/render-validation";

export const renderAvailability = createServerFn({ method: "POST" }).middleware([requireActiveAccount])
  .inputValidator((input: { projectId: string }) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const [{ data: project, error }, payments, jobs] = await Promise.all([
      context.supabase.from("projects").select("id,user_id,duration_seconds,storage_path").eq("id", data.projectId).eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("payments").select("id").eq("user_id", context.userId).eq("status", "paid").limit(1),
      context.supabase.from("rendering_jobs").select("id,status,requested_resolution,progress_percentage,error_code,created_at,output_expires_at").eq("project_id", data.projectId).eq("user_id", context.userId).order("created_at", { ascending: false }).limit(20),
    ]);
    if (error || !project) throw new Error("Project not found");
    if (payments.error || jobs.error) throw new Error("Could not load export information");
    return { paid: Boolean(payments.data?.length), configured: false, pricingApproved: false, jobs: jobs.data, duration: Number(project.duration_seconds) };
  });
export const submitRender = createServerFn({ method: "POST" }).middleware([requireActiveAccount])
  .inputValidator((input: { projectId: string; resolution: z.infer<typeof resolutionSchema>; idempotencyKey: string }) => z.object({ projectId: z.string().uuid(), resolution: resolutionSchema, idempotencyKey: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: project } = await context.supabase.from("projects").select("duration_seconds").eq("id", data.projectId).eq("user_id", context.userId).maybeSingle();
    if (!project) throw new Error("Project not found");
    validateRenderDuration(Number(project.duration_seconds));
    const { data: paid, error } = await context.supabase.from("payments").select("id").eq("user_id", context.userId).eq("status", "paid").limit(1);
    if (error) throw new Error("Could not verify export entitlement");
    authorizeResolution(data.resolution, Boolean(paid?.length));
    const { createRenderForOwner } = await import("@/lib/rendering/orchestrator.server");
    return createRenderForOwner({ userId: context.userId, projectId: data.projectId, resolution: data.resolution, idempotencyKey: data.idempotencyKey, script: "telugu" });
  });