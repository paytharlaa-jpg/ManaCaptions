import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { controlData } from "@/lib/api/control-center.functions";
import { Skeleton } from "@/components/ui/skeleton";
type Section = "audit" | "renders" | "campaigns" | "announcements" | "ledger" | "packages";
const COLUMNS: Record<Section,string[]> = { audit:["created_at","action","actor_id","target","reason"], renders:["created_at","project_id","status","requested_resolution","credits_reserved","progress_percentage","error_code"], campaigns:["created_at","subject","audience","status"],announcements:["title","audience","important","status","published_at","expires_at"],ledger:["created_at","user_id","kind","amount","balance_after","note"],packages:["name","credits","price_inr","active","highlighted","sort"] };
export function RecordTable({section}:{section:Section}) {
 const fn=useServerFn(controlData);const {data,error}=useQuery({queryKey:["control",section],queryFn:()=>fn({data:{section}})});
 if(error) return <p role="alert" className="text-sm text-destructive">Could not load records.</p>;
 if(!data) return <Skeleton className="h-40" />;
 if(!data.rows.length) return <p className="py-8 text-sm text-muted-foreground">No records yet.</p>;
 return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border">{COLUMNS[section].map((c)=><th key={c} className="whitespace-nowrap p-3 font-medium text-muted-foreground">{c.replace(/_/g," ")}</th>)}</tr></thead><tbody>{data.rows.map((r,i)=><tr key={String(r['id']??i)} className="border-b border-border">{COLUMNS[section].map((c)=><td key={c} className="max-w-64 break-words p-3">{r[c]===null||r[c]===undefined?"—":typeof r[c]==="boolean"?(r[c]?"Yes":"No"):String(r[c])}</td>)}</tr>)}</tbody></table>{data.rows.length===200&&<p className="py-2 text-xs text-muted-foreground">Showing the latest 200 records.</p>}</div>;
}