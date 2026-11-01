import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireActiveAccount } from "./account-middleware";
export const setMarketingConsent=createServerFn({method:"POST"}).middleware([requireActiveAccount]).inputValidator((input:{consent:boolean})=>z.object({consent:z.boolean()}).parse(input)).handler(async({data,context})=>{
 const {supabaseAdmin:sb}=await import("@/integrations/supabase/client.server");
 const {error}=await sb.rpc("set_marketing_consent",{_user_id:context.userId,_consent:data.consent});if(error)throw new Error("Could not save email preference");return {ok:true};
});