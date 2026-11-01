import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireActiveAccount } from "./account-middleware";
export const downloadRenderOutput=createServerFn({method:"POST"}).middleware([requireActiveAccount]).inputValidator((input:{jobId:string})=>z.object({jobId:z.string().uuid()}).parse(input)).handler(async({data,context})=>{
 const {data:job,error}=await context.supabase.from("rendering_jobs").select("user_id,status,output_storage_path,output_expires_at,output_deleted_at").eq("id",data.jobId).eq("user_id",context.userId).maybeSingle();
 if(error||!job)throw new Error("Rendering job not found");
 if(job.status!=="completed"||job.output_deleted_at||!job.output_storage_path||!job.output_expires_at)throw new Error("MP4 download is unavailable");
 const remaining=Math.floor((Date.parse(job.output_expires_at)-Date.now())/1000);if(remaining<=0)throw new Error("The 24-hour download window has expired");
 const {data:signed,error:signError}=await context.supabase.storage.from("rendered-videos").createSignedUrl(job.output_storage_path,Math.min(60,remaining));if(signError||!signed)throw new Error("Could not prepare download");return {url:signed.signedUrl};
});