import { createFileRoute } from "@tanstack/react-router";
import { RecordTable } from "@/components/admin/record-table";
import { pageMeta } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/admin/audit")({ head: () => pageMeta("Audit logs", "Owner-only audit logs for ManaCaptions."), component: Page });
function Page() { return <RecordTable section="audit" />; }
