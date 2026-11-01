import { pageMeta } from "@/lib/metadata";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PackageCard } from "@/components/billing/package-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { packagesQuery } from "@/lib/api/packages";
import { ledgerQuery, walletQuery } from "@/lib/api/queries";
import { createOrder, verifyPayment } from "@/lib/api/billing.functions";
import { openCheckout } from "@/lib/razorpay-checkout";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => pageMeta("Credits & billing", "Manage prepaid caption credits and verified payment history."),
  component: Billing,
});

const KIND_LABEL: Record<string, string> = {
  signup_bonus: "Welcome bonus",
  purchase: "Purchase",
  reserve: "Transcription",
  refund: "Refund",
  admin_adjust: "Adjustment",
};

function Billing() {
  const { user } = Route.useRouteContext();
  const { data: balance } = useQuery(walletQuery);
  const { data: packages, isLoading } = useQuery(packagesQuery);
  const { data: ledger } = useQuery(ledgerQuery);
  const qc = useQueryClient();
  const order = useServerFn(createOrder);
  const verify = useServerFn(verifyPayment);
  const [buying, setBuying] = useState<string | null>(null);

  async function buy(packageId: string) {
    setBuying(packageId);
    try {
      const o = await order({ data: { packageId } });
      if (!o.ok) {
        toast.error(o.error);
        return;
      }
      const r = await openCheckout({ keyId: o.keyId, orderId: o.orderId, amount: o.amount, description: `${o.packName} credits`, ...(user.email ? { email: user.email } : {}) });
      if (!r) return;
      const v = await verify({ data: { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature } });
      toast.success(`${v.credits} credits added!`);
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["ledger"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      <PageHeader title="Credits" subtitle="1 credit = 1 minute of video transcription." />
      <div className="mb-10 flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <span className="grid size-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground"><Wallet /></span>
        <div>
          <p className="text-sm text-muted-foreground">Current balance</p>
          <p className="text-3xl font-extrabold">{balance ?? "–"} credits</p>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Buy credits</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
        {packages?.map((p) => (
          <PackageCard
            key={p.id}
            pkg={p}
            action={
              <Button variant={p.highlighted ? "hero" : "outline"} className="w-full" disabled={!!buying} onClick={() => buy(p.id)}>
                {buying === p.id && <Loader2 className="animate-spin" />} Pay ₹{p.price_inr}
              </Button>
            }
          />
        ))}
      </div>

      <h2 className="mb-4 mt-12 text-lg font-semibold">Transaction history</h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {!ledger?.length ? (
          <p className="p-6 text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {ledger.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{KIND_LABEL[l.kind] ?? l.kind}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.note} · {format(new Date(l.created_at), "d MMM yyyy, h:mm a")}</p>
                </div>
                <div className="text-right">
                  <p className={cn("font-semibold", l.amount > 0 ? "text-success" : "text-foreground")}>{l.amount > 0 ? "+" : ""}{l.amount}</p>
                  <p className="text-xs text-muted-foreground">Bal {l.balance_after}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
