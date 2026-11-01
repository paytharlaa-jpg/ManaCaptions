import { createFileRoute } from "@tanstack/react-router";
import { CampaignManager } from "@/components/admin/campaign-manager";
import { pageMeta } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/admin/campaigns")({ head: () => pageMeta("Email campaigns", "Owner-only email campaigns for ManaCaptions."), component: Page });
function Page() { return <CampaignManager />; }
