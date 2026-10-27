import { NextResponse } from "next/server";
import { checkAdminAuth } from "../data/route";
import { getAllUsers } from "@/lib/db";

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
    const { subject, message, testEmailOnly } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Subject and message are required." },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || "ManaCaptions <onboarding@resend.dev>";

    // Determine target recipient list
    let targetEmails = [];
    if (testEmailOnly?.trim()) {
      targetEmails = [testEmailOnly.trim().toLowerCase()];
    } else {
      const allUsers = getAllUsers();
      targetEmails = [...new Set(allUsers.map(u => u.email).filter(Boolean))];
    }

    if (targetEmails.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No recipients found to send." },
        { status: 400 }
      );
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    const formattedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #f5f5f5; margin: 0; padding: 40px 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #141414; border: 1px solid #262626; border-radius: 20px; padding: 36px 30px; }
          .badge { display: inline-block; padding: 5px 12px; border-radius: 999px; background: rgba(249, 115, 22, 0.15); color: #f97316; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 20px; border: 1px solid rgba(249, 115, 22, 0.3); }
          h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 16px; line-height: 1.3; }
          .content { color: #d4d4d4; font-size: 14px; line-height: 1.7; white-space: pre-line; margin-bottom: 30px; }
          .cta-btn { display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff !important; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 12px; text-decoration: none; margin-top: 10px; }
          .footer { font-size: 12px; color: #737373; margin-top: 32px; border-top: 1px solid #262626; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">ManaCaptions Announcement</div>
          <h1>${escapeHtml(subject)}</h1>
          <div class="content">${escapeHtml(message)}</div>
          <a href="http://localhost:3000/studio" class="cta-btn">Open ManaCaptions Studio &rarr;</a>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ManaCaptions Studio &bull; AI-Powered Telugu Reels &amp; Captions
          </div>
        </div>
      </body>
      </html>
    `;

    // Process each recipient
    for (const email of targetEmails) {
      if (resendApiKey && resendApiKey.trim()) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey.trim()}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [email],
              subject: subject.trim(),
              html: formattedHtml
            })
          });

          if (res.ok) {
            sentCount++;
          } else {
            const errText = await res.text();
            failedCount++;
            errors.push(`${email}: ${errText}`);
          }
        } catch (e) {
          failedCount++;
          errors.push(`${email}: ${e.message}`);
        }
      } else {
        // Dev Mode Simulation
        console.log(`[Admin Dev Broadcast] To: ${email} | Subject: ${subject}`);
        sentCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Broadcast completed. Sent to ${sentCount} recipient(s).`,
      sentCount,
      failedCount,
      totalRecipients: targetEmails.length,
      errors: errors.slice(0, 5)
    });
  } catch (err) {
    console.error("Broadcast sending error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to send broadcast" },
      { status: 500 }
    );
  }
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
