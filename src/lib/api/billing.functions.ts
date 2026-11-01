import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireActiveAccount } from "@/lib/api/account-middleware";

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireActiveAccount])
  .inputValidator((input: { packageId: string }) => z.object({ packageId: z.string().max(40) }).parse(input))
  .handler(async ({ data, context }) => {
    const { getRazorpayKeys } = await import("@/lib/razorpay.server");
    const keys = getRazorpayKeys();
    if (!keys) return { ok: false as const, error: "Payments are not set up yet. Please try again soon." };

    const { data: pkg } = await context.supabase
      .from("credit_packages")
      .select("*")
      .eq("id", data.packageId)
      .eq("active", true)
      .maybeSingle();
    if (!pkg) return { ok: false as const, error: "This pack is not available." };

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${keys.keyId}:${keys.keySecret}`)}`,
      },
      body: JSON.stringify({
        amount: pkg.price_inr * 100,
        currency: "INR",
        receipt: `mc_${Date.now()}`,
        notes: { user_id: context.userId, package_id: pkg.id },
      }),
    });
    if (!res.ok) {
      console.error("razorpay order failed", res.status, await res.text());
      return { ok: false as const, error: "Could not start payment. Please try again." };
    }
    const order = (await res.json()) as { id: string; amount: number };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      package_id: pkg.id,
      razorpay_order_id: order.id,
      amount_inr: pkg.price_inr,
      credits: pkg.credits,
    });
    return {
      ok: true as const,
      orderId: order.id,
      amount: order.amount,
      keyId: keys.keyId,
      packName: pkg.name,
    };
  });

const verifySchema = z.object({
  orderId: z.string().min(1).max(100),
  paymentId: z.string().min(1).max(100),
  signature: z.string().min(1).max(200),
});

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireActiveAccount])
  .inputValidator((input: z.infer<typeof verifySchema>) => verifySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { getRazorpayKeys, hmacSha256Hex, timingSafeEqual, fulfillPayment } = await import(
      "@/lib/razorpay.server"
    );
    const keys = getRazorpayKeys();
    if (!keys) throw new Error("Payments are not set up");
    const expected = await hmacSha256Hex(keys.keySecret, `${data.orderId}|${data.paymentId}`);
    if (!timingSafeEqual(expected, data.signature)) throw new Error("Payment could not be verified");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ownedOrder, error: ownerError } = await context.supabase.from("payments").select("id").eq("razorpay_order_id", data.orderId).eq("user_id", context.userId).maybeSingle();
    if (ownerError || !ownedOrder) throw new Error("Payment mismatch");
    const payment = await fulfillPayment(supabaseAdmin, data.orderId, data.paymentId);
    if (payment.user_id !== context.userId) throw new Error("Payment mismatch");
    return { ok: true, credits: payment.credits };
  });
