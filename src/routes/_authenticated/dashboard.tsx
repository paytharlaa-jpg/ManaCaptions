import { pageMeta } from "@/lib/metadata";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { Clock, Film, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { projectsQuery, walletQuery } from "@/lib/api/queries";
import { formatClock } from "@/lib/captions/format";
import { DashboardAnnouncements } from "@/components/dashboard/announcements";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageMeta("Dashboard", "Your private ManaCaptions projects, announcements and caption credit balance."),
  component: Dashboard,
});

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Ready", variant: "default" },
  processing: { label: "Transcribing", variant: "secondary" },
  queued: { label: "Queued", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Failed · refunded", variant: "destructive" },
};

function Dashboard() {
  const { data: balance } = useQuery(walletQuery);
  const { data: projects, isLoading } = useQuery(projectsQuery);
  const qc = useQueryClient();

  async function onDelete(id: string) {
    if (!confirm("Delete this project and its video?")) return;
    try {
      const { data: p } = await supabase.from("projects").select("storage_path").eq("id", id).maybeSingle();
      if (p?.storage_path) {
        await supabase.storage.from("videos").remove([p.storage_path]);
      }
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      toast.success("Project deleted");
      void qc.invalidateQueries({ queryKey: ["projects"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete project");
    }
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      <PageHeader
        title="Your projects"
        subtitle="Upload a video to create Telugu captions."
        action={
          <Button asChild variant="hero">
            <Link to="/upload">
              <Plus /> New video
            </Link>
          </Button>
        }
      />

      <DashboardAnnouncements />
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="size-4 text-primary" /> Credit balance</p>
          <p className="mt-2 text-3xl font-extrabold">{balance ?? "–"} <span className="text-base font-medium text-muted-foreground">minutes</span></p>
          <Link to="/billing" className="mt-2 inline-block text-sm text-primary hover:underline">Buy more credits</Link>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Film className="size-4 text-primary" /> Projects</p>
          <p className="mt-2 text-3xl font-extrabold">{projects?.length ?? "–"}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : !projects?.length ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <Film className="mx-auto size-10 text-primary" />
          <h2 className="mt-4 text-lg font-semibold">No videos yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your first 10 minutes are free.</p>
          <Button asChild variant="hero" className="mt-6"><Link to="/upload">Upload your first video</Link></Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => {
            const job = p.transcription_jobs.at(-1);
            const ready = !!p.transcripts;
            const st = STATUS[ready ? "completed" : (job?.status ?? "queued")] ?? STATUS["queued"]!;
            return (
              <li key={p.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent"><Film className="size-5 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  {ready ? (
                    <Link to="/studio/$projectId" params={{ projectId: p.id }} className="block truncate font-medium hover:text-primary">{p.title}</Link>
                  ) : (
                    <p className="truncate font-medium">{p.title}</p>
                  )}
                  <p className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {formatClock(Number(p.duration_seconds ?? 0))}</span>
                    <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                  </p>
                </div>
                <Badge variant={st.variant}>{st.label}</Badge>
                <Button variant="ghost" size="icon" aria-label="Delete project" onClick={() => onDelete(p.id)}><Trash2 /></Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
