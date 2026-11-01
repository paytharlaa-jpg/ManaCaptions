import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted-foreground">Telugu captions, made simple.</p>
        </div>
        <nav className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/help" className="hover:text-foreground">Help Center</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
