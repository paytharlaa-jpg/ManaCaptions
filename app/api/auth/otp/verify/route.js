import { NextResponse } from "next/server";
import { verifyEmailOtp, getOrCreateUser, claimGuestProjects } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();
    const otp = body?.otp?.trim();
    const providedName = body?.name?.trim();

    if (!email || !otp) {
      return NextResponse.json(
        { ok: false, error: "Email and 6-digit code are required." },
        { status: 400 }
      );
    }

    // 1. Verify OTP in SQLite database
    const verifyResult = verifyEmailOtp(email, otp);
    if (!verifyResult.success) {
      return NextResponse.json(
        { ok: false, error: verifyResult.error },
        { status: 400 }
      );
    }

    // 2. Format name and avatar
    const namePart = email.split("@")[0].replace(/[._]/g, " ");
    const formattedName = providedName || (namePart.charAt(0).toUpperCase() + namePart.slice(1));
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}&backgroundColor=f97316`;

    // 3. Create or retrieve user record in SQLite (Guarantees 10 signup credits for new users)
    const dbUser = getOrCreateUser({
      name: formattedName,
      email: email,
      avatar: avatar,
      provider: "email",
      plan: "free"
    });

    // 4. Claim any guest projects created during anonymous trial
    const guestCookie = request.cookies.get("tc_guest");
    if (guestCookie?.value && dbUser?.id) {
      try {
        claimGuestProjects(guestCookie.value, dbUser.id);
      } catch (claimErr) {
        console.warn("Guest project claim notice during OTP verify:", claimErr.message);
      }
    }

    // 5. Construct session user object
    const sessionUser = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      avatar: dbUser.avatar,
      provider: dbUser.provider,
      plan: dbUser.plan,
      credits_balance: dbUser.credits_balance,
      created_at: dbUser.created_at
    };

    // 6. Set 30-day session cookie
    const response = NextResponse.json({
      ok: true,
      user: sessionUser,
      message: "Email verified successfully!"
    });

    response.cookies.set({
      name: "tc_session",
      value: Buffer.from(JSON.stringify(sessionUser)).toString("base64"),
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      httpOnly: false
    });

    return response;
  } catch (err) {
    console.error("Error in /api/auth/otp/verify:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to verify code." },
      { status: 500 }
    );
  }
}
