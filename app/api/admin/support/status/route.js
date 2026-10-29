import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../data/route";
import { updateSupportInquiryStatus } from "@/lib/db";

export async function POST(request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized. Admin access required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { ok: false, error: "Inquiry ID and new status are required." },
        { status: 400 }
      );
    }

    const result = updateSupportInquiryStatus(id, status, adminNotes || "");
    return NextResponse.json({
      ok: true,
      result
    });
  } catch (err) {
    console.error("Update support status error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to update support status" },
      { status: 500 }
    );
  }
}

