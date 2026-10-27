import { NextResponse } from "next/server";
import { checkAdminAuth } from "../data/route";
import { adminAdjustCredits } from "@/lib/db";

export async function POST(request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { userId, amount, reason } = body;

    if (!userId || amount === undefined || isNaN(Number(amount))) {
      return NextResponse.json(
        { ok: false, error: "Valid userId and numerical amount are required." },
        { status: 400 }
      );
    }

    const numAmount = parseInt(amount, 10);
    const result = adminAdjustCredits(userId, numAmount, reason || "admin_manual_grant");

    return NextResponse.json({
      ok: true,
      message: `Successfully adjusted credits by ${numAmount > 0 ? "+" : ""}${numAmount}`,
      newBalance: result.newBalance,
      txId: result.txId
    });
  } catch (err) {
    console.error("Admin adjust credits error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to adjust credits" },
      { status: 500 }
    );
  }
}
