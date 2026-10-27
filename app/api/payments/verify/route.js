import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { CREDIT_PACKAGES } from "@/config/pricing";
import { recordCreditPurchase, getOrCreateUser } from "@/lib/db";


function getAuthenticatedUser(request) {
  try {
    const cookie = request.cookies.get("tc_session")?.value;
    if (cookie) {
      const decoded = JSON.parse(Buffer.from(cookie, "base64").toString("utf8"));
      if (decoded && (decoded.id || decoded.email)) {
        return decoded;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export async function POST(request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to verify payment." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, paymentId, signature, packageId, isSandbox } = body;

    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json(
        { ok: false, error: "Invalid package specified." },
        { status: 400 }
      );
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    // 1. If real Razorpay keys are configured and this is a live order
    if (!isSandbox && razorpayKeySecret) {
      if (!orderId || !paymentId || !signature) {
        return NextResponse.json(
          { ok: false, error: "Missing Razorpay payment parameters." },
          { status: 400 }
        );
      }

      // Verify Razorpay HMAC signature: hmac_sha256(order_id + "|" + payment_id, secret)
      const expectedSignature = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json(
          { ok: false, error: "Payment verification failed: Invalid signature." },
          { status: 400 }
        );
      }
    }

    // 2. Ensure user exists in database
    const dbUser = getOrCreateUser(user);

    // 3. Provision credits atomically in SQLite
    const result = recordCreditPurchase({
      userId: dbUser?.id || user.id || user.email,
      amount: pkg.credits,
      packageId: pkg.id,
      orderId: orderId || `ord_${Date.now()}`,
      paymentId: paymentId || `pay_sim_${Date.now()}`,
      priceInr: pkg.priceInr
    });

    return NextResponse.json({
      ok: true,
      success: true,
      newBalance: result.newBalance,
      creditsAdded: pkg.credits,
      txId: result.txId,
      package: pkg,
      isSandbox: Boolean(isSandbox || !razorpayKeySecret),
      message: `Successfully credited ${pkg.credits} credits to your account!`
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to finalize credit purchase." },
      { status: 500 }
    );
  }
}
