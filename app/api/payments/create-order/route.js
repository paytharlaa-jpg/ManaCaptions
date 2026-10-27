import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { CREDIT_PACKAGES } from "@/config/pricing";


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
    // ignore cookie parse error
  }
  return null;
}

export async function POST(request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to purchase credits." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packageId } = body;

    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json(
        { ok: false, error: "Invalid credit package selected." },
        { status: 400 }
      );
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim();
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    // 1. Live/Test Razorpay Order Creation if keys are configured
    if (razorpayKeyId && razorpayKeySecret) {
      try {
        const authHeader = "Basic " + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");
        const receipt = `rcpt_${user.id.slice(-6)}_${Date.now()}`;

        const res = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            amount: pkg.priceInr * 100, // paise
            currency: "INR",
            receipt,
            notes: {
              packageId: pkg.id,
              userId: user.id,
              userEmail: user.email,
              credits: pkg.credits
            }
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("Razorpay order creation error:", errData);
          throw new Error(errData?.error?.description || "Failed to create Razorpay order");
        }

        const order = await res.json();
        return NextResponse.json({
          ok: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: razorpayKeyId,
          package: pkg,
          isSandbox: false
        });
      } catch (err) {
        console.error("Razorpay API request failed:", err);
        // Fallback to sandbox if API fails so testing creator experience is uninterrupted
        return NextResponse.json({
          ok: true,
          orderId: `ord_sim_${crypto.randomBytes(8).toString("hex")}`,
          amount: pkg.priceInr * 100,
          currency: "INR",
          keyId: null,
          package: pkg,
          isSandbox: true,
          notice: "Razorpay keys encountered an error. Switched to test sandbox mode."
        });
      }
    }

    // 2. Clean Sandbox Mode (when user hasn't added Razorpay API keys yet)
    const sandboxOrderId = `ord_sim_${crypto.randomBytes(8).toString("hex")}`;
    return NextResponse.json({
      ok: true,
      orderId: sandboxOrderId,
      amount: pkg.priceInr * 100,
      currency: "INR",
      keyId: null,
      package: pkg,
      isSandbox: true,
      notice: "Razorpay keys not configured in .env.local. Test Sandbox mode active."
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to initialize order." },
      { status: 500 }
    );
  }
}
