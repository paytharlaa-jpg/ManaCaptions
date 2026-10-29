import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/authServer";
import { getAllUsers, getAdminStats, getRecentAdminTransactions, getAllSupportInquiries } from "@/lib/db";

const DEFAULT_ADMIN_EMAILS = [
  "paytharlaabhiram@gmail.com",
  "hello.trygaruda@gmail.com"
];

const DEFAULT_ADMIN_SECRET = "ManaAdmin#2026@Pass";

export async function checkAdminAuth(request) {
  // 1. Factor 1: Authenticated Google Session must belong to an authorized Admin Email
  const { authenticated, user } = getAuthenticatedUser(request);
  if (!authenticated || !user?.email) {
    return { authorized: false, error: "Sign in with an authorized admin account." };
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  const allowed = [...DEFAULT_ADMIN_EMAILS, ...adminEmails];
  if (!allowed.includes(user.email.toLowerCase())) {
    return { authorized: false, error: "Access denied. Not an authorized admin email." };
  }

  // 2. Factor 2: Must provide the configured Secret Passkey
  const clientKey = request.headers.get("x-admin-key");
  const configuredSecret = process.env.ADMIN_SECRET || DEFAULT_ADMIN_SECRET;
  const expectedKey = configuredSecret.trim();

  if (!clientKey || clientKey.trim() !== expectedKey) {
    return { authorized: false, error: "Invalid admin passkey." };
  }

  return { authorized: true, user, reason: "two_factor_verified" };
}

export async function GET(request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: auth.error || "Unauthorized. Admin access required." },
      { status: 403 }
    );
  }

  try {
    const stats = getAdminStats();
    const users = getAllUsers();
    const recentTransactions = getRecentAdminTransactions(50);
    const supportInquiries = getAllSupportInquiries(100);

    return NextResponse.json({
      ok: true,
      stats,
      users,
      recentTransactions,
      supportInquiries
    });
  } catch (err) {
    console.error("Admin data fetch error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to load admin data" },
      { status: 500 }
    );
  }
}
