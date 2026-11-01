import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });

        const raw = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const { hmacSha256Hex, timingSafeEqual, fulfillPayment } = await import("@/lib/razorpay.server");
        const expected = await hmacSha256Hex(secret, raw);
        if (!timingSafeEqual(expected, signature)) return new Response("Invalid signature", { status: 401 });

        let event: {
          event?: string;
          payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
        };
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const entity = event.payload?.payment?.entity;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (event.event === "payment.captured" && entity?.id && entity.order_id) {
          try {
            await fulfillPayment(supabaseAdmin, entity.order_id, entity.id);
          } catch (err) {
            console.error("webhook fulfill failed", err);
            return new Response("Retry", { status: 500 });
          }
        } else if (event.event === "payment.failed" && entity?.order_id) {
          await supabaseAdmin
            .from("payments")
            .update({ status: "failed" })
            .eq("razorpay_order_id", entity.order_id)
            .neq("status", "paid");
        }
        return Response.json({ ok: true });
      },
    },
  },
});
