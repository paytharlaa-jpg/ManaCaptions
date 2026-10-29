import { NextResponse } from "next/server";

function getPublicOrigin(request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host") || "manacaptions.online";
  const rawHost = (forwardedHost || hostHeader).split(",")[0].trim();

  let host = rawHost;
  if (host.startsWith("0.0.0.0") || host.startsWith("127.0.0.1") || !host) {
    host = "manacaptions.online";
  }

  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(request) {
  const publicOrigin = getPublicOrigin(request);
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId || !clientId.trim() || clientId.trim().toLowerCase() === "none") {
    const loginUrl = new URL("/login?error=missing_client_id", publicOrigin);
    return NextResponse.redirect(loginUrl);
  }

  const redirectUri = `${publicOrigin}/api/auth/google/callback`;

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
