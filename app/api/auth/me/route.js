import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/authServer";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { authenticated, user } = getAuthenticatedUser(request);
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const isRealClientId = Boolean(
    clientId &&
    clientId.trim() &&
    clientId.trim().toLowerCase() !== "none" &&
    !clientId.includes("your-google")
  );
  const isRealSecret = Boolean(
    clientSecret &&
    clientSecret.trim() &&
    clientSecret.trim().toLowerCase() !== "none" &&
    !clientSecret.includes("your-google")
  );

  return NextResponse.json({
    ok: true,
    authenticated,
    user: user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
      plan: user.plan || "free",
      credits_balance: user.credits_balance ?? 10,
      created_at: user.created_at
    } : null,
    googleConfigured: isRealClientId && isRealSecret,
    googleClientId: isRealClientId ? clientId.trim() : null
  });
}
