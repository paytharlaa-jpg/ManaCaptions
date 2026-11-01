import { pageMeta } from "@/lib/metadata";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/api/queries";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => pageMeta("Profile", "Manage your ManaCaptions creator profile."),
  component: Profile,
});

function Profile() {
  const { data, isLoading } = useQuery(profileQuery);
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => setName(data?.display_name ?? ""), [data]);

  const valid = name.trim().length >= 1 && name.trim().length <= 60;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !valid) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", data.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save");
      return;
    }
    toast.success("Profile updated");
    void qc.invalidateQueries({ queryKey: ["profile"] });
  }

  if (isLoading || !data) return <Skeleton className="mx-auto h-64 max-w-xl rounded-2xl" />;

  return (
    <div className="mx-auto max-w-xl animate-fade-up">
      <PageHeader title="Profile" />
      <form onSubmit={save} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={data.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{(data.display_name ?? "U").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{data.display_name}</p>
            <p className="text-sm text-muted-foreground">{data.email}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          {!valid && <p className="text-xs text-destructive">Name must be 1–60 characters.</p>}
        </div>
        <Button type="submit" variant="hero" disabled={saving || !valid}>
          {saving && <Loader2 className="animate-spin" />} Save changes
        </Button>
      </form>
    </div>
  );
}
