import { NextResponse } from "next/server";

export async function GET(request) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId || !clientId.trim() || clientId.trim().toLowerCase() === "none") {
    const loginUrl = new URL("/login?error=missing_client_id", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Determine redirect URI based on current request host
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  // Standard Google OAuth 2.0 authorization endpoint
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId.trim());
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid profile email");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "select_account");

  // Save returnTo path
  const referer = request.headers.get("referer");
  let returnToPath = "/studio";
  if (referer) {
    try {
      const refUrl = new URL(referer);
      if (refUrl.pathname && refUrl.pathname !== "/login") {
        returnToPath = refUrl.pathname;
      }
    } catch {}
  }

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set({
    name: "tc_return_to",
    value: returnToPath,
    path: "/",
    maxAge: 60 * 10 // 10 minutes
  });

  return response;
}
