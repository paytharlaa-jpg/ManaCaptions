import { getRenderingProvider } from "./render-provider-registry.server";
import { generateAss } from "@/lib/captions/ass-generator";
import { normalizeStyle } from "@/lib/captions/style-schema";
import type { TranscriptSegment } from "@/lib/captions/types";
import { authorizeResolution, outputDimensions, validateRenderDuration, type Resolution } from "./render-validation";
import { estimateRenderCredits } from "./render-credits";
import type { RenderRequest } from "./render-provider";

export async function createRenderForOwner(input:{userId:string;projectId:string;resolution:Resolution;idempotencyKey:string;script:"telugu"|"roman"}) {
 const provider=getRenderingProvider();
 if(!provider)throw new Error("MP4 rendering is awaiting provider configuration. No credits were charged.");
 const {supabaseAdmin:sb}=await import("@/integrations/supabase/client.server");
 const [p,t,payment,settings]=await Promise.all([sb.from("projects").select("*").eq("id",input.projectId).eq("user_id",input.userId).maybeSingle(),sb.from("transcripts").select("segments,romanized_segments").eq("project_id",input.projectId).eq("user_id",input.userId).maybeSingle(),sb.from("payments").select("id").eq("user_id",input.userId).eq("status","paid").limit(1),sb.from("app_settings").select("value").eq("key","product").maybeSingle()]);
 if([p,t,payment,settings].some((r)=>r.error)||!p.data||!t.data)throw new Error("Rendering input unavailable");
 const project=p.data,duration=Number(project.duration_seconds);validateRenderDuration(duration);authorizeResolution(input.resolution,Boolean(payment.data?.length));
 if(!project.storage_path?.startsWith(`${input.userId}/`))throw new Error("Source video unavailable");
 // Activated adapters must supply independently verified media metadata before this pipeline can reserve credits.
 const metadata=project.media_metadata as {width?:number;height?:number;verified?:boolean}|null;
 if(metadata?.verified!==true||!metadata.width||!metadata.height)throw new Error("Verified source metadata is required before rendering");
 const style=normalizeStyle(project.caption_style);
 const segments=(input.script==="roman"?t.data.romanized_segments:t.data.segments) as unknown as TranscriptSegment[]|null;
 if(!segments?.length)throw new Error("Captions unavailable");
 const dimensions=outputDimensions(input.resolution,metadata.width,metadata.height);
 const policy=settings.data?.value as {renderPricingApproved?:boolean;renderingCreditsPerMinute?:Record<Resolution,number>}|null;
 const credits=estimateRenderCredits(duration,input.resolution,policy?.renderingCreditsPerMinute?{approved:policy.renderPricingApproved===true,creditsPerMinute:policy.renderingCreditsPerMinute}:null);
 if(credits===null)throw new Error("Rendering pricing is not approved");
 const request:RenderRequest={projectId:project.id,userId:input.userId,sourceStoragePath:project.storage_path,duration,...dimensions,fps:30,codec:"h264",audio:"aac",segments,language:project.language,script:input.script,style,idempotencyKey:input.idempotencyKey,ass:generateAss(segments,style,dimensions.width,dimensions.height,duration)};
 await provider.validateRenderRequest(request);
 const {data:jobId,error}=await sb.rpc("reserve_render_job",{_user_id:input.userId,_project_id:project.id,_idempotency:input.idempotencyKey,_resolution:input.resolution,_configuration:request as never,_credits:credits,_provider:provider.id});
 if(error||!jobId)throw new Error("Could not reserve rendering credits");
 return {jobId};
}

export async function processRenderJob(jobId:string){
 const provider=getRenderingProvider();if(!provider)throw new Error("Rendering provider unavailable");
 const {supabaseAdmin:sb}=await import("@/integrations/supabase/client.server");
 const {data:job,error}=await sb.from("rendering_jobs").select("*").eq("id",jobId).maybeSingle();if(error||!job)throw new Error("Job unavailable");
 if(["completed","refunded","cancelled"].includes(job.status))return;
 const {data:claimed,error:claimError}=await sb.from("rendering_jobs").update({lease_expires_at:new Date(Date.now()+120000).toISOString()}).eq("id",jobId).or(`lease_expires_at.is.null,lease_expires_at.lt.${new Date().toISOString()}`).select("id").maybeSingle();if(claimError||!claimed)return;
 try{
  let providerId=job.provider_job_id;
  if(!providerId){const created=await provider.createRenderJob(job.render_configuration as unknown as RenderRequest);providerId=created.providerJobId;const {error:saveError}=await sb.from("rendering_jobs").update({provider_job_id:providerId,status:"processing",started_at:new Date().toISOString()}).eq("id",jobId);if(saveError)throw new Error("Provider job recording failed");}
  const status=await provider.getRenderJobStatus(providerId);
  if(status.status==="completed"){
   const asset=await provider.retrieveRenderedAsset(providerId);
   // Adapters must whitelist output hosts; never use an arbitrary caller-supplied URL.
   const url=new URL(asset.url);if(url.protocol!=="https:")throw new Error("Invalid output URL");
   const result=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!result.ok)throw new Error("Output retrieval failed");
   const path=`${job.user_id}/${job.id}/captions.mp4`;
   const {error:uploadError}=await sb.storage.from("rendered-videos").upload(path,await result.blob(),{contentType:"video/mp4",upsert:true});if(uploadError)throw new Error("Output upload failed");
   const {error:finishError}=await sb.rpc("finish_render_job",{_job_id:job.id,_success:true,_output_path:path,_error_code:""});if(finishError)throw new Error("Completion recording failed");
  }else if(status.status==="failed"||status.status==="cancelled"){
   const {error:refundError}=await sb.rpc("finish_render_job",{_job_id:job.id,_success:false,_output_path:"",_error_code:status.errorCode??"PROVIDER_FAILED"});if(refundError)throw new Error("Refund recording failed");
  }else{const {error:updateError}=await sb.from("rendering_jobs").update({progress_percentage:status.progress,status:status.status,updated_at:new Date().toISOString()}).eq("id",job.id);if(updateError)throw new Error("Status update failed");}
 }finally{await sb.from("rendering_jobs").update({lease_expires_at:null}).eq("id",jobId);}
}