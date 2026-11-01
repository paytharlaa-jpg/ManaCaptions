import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { assertOwner } from "@/lib/api/owner-auth";

export const adminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const sb = context.supabase;
    const [users, jobs, failed, payments] = await Promise.all([
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("transcription_jobs").select("id", { count: "exact", head: true }),
      sb.from("transcription_jobs").select("id", { count: "exact", head: true }).in("status", ["failed", "refunded"]),
      sb.from("payments").select("amount_inr, credits").eq("status", "paid"),
    ]);
    const revenue = (payments.data ?? []).reduce((a, p) => a + p.amount_inr, 0);
    const creditsSold = (payments.data ?? []).reduce((a, p) => a + p.credits, 0);
    return {
      users: users.count ?? 0,
      jobs: jobs.count ?? 0,
      failedJobs: failed.count ?? 0,
      revenue,
      creditsSold,
      paidOrders: payments.data?.length ?? 0,
    };
  });

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const [{ data: profiles }, { data: wallets }, { data: roles }] = await Promise.all([
      context.supabase.from("profiles").select("id, email, display_name, created_at").order("created_at", { ascending: false }).limit(500),
      context.supabase.from("credit_wallets").select("user_id, balance"),
      context.supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);
    const bal = new Map((wallets ?? []).map((w) => [w.user_id, w.balance]));
    const admins = new Set((roles ?? []).map((r) => r.user_id));
    return (profiles ?? []).map((p) => ({ ...p, balance: bal.get(p.id) ?? 0, isAdmin: admins.has(p.id) }));
  });

const adjustSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(-10000).max(10000).refine((n) => n !== 0),
  note: z.string().trim().min(1).max(200),
});

export const adminAdjustCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof adjustSchema>) => adjustSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: balance, error } = await supabaseAdmin.rpc("owner_adjust_credit", {
      _actor: context.userId, _user_id: data.userId, _amount: data.amount, _reference: crypto.randomUUID(), _reason: data.note,
    });
    if (error) throw new Error(error.message.includes("INSUFFICIENT") ? "Balance cannot go below zero" : "Could not adjust credits");
    return { balance };
  });

export const adminListJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { onlyFailed?: boolean }) => z.object({ onlyFailed: z.boolean().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    let q = context.supabase
      .from("transcription_jobs")
      .select("id, user_id, project_id, status, credits_reserved, error, provider, created_at, projects(title)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.onlyFailed) q = q.in("status", ["failed", "refunded"]);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const adminRefundJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobId: string }) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("owner_refund_transcription", { _actor: context.userId, _job_id: data.jobId });
    if (error) throw new Error("Only failed, charged jobs are eligible for a refund");
    return { ok: true };
  });

export const adminListPayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const { data } = await context.supabase
      .from("payments")
      .select("id, user_id, package_id, razorpay_order_id, razorpay_payment_id, amount_inr, credits, status, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    return data ?? [];
  });
