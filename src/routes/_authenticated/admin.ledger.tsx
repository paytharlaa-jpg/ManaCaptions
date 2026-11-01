import { createFileRoute } from "@tanstack/react-router";
import { RecordTable } from "@/components/admin/record-table";
import { pageMeta } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/admin/ledger")({ head: () => pageMeta("Credit ledger", "Owner-only credit ledger for ManaCaptions."), component: Page });
function Page() { return <RecordTable section="ledger" />; }
