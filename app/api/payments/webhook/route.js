import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { recordCreditPurchase } from "@/lib/db";
import { CREDIT_PACKAGES } from "@/config/pricing";

export async function POST(request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    const signature = request.headers.get("x-razorpay-signature");

    const rawBody = await request.text();

    // 1. Verify webhook signature if webhook secret is configured
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error("Razorpay webhook signature mismatch!");
        return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);

    // 2. Handle payment captured or order paid events
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const order = event.payload?.order?.entity;

      const orderId = payment?.order_id || order?.id;
      const paymentId = payment?.id;
      const notes = payment?.notes || order?.notes || {};

      const packageId = notes.packageId;
      const userId = notes.userId || notes.userEmail;

      if (userId && packageId) {
        const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
        const credits = pkg ? pkg.credits : parseInt(notes.credits, 10) || 30;
        const priceInr = pkg ? pkg.priceInr : (payment?.amount ? payment.amount / 100 : 0);

        try {
          // Record purchase with duplicate transaction replay protection
          recordCreditPurchase({
            userId,
            amount: credits,
            packageId,
            orderId,
            paymentId,
            priceInr
          });
          console.log(`[Razorpay Webhook] Successfully credited ${credits} to user ${userId} for order ${orderId}`);
        } catch (dbErr) {
          console.error("[Razorpay Webhook] Error recording credit purchase:", dbErr.message);
        }
      }
    }

    return NextResponse.json({ ok: true, received: true });
  } catch (err) {
    console.error("[Razorpay Webhook] Handler error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
