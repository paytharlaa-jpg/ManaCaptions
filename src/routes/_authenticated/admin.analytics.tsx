import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsOverview } from "@/components/admin/analytics-overview";
import { pageMeta } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/admin/analytics")({ head: () => pageMeta("Analytics", "Owner-only analytics for ManaCaptions."), component: Page });
function Page() { return <AnalyticsOverview />; }
