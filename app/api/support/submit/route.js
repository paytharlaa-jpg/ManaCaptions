import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/authServer";
import { createSupportInquiry } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, category, subject, message } = body;

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
    }
    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
    }
    if (!message?.trim()) {
      return NextResponse.json({ ok: false, error: "Please enter your message or question." }, { status: 400 });
    }

    const { user } = getAuthenticatedUser(request);
    const userId = user?.id || null;

    const result = createSupportInquiry({
      userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || "").trim(),
      category: category || "general",
      subject: (subject || "General Inquiry").trim(),
      message: message.trim()
    });

    return NextResponse.json({
      ok: true,
      message: "Thank you! Your enquiry has been received. Our team will get back to you shortly.",
      inquiryId: result.id
    });
  } catch (err) {
    console.error("Support submission error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to submit enquiry. Please try again." },
      { status: 500 }
    );
  }
}
