import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { PRICING_RULES } from "@/config/pricing";

const DB_PATH = path.join(process.cwd(), "tc_studio.sqlite");

// Maintain singleton DB instance across fast reloads
let dbInstance = global._tc_dbInstance;

function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec("PRAGMA journal_mode = WAL;");
    dbInstance.exec("PRAGMA foreign_keys = ON;");
    initTables(dbInstance);
    global._tc_dbInstance = dbInstance;
  }
  return dbInstance;
}

function initTables(db) {
  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      avatar TEXT,
      provider TEXT,
      plan TEXT DEFAULT 'free',
      credits_balance INTEGER DEFAULT 10,
      created_at TEXT
    );
  `);

  // 2. Credit Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_id TEXT,
      created_at TEXT
    );
  `);

  // 3. Jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      job_type TEXT DEFAULT 'transcribe',
      video_duration_sec REAL DEFAULT 0,
      credits_cost INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      created_at TEXT,
      completed_at TEXT
    );
  `);

  // 4. Guest Sessions table (pre-configured for Phase 6)
  db.exec(`
    CREATE TABLE IF NOT EXISTS guest_sessions (
      id TEXT PRIMARY KEY,
      ip_address TEXT,
      trials_count INTEGER DEFAULT 0,
      created_at TEXT,
      last_active_at TEXT
    );
  `);

  // 5. Guest Projects table (pre-configured for Phase 6)
  db.exec(`
    CREATE TABLE IF NOT EXISTS guest_projects (
      id TEXT PRIMARY KEY,
      guest_id TEXT NOT NULL,
      user_id TEXT,
      title TEXT,
      video_url TEXT,
      duration_sec REAL DEFAULT 0,
      segments_json TEXT,
      status TEXT DEFAULT 'completed',
      claimed INTEGER DEFAULT 0,
      created_at TEXT
    );
  `);


  // 7. Support Inquiries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS support_inquiries (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      category TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'unread',
      admin_notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 6. Email OTP Verifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
}

/**
 * Synchronize or create user upon authentication.
 * Guarantees every user receives 10 bonus credits once via signup_bonus.
 */
export function getOrCreateUser(userData) {
  if (!userData || (!userData.id && !userData.email)) return null;

  const db = getDb();
  const userId = userData.id || `usr_${crypto.randomBytes(6).toString("hex")}`;
  const userEmail = userData.email || `${userId}@example.com`;

  // Look up existing user by ID or Email
  let user = db.prepare("SELECT * FROM users WHERE id = ? OR email = ?").get(userId, userEmail);

  if (!user) {
    const now = new Date().toISOString();
    const initialCredits = PRICING_RULES.SIGNUP_BONUS_CREDITS; // 10 credits
    const plan = userData.plan || "free";

    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(`
        INSERT INTO users (id, name, email, avatar, provider, plan, credits_balance, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        userData.name || "Telugu Creator",
        userEmail,
        userData.avatar || "",
        userData.provider || "email",
        plan,
        initialCredits,
        now
      );

      // Record signup_bonus transaction
      const txId = `tx_${crypto.randomBytes(8).toString("hex")}`;
      db.prepare(`
        INSERT INTO credit_transactions (id, user_id, amount, reason, reference_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(txId, userId, initialCredits, "signup_bonus", "initial_signup", now);

      db.exec("COMMIT");
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  } else {
    // Safe migration: check if existing user ever received signup bonus
    const bonusTx = db.prepare(`
      SELECT id FROM credit_transactions WHERE user_id = ? AND reason = 'signup_bonus'
    `).get(user.id);

    if (!bonusTx) {
      const now = new Date().toISOString();
      const bonusAmount = PRICING_RULES.SIGNUP_BONUS_CREDITS;
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare(`
          UPDATE users SET credits_balance = credits_balance + ? WHERE id = ?
        `).run(bonusAmount, user.id);

        const txId = `tx_${crypto.randomBytes(8).toString("hex")}`;
        db.prepare(`
          INSERT INTO credit_transactions (id, user_id, amount, reason, reference_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(txId, user.id, bonusAmount, "signup_bonus", "migration_bonus", now);

        db.exec("COMMIT");
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
      } catch (err) {
        db.exec("ROLLBACK");
      }
    }
  }

  return user;
}

/**
 * Retrieve user by ID
 */
export function getUserById(id) {
  if (!id) return null;
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

/**
 * Atomically check user credit balance and deduct credits in a single transaction.
 * Prevents double-spend and balances falling below zero.
 */
export function deductCreditsAtomically(userId, amount, reason, referenceId = null) {
  if (!userId || amount <= 0) return { success: true, balance: 0 };
  const db = getDb();

  db.exec("BEGIN IMMEDIATE");
  try {
    const user = db.prepare("SELECT credits_balance FROM users WHERE id = ?").get(userId);
    if (!user) {
      throw new Error("User account not found");
    }

    if (user.credits_balance < amount) {
      throw new Error(`Insufficient credits. Required: ${amount}, Available: ${user.credits_balance}`);
    }

    const newBalance = user.credits_balance - amount;
    db.prepare("UPDATE users SET credits_balance = ? WHERE id = ?").run(newBalance, userId);

    const txId = `tx_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO credit_transactions (id, user_id, amount, reason, reference_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(txId, userId, -amount, reason, referenceId, now);

    db.exec("COMMIT");
    return { success: true, txId, newBalance };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Atomically refund credits when downstream jobs fail.
 */
export function refundCreditsAtomically(userId, amount, reason = "refund", referenceId = null) {
  if (!userId || amount <= 0) return { success: true };
  const db = getDb();

  db.exec("BEGIN IMMEDIATE");
  try {
    const user = db.prepare("SELECT credits_balance FROM users WHERE id = ?").get(userId);
    if (!user) throw new Error("User not found for refund");

    const newBalance = user.credits_balance + amount;
    db.prepare("UPDATE users SET credits_balance = ? WHERE id = ?").run(newBalance, userId);

    const txId = `tx_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO credit_transactions (id, user_id, amount, reason, reference_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(txId, userId, amount, reason, referenceId, now);

    db.exec("COMMIT");
    return { success: true, txId, newBalance };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Create a tracked job in DB
 */
export function createJob({ userId, jobType, videoDurationSec, creditsCost }) {
  const db = getDb();
  const jobId = `job_${crypto.randomBytes(8).toString("hex")}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO jobs (id, user_id, job_type, video_duration_sec, credits_cost, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(jobId, userId, jobType || "transcribe", videoDurationSec || 0, creditsCost || 0, now);

  return jobId;
}

/**
 * Update job status & completion timestamp
 */
export function updateJobStatus(jobId, status, errorMessage = null) {
  if (!jobId) return;
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE jobs
    SET status = ?, error_message = ?, completed_at = ?
    WHERE id = ?
  `).run(status, errorMessage, now, jobId);
}

/**
 * Fetch recent user credit transactions
 */
export function getUserTransactions(userId, limit = 20) {
  if (!userId) return [];
  const db = getDb();
  return db.prepare(`
    SELECT * FROM credit_transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit);
}

/**
 * PHASE 6: Guest Session & Project Management
 */

/**
 * Retrieve or create an anonymous guest session.
 */
export function getOrCreateGuestSession(existingGuestId, ipAddress = "127.0.0.1") {
  const db = getDb();
  const now = new Date().toISOString();

  if (existingGuestId) {
    const existing = db.prepare("SELECT * FROM guest_sessions WHERE id = ?").get(existingGuestId);
    if (existing) {
      db.prepare("UPDATE guest_sessions SET last_active_at = ? WHERE id = ?").run(now, existingGuestId);
      return existing;
    }
  }

  const guestId = `gst_${crypto.randomBytes(12).toString("hex")}`;
  db.prepare(`
    INSERT INTO guest_sessions (id, ip_address, trials_count, created_at, last_active_at)
    VALUES (?, ?, 0, ?, ?)
  `).run(guestId, ipAddress, now, now);

  return {
    id: guestId,
    ip_address: ipAddress,
    trials_count: 0,
    created_at: now,
    last_active_at: now
  };
}

/**
 * Count total guest trials from an IP in the last 24 hours.
 */
export function getGuestTrialsCountForIp(ipAddress) {
  if (!ipAddress) return 0;
  const db = getDb();
  const row = db.prepare(`
    SELECT COALESCE(SUM(trials_count), 0) AS total
    FROM guest_sessions
    WHERE ip_address = ? AND created_at > datetime('now', '-24 hours')
  `).get(ipAddress);
  return Number(row?.total || 0);
}

/**
 * Record a trial usage on a guest session.
 */
export function recordGuestTrial(guestId) {
  if (!guestId) return;
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE guest_sessions
    SET trials_count = trials_count + 1, last_active_at = ?
    WHERE id = ?
  `).run(now, guestId);
}

/**
 * Store a guest project linked to a guest ID.
 */
export function saveGuestProject({ guestId, title, videoUrl, durationSec, segments }) {
  if (!guestId) return null;
  const db = getDb();
  const projId = `gproj_${crypto.randomBytes(8).toString("hex")}`;
  const now = new Date().toISOString();
  const segmentsJson = JSON.stringify(segments || []);

  db.prepare(`
    INSERT INTO guest_projects (id, guest_id, title, video_url, duration_sec, segments_json, status, claimed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'completed', 0, ?)
  `).run(projId, guestId, title || "telugu_reel", videoUrl || "", durationSec || 0, segmentsJson, now);

  return {
    id: projId,
    guest_id: guestId,
    title: title || "telugu_reel",
    video_url: videoUrl || "",
    duration_sec: durationSec || 0,
    segments,
    claimed: 0,
    created_at: now
  };
}

/**
 * Claim all guest projects for a newly logged in or signed up user.
 */
export function claimGuestProjects(guestId, userId) {
  if (!guestId || !userId) return [];
  const db = getDb();

  const unclaimed = db.prepare(`
    SELECT * FROM guest_projects
    WHERE guest_id = ? AND claimed = 0
  `).all(guestId);

  if (unclaimed.length > 0) {
    db.prepare(`
      UPDATE guest_projects
      SET user_id = ?, claimed = 1
      WHERE guest_id = ? AND claimed = 0
    `).run(userId, guestId);
  }

  return unclaimed.map(p => ({
    ...p,
    segments: p.segments_json ? JSON.parse(p.segments_json) : []
  }));
}

/**
 * Automatically delete unclaimed guest projects and expired guest sessions older than 48 hours.
 */
export function cleanupUnclaimedGuestProjects() {
  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const expiredProjects = db.prepare(`
      SELECT id, video_url FROM guest_projects
      WHERE claimed = 0 AND created_at < ?
    `).all(cutoff);

    // Delete any disk video files if applicable
    for (const proj of expiredProjects) {
      if (proj.video_url && proj.video_url.startsWith("/")) {
        try {
          const filePath = path.join(process.cwd(), "public", proj.video_url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          // ignore disk unlink error
        }
      }
    }

    db.prepare(`
      DELETE FROM guest_projects
      WHERE claimed = 0 AND created_at < ?
    `).run(cutoff);

    db.prepare(`
      DELETE FROM guest_sessions
      WHERE created_at < ?
    `).run(cutoff);
  } catch (err) {
    console.warn("Guest cleanup warning:", err.message);
  }
}

/**
 * Generate and store a secure 6-digit OTP for an email address.
 * Rate-limited to 1 request per 45 seconds per email.
 */
export function createEmailOtp(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Valid email is required");
  }
  const db = getDb();
  const cleanEmail = email.trim().toLowerCase();

  // Check rate limit: if an OTP was created less than 45 seconds ago, throw
  const existing = db.prepare(`
    SELECT created_at FROM email_verifications
    WHERE email = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(cleanEmail);

  if (existing) {
    const elapsed = Date.now() - new Date(existing.created_at).getTime();
    if (elapsed < 45 * 1000) {
      const waitSec = Math.ceil((45 * 1000 - elapsed) / 1000);
      throw new Error(`Please wait ${waitSec}s before requesting a new code.`);
    }
  }

  // Invalidate older OTPs for this email
  db.prepare("DELETE FROM email_verifications WHERE email = ?").run(cleanEmail);

  // Generate secure 6-digit code
  const otp = crypto.randomInt(100000, 999999).toString();
  const id = `otp_${crypto.randomBytes(8).toString("hex")}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes

  db.prepare(`
    INSERT INTO email_verifications (id, email, otp, expires_at, attempts, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(id, cleanEmail, otp, expiresAt, now.toISOString());

  return { otp, expiresAt, cleanEmail };
}

/**
 * Verify an entered 6-digit OTP for an email address.
 * Maximum 5 attempts allowed before invalidation.
 */
export function verifyEmailOtp(email, enteredOtp) {
  if (!email || !enteredOtp) {
    return { success: false, error: "Email and verification code are required" };
  }
  const db = getDb();
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = String(enteredOtp).trim();

  const record = db.prepare(`
    SELECT * FROM email_verifications
    WHERE email = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(cleanEmail);

  if (!record) {
    return { success: false, error: "No verification code requested or code expired. Please request a new code." };
  }

  // Check expiration
  if (new Date(record.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM email_verifications WHERE id = ?").run(record.id);
    return { success: false, error: "Verification code has expired. Please request a new code." };
  }

  // Check max attempts
  if (record.attempts >= 5) {
    db.prepare("DELETE FROM email_verifications WHERE id = ?").run(record.id);
    return { success: false, error: "Too many incorrect attempts. Please request a new code." };
  }

  if (record.otp !== cleanOtp) {
    db.prepare("UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?").run(record.id);
    const remaining = 5 - (record.attempts + 1);
    return { success: false, error: `Invalid code. ${remaining} attempt(s) remaining.` };
  }

  // OTP verified! Clean up OTP record
  db.prepare("DELETE FROM email_verifications WHERE id = ?").run(record.id);
  return { success: true };
}

/**
 * Fetch all registered users for Admin panel
 */
export function getAllUsers() {
  const db = getDb();
  return db.prepare(`
    SELECT id, name, email, avatar, provider, plan, credits_balance, created_at
    FROM users
    ORDER BY created_at DESC
  `).all();
}

/**
 * Fetch aggregate platform stats for Admin dashboard
 */
export function getAdminStats() {
  const db = getDb();
  const totalUsersRow = db.prepare("SELECT COUNT(*) as count FROM users").get();
  const totalCreditsRow = db.prepare("SELECT COALESCE(SUM(credits_balance), 0) as sum FROM users").get();
  const totalJobsRow = db.prepare("SELECT COUNT(*) as count FROM jobs").get();
  const totalTxRow = db.prepare("SELECT COUNT(*) as count FROM credit_transactions").get();

  return {
    totalUsers: Number(totalUsersRow?.count || 0),
    totalCredits: Number(totalCreditsRow?.sum || 0),
    totalJobs: Number(totalJobsRow?.count || 0),
    totalTransactions: Number(totalTxRow?.count || 0)
  };
}

/**
 * Adjust credits for a user (positive to add, negative to deduct) with audit transaction
 */
export function adminAdjustCredits(userId, amount, reason = "admin_adjustment") {
  if (!userId || isNaN(amount) || amount === 0) {
    throw new Error("Valid user ID and non-zero amount are required");
  }
  const db = getDb();

  db.exec("BEGIN IMMEDIATE");
  try {
    const user = db.prepare("SELECT credits_balance FROM users WHERE id = ?").get(userId);
    if (!user) throw new Error("User not found");

    const newBalance = Math.max(0, user.credits_balance + amount);
    db.prepare("UPDATE users SET credits_balance = ? WHERE id = ?").run(newBalance, userId);

    const txId = `tx_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO credit_transactions (id, user_id, amount, reason, reference_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(txId, userId, amount, reason, "admin_action", now);

    db.exec("COMMIT");
    return { success: true, newBalance, txId };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Fetch recent transactions with user information for Admin ledger
 */
export function getRecentAdminTransactions(limit = 50) {
  const db = getDb();
  return db.prepare(`
    SELECT ct.*, u.email as user_email, u.name as user_name
    FROM credit_transactions ct
    LEFT JOIN users u ON ct.user_id = u.id
    ORDER BY ct.created_at DESC
    LIMIT ?
  `).all(limit);
}

/**
 * Record a credit pack purchase atomically with replay protection.
 */
export function recordCreditPurchase({ userId, amount, packageId, orderId, paymentId, priceInr }) {
  if (!userId || !amount || amount <= 0) {
    throw new Error("Valid userId and positive credit amount are required");
  }
  const db = getDb();

  db.exec("BEGIN IMMEDIATE");
  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ? OR email = ?").get(userId, userId);
    if (!user) throw new Error("User account not found");
    const canonicalUserId = user.id;

    // Prevent duplicate credit provisioning for the same order/payment
    if (orderId || paymentId) {
      const existingTx = db.prepare(`
        SELECT id FROM credit_transactions 
        WHERE user_id = ? AND (reference_id = ? OR reference_id = ?)
      `).get(canonicalUserId, orderId || "---", paymentId || "---");

      if (existingTx) {
        db.exec("ROLLBACK");
        return { success: true, alreadyProcessed: true, newBalance: user.credits_balance, txId: existingTx.id };
      }
    }

    const newBalance = user.credits_balance + amount;
    const plan = packageId === "pack_studio" ? "studio" : packageId === "pack_creator" ? "creator" : user.plan || "free";

    db.prepare("UPDATE users SET credits_balance = ?, plan = ? WHERE id = ?").run(newBalance, plan, canonicalUserId);

    const txId = `tx_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();
    const ref = orderId || paymentId || `pack_${Date.now()}`;
    const reason = `pack_purchase:${packageId || "custom"} (₹${priceInr || 0})`;

    db.prepare(`
      INSERT INTO credit_transactions (id, user_id, amount, reason, reference_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(txId, canonicalUserId, amount, reason, ref, now);

    db.exec("COMMIT");
    return { success: true, newBalance, txId, plan };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}


/**
 * Create a new customer support / enquiry ticket.
 */
export function createSupportInquiry({ userId, name, email, phone, category, subject, message }) {
  if (!name || !email || !message) {
    throw new Error("Name, email, and message are required for support inquiries.");
  }
  const db = getDb();
  const id = `inq_${crypto.randomBytes(8).toString("hex")}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO support_inquiries (id, user_id, name, email, phone, category, subject, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unread', ?)
  `).run(id, userId || null, name.trim(), email.trim().toLowerCase(), (phone || "").trim(), category || "general", subject || "", message.trim(), now);

  return { id, name, email, created_at: now };
}

/**
 * Retrieve all support inquiries for admin inspection.
 */
export function getAllSupportInquiries(limit = 100) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM support_inquiries
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
}

/**
 * Update support inquiry status and admin notes.
 */
export function updateSupportInquiryStatus(id, status, adminNotes = "") {
  if (!id || !status) throw new Error("Inquiry ID and status are required");
  const db = getDb();
  db.prepare(`
    UPDATE support_inquiries 
    SET status = ?, admin_notes = COALESCE(?, admin_notes)
    WHERE id = ?
  `).run(status, adminNotes || null, id);
  return { success: true, id, status };
}
