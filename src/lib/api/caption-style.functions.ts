import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireActiveAccount } from "./account-middleware";
import { captionStyleSchema } from "@/lib/captions/style-schema";
export const saveCaptionStyle=createServerFn({method:"POST"}).middleware([requireActiveAccount]).inputValidator((input:{projectId:string;style:z.infer<typeof captionStyleSchema>})=>z.object({projectId:z.string().uuid(),style:captionStyleSchema}).parse(input)).handler(async({data,context})=>{
 const {data:row,error}=await context.supabase.from("projects").update({caption_style:data.style as never,style_preset:data.style.presetId}).eq("id",data.projectId).eq("user_id",context.userId).select("id").maybeSingle();if(error||!row)throw new Error("Could not save caption style");return {ok:true};
});