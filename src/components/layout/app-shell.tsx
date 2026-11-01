import { Link, Outlet, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, LayoutDashboard, LogOut, Settings, Shield, Upload, User, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { walletQuery } from "@/lib/api/queries";
import { useIsAdmin } from "@/hooks/use-auth";

const NAV = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/billing", label: "Credits", icon: CreditCard },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const isAdmin = useIsAdmin(user.id);
  const { data: balance } = useQuery(walletQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Logo to="/dashboard" />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent text-foreground" }}
            >
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent text-foreground" }}
            >
              <Shield className="size-4" /> Admin
            </Link>
          )}
        </nav>
        <Link to="/billing" className="mb-3 flex items-center justify-between rounded-xl border border-border bg-card p-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="size-4 text-primary" /> Credits
          </span>
          <span className="font-bold">{balance ?? "–"}</span>
        </Link>
        <Button variant="ghost" className="justify-start" onClick={signOut}>
          <LogOut /> Sign out
        </Button>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border glass px-4 md:hidden">
        <Logo to="/dashboard" />
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link to="/admin" aria-label="Admin" className="rounded-md p-2 text-muted-foreground">
              <Shield className="size-4" />
            </Link>
          )}
          <Link to="/billing" className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm">
            <Wallet className="size-3.5 text-primary" /> {balance ?? "–"}
          </Link>
        </div>
      </header>

      <main className="min-w-0 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border glass pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <n.icon className="size-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
