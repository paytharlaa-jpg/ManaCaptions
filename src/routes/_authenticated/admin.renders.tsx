import { createFileRoute } from "@tanstack/react-router";
import { RecordTable } from "@/components/admin/record-table";
import { pageMeta } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/admin/renders")({ head: () => pageMeta("Rendering jobs", "Owner-only rendering jobs for ManaCaptions."), component: Page });
function Page() { return <RecordTable section="renders" />; }
