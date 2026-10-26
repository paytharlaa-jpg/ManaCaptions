import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request) {
  try {
    const { clientId, clientSecret } = await request.json();

    if (!clientId || !clientId.trim()) {
      return NextResponse.json({ ok: false, error: "Client ID is required" }, { status: 400 });
    }

    const envPath = path.join(process.cwd(), ".env.local");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    // Update or append GOOGLE_CLIENT_ID
    if (/^GOOGLE_CLIENT_ID=.*$/m.test(content)) {
      content = content.replace(/^GOOGLE_CLIENT_ID=.*$/m, `GOOGLE_CLIENT_ID=${clientId.trim()}`);
    } else {
      content += `\nGOOGLE_CLIENT_ID=${clientId.trim()}`;
    }

    // Update or append NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (/^NEXT_PUBLIC_GOOGLE_CLIENT_ID=.*$/m.test(content)) {
      content = content.replace(/^NEXT_PUBLIC_GOOGLE_CLIENT_ID=.*$/m, `NEXT_PUBLIC_GOOGLE_CLIENT_ID=${clientId.trim()}`);
    } else {
      content += `\nNEXT_PUBLIC_GOOGLE_CLIENT_ID=${clientId.trim()}`;
    }

    // Update or append GOOGLE_CLIENT_SECRET
    if (clientSecret && clientSecret.trim()) {
      if (/^GOOGLE_CLIENT_SECRET=.*$/m.test(content)) {
        content = content.replace(/^GOOGLE_CLIENT_SECRET=.*$/m, `GOOGLE_CLIENT_SECRET=${clientSecret.trim()}`);
      } else {
        content += `\nGOOGLE_CLIENT_SECRET=${clientSecret.trim()}`;
      }
    }

    fs.writeFileSync(envPath, content, "utf-8");

    // Also update runtime process.env
    Object.assign(process.env, {
      GOOGLE_CLIENT_ID: clientId.trim(),
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: clientId.trim(),
      ...(clientSecret && clientSecret.trim() ? { GOOGLE_CLIENT_SECRET: clientSecret.trim() } : {})
    });

    return NextResponse.json({ ok: true, message: "Google OAuth credentials saved successfully!" });
  } catch (error) {
    console.error("Failed to save credentials:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
