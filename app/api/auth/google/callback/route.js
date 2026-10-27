import { NextResponse } from "next/server";
import { getOrCreateUser, claimGuestProjects } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = new URL("/", request.url);

  if (error || !code) {
    const loginUrl = new URL("/login?error=" + encodeURIComponent(error || "no_code"), request.url);
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const loginUrl = new URL("/login?error=missing_credentials", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for Google access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("Google token exchange error:", errBody);
      const loginUrl = new URL("/login?error=token_exchange_failed", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated user profile from Google UserInfo endpoint
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!profileRes.ok) {
      const loginUrl = new URL("/login?error=profile_fetch_failed", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const profile = await profileRes.json();

    // 3. Construct Creator User Object
    const user = {
      id: profile.sub || `google_${Date.now()}`,
      name: profile.name || profile.given_name || "Google Creator",
      email: profile.email,
      avatar: profile.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || "Creator")}`,
      provider: "google",
      plan: "Creator Pro",
      quotaTotal: 180,
      quotaUsed: 0,
      joined: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })
    };

    // Save/sync user in DB with 10 free signup credits
    try {
      getOrCreateUser(user);
    } catch (dbErr) {
      console.warn("Could not sync user to DB in OAuth callback:", dbErr.message);
    }

    // Automatically claim any guest projects from tc_guest cookie
    const guestCookie = request.cookies.get("tc_guest");
    if (guestCookie?.value) {
      try {
        claimGuestProjects(guestCookie.value, user.id);
      } catch (claimErr) {
        console.warn("Could not claim guest projects in OAuth callback:", claimErr.message);
      }
    }

    // 4. Set session cookie and redirect to starting page (Dashboard or returnTo)
    const returnTo = request.cookies.get("tc_return_to")?.value || "/";
    const targetUrl = new URL(returnTo, request.url);
    const response = NextResponse.redirect(targetUrl);
    response.cookies.set({
      name: "tc_session",
      value: Buffer.from(JSON.stringify(user)).toString("base64"),
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      httpOnly: false // Accessible by auth context on client
    });

    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    const loginUrl = new URL("/login?error=oauth_exception", request.url);
    return NextResponse.redirect(loginUrl);
  }
}
