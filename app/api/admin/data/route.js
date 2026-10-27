import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/authServer";
import { getAllUsers, getAdminStats, getRecentAdminTransactions } from "@/lib/db";

const DEFAULT_ADMIN_EMAILS = ["hello.trygaruda@gmail.com", "paytharlaabhiram@gmail.com"];
const DEFAULT_ADMIN_KEY = "admin1234";

export async function checkAdminAuth(request) {
  // 1. Check custom admin key header
  const adminKey = request.headers.get("x-admin-key");
  const configuredKey = process.env.ADMIN_SECRET || DEFAULT_ADMIN_KEY;
  if (adminKey && adminKey === configuredKey) {
    return { authorized: true, reason: "key" };
  }

  // 2. Check authenticated user session email
  const { authenticated, user } = getAuthenticatedUser(request);
  if (authenticated && user?.email) {
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    
    const allowed = [...DEFAULT_ADMIN_EMAILS, ...adminEmails];
    if (allowed.includes(user.email.toLowerCase())) {
      return { authorized: true, user, reason: "email" };
    }
  }

  return { authorized: false };
}

export async function GET(request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  try {
    const stats = getAdminStats();
    const users = getAllUsers();
    const recentTransactions = getRecentAdminTransactions(30);

    return NextResponse.json({
      ok: true,
      stats,
      users,
      recentTransactions
    });
  } catch (err) {
    console.error("Admin data fetch error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to load admin data" },
      { status: 500 }
    );
  }
}
