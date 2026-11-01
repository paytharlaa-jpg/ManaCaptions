import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PackageInfo {
  id: string;
  name: string;
  credits: number;
  price_inr: number;
  tagline: string | null;
  highlighted: boolean;
}

export function PackageCard({ pkg, action }: { pkg: PackageInfo; action: ReactNode }) {
  const perMin = (pkg.price_inr / pkg.credits).toFixed(1);
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 shadow-card",
        pkg.highlighted ? "border-primary shadow-glow" : "border-border",
      )}
    >
      {pkg.highlighted && (
        <span className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
          Most popular
        </span>
      )}
      <h3 className="text-lg font-semibold">{pkg.name}</h3>
      <p className="text-sm text-muted-foreground">{pkg.tagline}</p>
      <p className="mt-5 text-4xl font-extrabold">
        ₹{pkg.price_inr.toLocaleString("en-IN")}
      </p>
      <ul className="mt-5 space-y-2 text-sm">
        {[`${pkg.credits} minutes of transcription`, `₹${perMin} per minute`, "SRT, VTT and TXT export", "Credits never expire"].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check className="size-4 text-primary" /> {f}
          </li>
        ))}
      </ul>
      <div className="mt-6">{action}</div>
    </div>
  );
}
