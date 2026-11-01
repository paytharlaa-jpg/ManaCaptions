import { pageMeta } from "@/lib/metadata";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("is_app_owner", { _user_id: context.user.id });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => pageMeta("Admin Control Center", "Owner-only customer, credit, payment and product administration."),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/users", label: "Users & credits" },
  { to: "/admin/jobs", label: "Jobs" },
  { to: "/admin/payments", label: "Payments" },
  { to: "/admin/packages", label: "Packages" },
  { to: "/admin/ledger", label: "Ledger" },
  { to: "/admin/renders", label: "Rendering" },
  { to: "/admin/campaigns", label: "Campaigns" },
  { to: "/admin/announcements", label: "Announcements" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/settings", label: "Product settings" },
  { to: "/admin/audit", label: "Audit logs" },
] as const;

function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <h1 className="text-2xl font-bold sm:text-3xl">Admin</h1>
      <div className="mt-4 grid min-w-0 gap-6 xl:grid-cols-[150px_minmax(0,1fr)]"><nav className="flex gap-1 overflow-x-auto border-b border-border xl:flex-col xl:self-start xl:border-b-0 xl:border-r xl:pr-3">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: "exact" in t }}
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground xl:rounded-md xl:border-b-0"
            activeProps={{ className: "border-primary text-foreground" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
