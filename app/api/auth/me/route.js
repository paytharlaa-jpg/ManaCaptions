import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/authServer";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { authenticated, user } = getAuthenticatedUser(request);
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const hasSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET.trim());

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
    googleConfigured: Boolean(clientId && clientId.trim() && hasSecret),
    googleClientId: clientId ? clientId.trim() : null
  });
}
