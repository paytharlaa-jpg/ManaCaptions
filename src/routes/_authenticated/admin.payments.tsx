import { pageMeta } from "@/lib/metadata";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListPayments } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => pageMeta("Payments", "Owner-only verified Razorpay payment records and purchase history."),
  component: Payments,
});

function Payments() {
  const list = useServerFn(adminListPayments);
  const { data } = useQuery({ queryKey: ["admin", "payments"], queryFn: () => list() });
  if (!data) return <Skeleton className="h-64 rounded-2xl" />;
  if (!data.length) return <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No payments yet.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr className="border-b border-border"><th className="p-3">Order</th><th className="p-3">Pack</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">When</th></tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0">
              <td className="p-3 font-mono text-xs">{p.razorpay_order_id}<br /><span className="text-muted-foreground">{p.razorpay_payment_id}</span></td>
              <td className="p-3">{p.package_id} · {p.credits} cr</td>
              <td className="p-3">₹{p.amount_inr}</td>
              <td className="p-3"><Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>{p.status}</Badge></td>
              <td className="p-3 text-muted-foreground">{format(new Date(p.created_at), "d MMM, h:mm a")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
