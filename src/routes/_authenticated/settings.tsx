import { pageMeta } from "@/lib/metadata";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/api/queries";
import { MarketingPreference } from "@/components/settings/marketing-preference";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => pageMeta("Settings", "Manage caption preferences, optional marketing emails and your ManaCaptions session."),
  component: SettingsPage,
});

function SettingsPage() {
  const { data } = useQuery(profileQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function setScript(v: string) {
    if (!data) return;
    const { error } = await supabase.from("profiles").update({ preferred_script: v }).eq("id", data.id);
    if (error) {
      toast.error("Could not save");
      return;
    }
    toast.success("Preference saved");
    void qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-up space-y-6">
      <PageHeader title="Settings" />
      <MarketingPreference />
      <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-card">
        <Label>Default caption script</Label>
        <Select value={data?.preferred_script ?? "telugu"} onValueChange={setScript}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="telugu">Telugu script (తెలుగు)</SelectItem>
            <SelectItem value="roman">Romanized Telugu</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6">
        <div>
          <p className="font-medium">Sign out</p>
          <p className="text-sm text-muted-foreground">Sign out of this device.</p>
        </div>
        <Button variant="outline" onClick={signOut}><LogOut /> Sign out</Button>
      </div>
    </div>
  );
}
