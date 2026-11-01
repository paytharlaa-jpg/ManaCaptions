import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireActiveAccount } from "./account-middleware";
import { assertOwner } from "./owner-auth";
import { DEFAULT_PRODUCT_SETTINGS, productSettingsSchema } from "@/lib/admin/settings-schema";

const rangeSchema = z.object({ from: z.string().datetime(), to: z.string().datetime() }).refine((r) => Date.parse(r.to) > Date.parse(r.from) && Date.parse(r.to) - Date.parse(r.from) <= 366 * 86400000);
export const controlOverview = createServerFn({ method: "POST" }).middleware([requireActiveAccount])
  .inputValidator((input: z.infer<typeof rangeSchema>) => rangeSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const [users, payments, transcription, rendering, ledger, total] = await Promise.all([
      sb.from("profiles").select("id,created_at").gte("created_at", data.from).lt("created_at", data.to).limit(10000),
      sb.from("payments").select("user_id,amount_inr,credits,status,created_at").gte("created_at", data.from).lt("created_at", data.to).limit(10000),
      sb.from("transcription_jobs").select("status,user_id,created_at,credits_reserved").gte("created_at", data.from).lt("created_at", data.to).limit(10000),
      sb.from("rendering_jobs").select("status,user_id,created_at,credits_reserved").gte("created_at", data.from).lt("created_at", data.to).limit(10000),
      sb.from("credit_ledger").select("kind,amount,created_at").gte("created_at", data.from).lt("created_at", data.to).limit(10000),
      sb.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    if ([users,payments,transcription,rendering,ledger,total].some((r) => r.error)) throw new Error("Could not load analytics");
    const paid = (payments.data ?? []).filter((p) => p.status === "paid");
    const rows = new Map<string,{ date: string; users: number; revenue: number; transcription: number; rendering: number; credits: number }>();
    const day = (time: string) => { const date = time.slice(0,10); let r = rows.get(date); if (!r) { r = { date, users: 0, revenue: 0, transcription: 0, rendering: 0, credits: 0 }; rows.set(date,r); } return r; };
    for (const u of users.data ?? []) day(u.created_at).users++;
    for (const p of paid) day(p.created_at).revenue += p.amount_inr;
    for (const j of transcription.data ?? []) day(j.created_at).transcription++;
    for (const j of rendering.data ?? []) day(j.created_at).rendering++;
    for (const l of ledger.data ?? []) if (l.kind === "reserve") day(l.created_at).credits += -l.amount;
    return {
      totalUsers: total.count ?? 0, newUsers: users.data?.length ?? 0, payingCustomers: new Set(paid.map((p) => p.user_id)).size,
      revenue: paid.reduce((n,p) => n+p.amount_inr,0), paidOrders: paid.length, creditsSold: paid.reduce((n,p) => n+p.credits,0),
      creditsConsumed: (ledger.data ?? []).reduce((n,l) => n + (l.kind === "reserve" ? -l.amount : l.kind === "refund" ? -l.amount : 0),0),
      transcriptionJobs: transcription.data?.length ?? 0, renderingJobs: rendering.data?.length ?? 0,
      failedJobs: [...(transcription.data ?? []),...(rendering.data ?? [])].filter((j) => ["failed","refunded"].includes(j.status)).length,
      successfulJobs: [...(transcription.data ?? []),...(rendering.data ?? [])].filter((j) => j.status === "completed").length,
      activeUsers: new Set([...(transcription.data ?? []),...(rendering.data ?? [])].map((j) => j.user_id)).size,
      series: [...rows.values()].sort((a,b) => a.date.localeCompare(b.date)),
      limited: [users,payments,transcription,rendering,ledger].some((r) => r.data?.length === 10000),
    };
  });
export const controlData = createServerFn({ method: "POST" }).middleware([requireActiveAccount])
  .inputValidator((input: { section: "audit" | "renders" | "settings" | "campaigns" | "announcements" | "ledger" | "packages" }) => z.object({ section: z.enum(["audit","renders","settings","campaigns","announcements","ledger","packages"]) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    if (data.section === "settings") { const { data: row, error } = await sb.from("app_settings").select("value,version").eq("key","product").maybeSingle(); if (error) throw new Error("Could not load settings"); return { settings: productSettingsSchema.parse(row?.value ?? DEFAULT_PRODUCT_SETTINGS), version: row?.version ?? 0, rows: [] as Record<string,string|number|boolean|null>[] }; }
    const table = { audit: "admin_audit_logs", renders: "rendering_jobs", campaigns: "email_campaigns", announcements: "announcements", ledger: "credit_ledger", packages: "credit_packages" } as const;
    const { data: rows, error } = await sb.from(table[data.section]).select("*").order("created_at",{ ascending:false }).limit(200);
    if (error) throw new Error("Could not load records");
    // These records contain metadata only; no original video URLs or provider credentials.
    return { settings: null, version: 0, rows: (rows ?? []).map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => !["render_configuration", "output_storage_path", "provider_job_id"].includes(key)).map(([key,value]) => [key, value === null ? null : typeof value === "object" ? JSON.stringify(value) : value])) as Record<string,string|number|boolean|null>) };
  });
const userSearchSchema = z.object({ search: z.string().trim().max(100), page: z.number().int().min(0).max(10000), status: z.enum(["all","active","suspended"]) });
export const controlUsers = createServerFn({ method:"POST" }).middleware([requireActiveAccount]).inputValidator((input:z.infer<typeof userSearchSchema>) => userSearchSchema.parse(input)).handler(async ({data,context}) => {
  await assertOwner(context);
  const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
  let q=sb.from("profiles").select("id,email,display_name,created_at",{count:"exact"}).order("created_at",{ascending:false});
  if(data.search) { const safe=data.search.replace(/[,%()\\]/g,""); if(safe) q=q.or(`email.ilike.%${safe}%,display_name.ilike.%${safe}%`); }
  if(data.status!=="all") { const {data:controls,error}=await sb.from("account_controls").select("user_id").eq("suspended",true); if(error) throw new Error("Could not filter accounts"); const ids=(controls??[]).map((c)=>c.user_id); if(data.status==="suspended") { if(!ids.length) return {rows:[],count:0}; q=q.in("id",ids); } else if(ids.length) q=q.not("id","in",`(${ids.join(",")})`); }
  const {data:profiles,error,count}=await q.range(data.page*25,data.page*25+24); if(error) throw new Error("Could not load users");
  const ids=(profiles??[]).map((p)=>p.id); if(!ids.length) return {rows:[],count:count??0};
  const [wallets,controls,purchases,jobs,renders]=await Promise.all([sb.from("credit_wallets").select("user_id,balance").in("user_id",ids),sb.from("account_controls").select("user_id,suspended").in("user_id",ids),sb.from("payments").select("user_id,amount_inr").eq("status","paid").in("user_id",ids).limit(10000),sb.from("transcription_jobs").select("user_id,created_at").in("user_id",ids).limit(10000),sb.from("rendering_jobs").select("user_id,created_at").in("user_id",ids).limit(10000)]);
  if([wallets,controls,purchases,jobs,renders].some((r)=>r.error)) throw new Error("Could not load account details");
  return {count:count??0,rows:(profiles??[]).map((p)=>({...p,balance:wallets.data?.find((w)=>w.user_id===p.id)?.balance??0,suspended:controls.data?.find((c)=>c.user_id===p.id)?.suspended??false,paidInr:(purchases.data??[]).filter((x)=>x.user_id===p.id).reduce((n,x)=>n+x.amount_inr,0),transcriptions:(jobs.data??[]).filter((j)=>j.user_id===p.id).length,renders:(renders.data??[]).filter((j)=>j.user_id===p.id).length}))};
});
export const suspendAccount=createServerFn({method:"POST"}).middleware([requireActiveAccount]).inputValidator((input:{userId:string;suspended:boolean;reason:string})=>z.object({userId:z.string().uuid(),suspended:z.boolean(),reason:z.string().trim().min(1).max(200)}).parse(input)).handler(async({data,context})=>{
 await assertOwner(context); if(data.userId===context.userId) throw new Error("The owner cannot suspend their own account");
 const {supabaseAdmin:sb}=await import("@/integrations/supabase/client.server");
 const {error}=await sb.rpc("owner_set_account_status",{_actor:context.userId,_user_id:data.userId,_suspended:data.suspended,_reason:data.reason}); if(error) throw new Error("Could not change account status"); return {ok:true};
});
export const saveProductSettings=createServerFn({method:"POST"}).middleware([requireActiveAccount]).inputValidator((input:{settings:z.infer<typeof productSettingsSchema>;version:number;reason:string})=>z.object({settings:productSettingsSchema,version:z.number().int().min(0),reason:z.string().trim().min(1).max(200)}).parse(input)).handler(async({data,context})=>{
 await assertOwner(context);const {supabaseAdmin:sb}=await import("@/integrations/supabase/client.server");const {error}=await sb.rpc("owner_save_settings",{_actor:context.userId,_value:data.settings as never,_version:data.version,_reason:data.reason}); if(error) throw new Error("Settings changed or could not be saved. Refresh and try again.");return {ok:true};
});
export const saveAnnouncement=createServerFn({method:"POST"}).middleware([requireActiveAccount]).inputValidator((input:{id?:string;title:string;body:string;audience:"all"|"paid"|"free";important:boolean;status:"draft"|"published"|"archived";publishedAt:string;expiresAt:string|null})=>z.object({id:z.string().uuid().optional(),title:z.string().trim().min(1).max(120),body:z.string().trim().min(1).max(2000),audience:z.enum(["all","paid","free"]),important:z.boolean(),status:z.enum(["draft","published","archived"]),publishedAt:z.string().datetime(),expiresAt:z.string().datetime().nullable()}).refine((a)=>!a.expiresAt||Date.parse(a.expiresAt)>Date.parse(a.publishedAt)).parse(input)).handler(async({data,context})=>{
 await assertOwner(context);const {supabaseAdmin:sb}=await import("@/integrations/supabase/client.server");const {error}=await sb.rpc("owner_save_announcement",{_actor:context.userId,_id:data.id??crypto.randomUUID(),_value:{title:data.title,body:data.body,audience:data.audience,important:data.important,status:data.status,published_at:data.publishedAt,expires_at:data.expiresAt}});if(error) throw new Error("Could not save announcement");return {ok:true};
});
export const saveCampaign=createServerFn({method:"POST"}).middleware([requireActiveAccount]).inputValidator((input:{subject:string;body:string;audience:string})=>z.object({subject:z.string().trim().min(1).max(150),body:z.string().trim().min(1).max(20000),audience:z.enum(["subscribers","paid","free","recent","transcription","rendering"])}).parse(input)).handler(async({data,context})=>{
 await assertOwner(context);const {supabaseAdmin:sb}=await import("@/integrations/supabase/client.server");const {error}=await sb.rpc("owner_save_campaign",{_actor:context.userId,_subject:data.subject,_body:data.body,_audience:data.audience});if(error) throw new Error("Could not save campaign");return {ok:true};
});