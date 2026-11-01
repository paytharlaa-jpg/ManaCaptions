import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
export const Route=createFileRoute("/api/public/media-cleanup")({server:{handlers:{POST:async({request})=>{
 const denied=await authenticateCronRequest(request);if(denied)return denied;
 const {supabaseAdmin:sb}=await import("@/integrations/supabase/client.server");
 const {data:sources,error}=await sb.rpc("claim_expired_sources");if(error)return Response.json({error:"Cleanup unavailable"},{status:503});
 let removed=0,failed=0;
 for(const p of sources??[]){if(!p.storage_path.startsWith(`${p.user_id}/`)){failed++;continue;}const {error:removeError}=await sb.storage.from("videos").remove([p.storage_path]);if(removeError){failed++;continue;}const {error:updateError}=await sb.from("projects").update({source_deleted_at:new Date().toISOString()}).eq("id",p.project_id);if(updateError){failed++;continue;}await sb.from("admin_audit_logs").insert({action:"source_cleanup",target:p.project_id,reason:"Source retention expired"});removed++;}
 const {data:outputs,error:outputsError}=await sb.from("rendering_jobs").select("id,user_id,output_storage_path").eq("status","completed").is("output_deleted_at",null).lt("output_expires_at",new Date().toISOString()).limit(20);
 if(outputsError)failed++;for(const j of outputs??[]){if(!j.output_storage_path?.startsWith(`${j.user_id}/`)){failed++;continue;}const {error:removeError}=await sb.storage.from("rendered-videos").remove([j.output_storage_path]);if(removeError){failed++;continue;}const {error:updateError}=await sb.from("rendering_jobs").update({output_deleted_at:new Date().toISOString()}).eq("id",j.id);if(updateError){failed++;continue;}await sb.from("admin_audit_logs").insert({action:"output_cleanup",target:j.id,reason:"24-hour download retention expired"});removed++;}
 return Response.json({removed,failed},{status:failed?207:200});
}}}});