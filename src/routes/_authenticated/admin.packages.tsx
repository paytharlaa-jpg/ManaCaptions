import { createFileRoute } from "@tanstack/react-router";
import { PackageManager } from "@/components/admin/package-manager";
import { pageMeta } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/admin/packages")({ head: () => pageMeta("Credit packages", "Owner-only credit packages for ManaCaptions."), component: Page });
function Page() { return <PackageManager />; }
