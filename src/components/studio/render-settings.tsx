import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Lock, Film } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { renderAvailability } from "@/lib/api/rendering.functions";
import type { Resolution } from "@/lib/rendering/render-validation";
export function RenderSettings({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const fn = useServerFn(renderAvailability);
  const { data, error } = useQuery({ queryKey: ["render", projectId], queryFn: () => fn({ data: { projectId } }), enabled: open, refetchInterval: (q) => q.state.data?.jobs?.some((j) => j.status === "queued" || j.status === "processing") ? 5000 : false });
  const [resolution, setResolution] = useState<Resolution>("1080p");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Export MP4</DialogTitle></DialogHeader><div className="grid grid-cols-3 gap-2">{(["720p", "1080p", "4k"] as const).map((r) => <Button variant="outline" key={r} disabled={!data || (r === "4k" && !data.paid)} aria-pressed={resolution === r} onClick={() => setResolution(r)} className={resolution === r ? "border-primary bg-accent" : ""}>{r === "4k" && !data?.paid && <Lock />} {r === "4k" ? "4K" : r}</Button>)}</div>{error ? <p className="text-sm text-destructive">Could not load export information.</p> : !data ? <p className="text-sm text-muted-foreground">Loading export options…</p> : <><p className="text-sm text-muted-foreground">{data.paid ? "Paid package · 4K unlocked" : "Free trial · up to 1080p"}</p><p className="text-sm">MP4 rendering is awaiting provider configuration and approved pricing. No credits will be charged.</p><p className="text-xs text-muted-foreground">Completed MP4 downloads will remain available for 24 hours.</p><Button disabled className="w-full"><Film /> Rendering unavailable</Button>{data.jobs?.map((j) => <div key={j.id} className="border-t border-border py-2 text-sm">{j.requested_resolution} · {j.status}{j.progress_percentage !== null ? ` · ${j.progress_percentage}%` : ""}</div>)}</>}</DialogContent></Dialog>;
}