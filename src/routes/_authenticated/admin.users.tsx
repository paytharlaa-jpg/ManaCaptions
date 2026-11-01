import { createFileRoute } from "@tanstack/react-router";
import { UserManager } from "@/components/admin/user-manager";
import { pageMeta } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/admin/users")({ head: () => pageMeta("User management", "Owner-only account status, credit adjustments and customer usage."), component: UserManager });
