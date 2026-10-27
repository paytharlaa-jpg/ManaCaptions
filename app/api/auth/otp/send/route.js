import { NextResponse } from "next/server";
import { createEmailOtp } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Generate and store OTP in database
    let otpRecord;
    try {
      otpRecord = createEmailOtp(email);
    } catch (rateErr) {
      return NextResponse.json(
        { ok: false, error: rateErr.message },
        { status: 429 }
      );
    }

    const { otp, cleanEmail } = otpRecord;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey && resendApiKey.trim()) {
      try {
        const fromEmail = process.env.EMAIL_FROM || "ManaCaptions <onboarding@resend.dev>";
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey.trim()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [cleanEmail],
            subject: `${otp} is your ManaCaptions verification code`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #f5f5f5; margin: 0; padding: 40px 20px; }
                  .container { max-width: 480px; margin: 0 auto; background: #141414; border: 1px solid #262626; border-radius: 20px; padding: 36px 28px; text-align: center; }
                  .badge { display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(249, 115, 22, 0.15); color: #f97316; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 20px; border: 1px solid rgba(249, 115, 22, 0.3); }
                  h1 { font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 10px; }
                  p { color: #a3a3a3; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
                  .otp-box { background: #1a1a1a; border: 2px solid #f97316; border-radius: 16px; padding: 18px 24px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin: 24px 0; font-family: monospace; }
                  .footer { font-size: 12px; color: #737373; margin-top: 28px; border-top: 1px solid #262626; padding-top: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="badge">ManaCaptions Security</div>
                  <h1>Verify Your Email</h1>
                  <p>Welcome to ManaCaptions! Use the 6-digit verification code below to complete your login and claim your <strong>10 free credits</strong>.</p>
                  <div class="otp-box">${otp}</div>
                  <p style="font-size: 13px; color: #737373;">This code is valid for 10 minutes. If you did not request this code, you can safely ignore this email.</p>
                  <div class="footer">
                    &copy; ${new Date().getFullYear()} ManaCaptions Studio. AI-Powered Telugu Reels & Captions.
                  </div>
                </div>
              </body>
              </html>
            `
          })
        });

        if (!resendRes.ok) {
          const errBody = await resendRes.text();
          console.error("Resend API delivery error:", errBody);
          let resendNotice = "Resend Sandbox Mode: Resend only delivers emails to your registered account (hello.trygaruda@gmail.com). To send to any email address, verify your domain in Resend.";
          try {
            const parsed = JSON.parse(errBody);
            if (parsed?.message) resendNotice = parsed.message;
          } catch (e) {}

          // Fallback to dev OTP so user can continue testing
          return NextResponse.json({
            ok: true,
            message: "Code generated (Resend sandbox fallback)",
            devMode: true,
            devOtp: otp,
            resendNotice
          });
        }

        return NextResponse.json({
          ok: true,
          message: `Verification code sent to ${cleanEmail}`
        });
      } catch (sendErr) {
        console.error("Failed to deliver email via Resend:", sendErr);
        return NextResponse.json({
          ok: true,
          message: "Verification code generated (Dev fallback)",
          devMode: true,
          devOtp: otp
        });
      }
    } else {
      // Development mode: Resend API key not configured yet
      console.log("=================================================");
      console.log(`[ManaCaptions Dev OTP] Code for ${cleanEmail}: ${otp}`);
      console.log("=================================================");

      return NextResponse.json({
        ok: true,
        message: `Verification code sent to ${cleanEmail}`,
        devMode: true,
        devOtp: otp
      });
    }
  } catch (err) {
    console.error("Error in /api/auth/otp/send:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to send verification code." },
      { status: 500 }
    );
  }
}
