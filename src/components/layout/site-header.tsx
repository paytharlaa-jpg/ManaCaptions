import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/pricing", label: "Pricing" },
  { to: "/help", label: "Help" },
] as const;

export function SiteHeader() {
  const { user, loading } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-3">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
          {!loading &&
            (user ? (
              <Button asChild variant="hero" size="sm">
                <Link to="/dashboard">Open app</Link>
              </Button>
            ) : (
              <Button asChild variant="hero" size="sm">
                <Link to="/auth">Start free</Link>
              </Button>
            ))}
        </nav>
      </div>
    </header>
  );
}
