import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { controlData,saveProductSettings } from "@/lib/api/control-center.functions";
import { DEFAULT_PRODUCT_SETTINGS,productSettingsSchema } from "@/lib/admin/settings-schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function ProductSettings() {
 const fetch=useServerFn(controlData),save=useServerFn(saveProductSettings),qc=useQueryClient();const {data,error}=useQuery({queryKey:["control","settings"],queryFn:()=>fetch({data:{section:"settings"}})});
 const [settings,setSettings]=useState(DEFAULT_PRODUCT_SETTINGS),[reason,setReason]=useState(""),[saving,setSaving]=useState(false);
 useEffect(()=>{const parsed=productSettingsSchema.safeParse(data?.settings);if(parsed.success)setSettings(parsed.data);},[data]);
 async function submit(){if(!data||!reason.trim())return;setSaving(true);try{await save({data:{settings,version:data.version,reason}});toast.success("Settings saved");setReason("");void qc.invalidateQueries({queryKey:["control","settings"]});}catch(e){toast.error(e instanceof Error?e.message:"Could not save settings");}finally{setSaving(false);}}
 return <div className="max-w-xl space-y-5">{error&&<p role="alert" className="text-destructive">Could not load settings.</p>}<div><Label htmlFor="max-duration">Maximum video duration (seconds)</Label><Input id="max-duration" type="number" min={1} max={300} value={settings.maxVideoSeconds} onChange={(e)=>setSettings({...settings,maxVideoSeconds:Number(e.target.value)})} /></div><div><Label htmlFor="transcription-rate">Transcription credits per started minute</Label><Input id="transcription-rate" type="number" min={1} max={100} value={settings.transcriptionCreditsPerMinute} onChange={(e)=>setSettings({...settings,transcriptionCreditsPerMinute:Number(e.target.value)})} /></div><dl className="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm"><dt className="text-muted-foreground">Free / paid resolution</dt><dd>1080p / 4K</dd><dt className="text-muted-foreground">Source retention</dt><dd>72 hours</dd><dt className="text-muted-foreground">MP4 retention</dt><dd>24 hours</dd><dt className="text-muted-foreground">Rendering provider</dt><dd>Not configured</dd><dt className="text-muted-foreground">Rendering price</dt><dd>Not approved</dd><dt className="text-muted-foreground">Email provider</dt><dd>Not configured</dd></dl><div><Label htmlFor="settings-reason">Reason for change</Label><Input id="settings-reason" value={reason} maxLength={200} onChange={(e)=>setReason(e.target.value)} /></div><Button disabled={!data||saving||!reason.trim()||!productSettingsSchema.safeParse(settings).success} onClick={submit}>{saving?"Saving…":"Save settings"}</Button></div>;
}