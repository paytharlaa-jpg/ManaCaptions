import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsOverview } from "@/components/admin/analytics-overview";
import { pageMeta } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/admin/")({ head: () => pageMeta("Admin overview", "Real customer, revenue, credit and job activity for ManaCaptions."), component: AnalyticsOverview });
