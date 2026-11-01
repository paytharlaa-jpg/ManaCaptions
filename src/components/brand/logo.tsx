import { Link } from "@tanstack/react-router";
import { Captions } from "lucide-react";

export function Logo({ to = "/" }: { to?: "/" | "/dashboard" }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
        <Captions className="size-4.5" />
      </span>
      <span>
        Mana<span className="text-gradient">Captions</span>
      </span>
    </Link>
  );
}
