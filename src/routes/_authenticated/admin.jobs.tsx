import { pageMeta } from "@/lib/metadata";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { adminListJobs, adminRefundJob } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/jobs")({
  head: () => pageMeta("Transcription jobs", "Owner-only transcription status and eligible failed-job credit refunds."),
  component: Jobs,
});

function Jobs() {
  const [onlyFailed, setOnlyFailed] = useState(false);
  const list = useServerFn(adminListJobs);
  const refund = useServerFn(adminRefundJob);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "jobs", onlyFailed], queryFn: () => list({ data: { onlyFailed } }) });

  async function onRefund(id: string) {
    try {
      await refund({ data: { jobId: id } });
      toast.success("Refunded");
      void qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Switch id="failed" checked={onlyFailed} onCheckedChange={setOnlyFailed} />
        <Label htmlFor="failed">Only failed jobs</Label>
      </div>
      {!data ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : !data.length ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No jobs yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-border"><th className="p-3">Project</th><th className="p-3">Status</th><th className="p-3">Credits</th><th className="p-3">When</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {data.map((j) => (
                <tr key={j.id} className="border-b border-border last:border-0 align-top">
                  <td className="p-3">
                    <p className="font-medium">{(j.projects as { title: string } | null)?.title ?? "—"}</p>
                    {j.error && <p className="text-xs text-destructive">{j.error}</p>}
                  </td>
                  <td className="p-3"><Badge variant={j.status === "completed" ? "default" : j.status === "processing" ? "secondary" : "destructive"}>{j.status}</Badge></td>
                  <td className="p-3">{j.credits_reserved}</td>
                  <td className="p-3 text-muted-foreground">{format(new Date(j.created_at), "d MMM, h:mm a")}</td>
                  <td className="p-3 text-right">
                    {j.status === "failed" && j.credits_reserved > 0 && (
                      <Button size="sm" variant="outline" onClick={() => onRefund(j.id)}>Refund</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
