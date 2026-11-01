import { createFileRoute } from "@tanstack/react-router";
export const Route=createFileRoute("/api/public/unsubscribe")({server:{handlers:{POST:async({request})=>{
 const token=new URL(request.url).searchParams.get("token");if(!token||! /^[a-f0-9]{64}$/i.test(token))return Response.json({error:"Invalid unsubscribe link"},{status:400});
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));const hash=[...new Uint8Array(bytes)].map((b)=>b.toString(16).padStart(2,"0")).join("");
 const {supabaseAdmin:sb}=await import("@/integrations/supabase/client.server");const {data,error}=await sb.rpc("consume_unsubscribe_token",{_hash:hash});if(error||!data)return Response.json({error:"Unsubscribe link expired or unavailable"},{status:400});return Response.json({success:true},{headers:{"Cache-Control":"no-store"}});
}}}});