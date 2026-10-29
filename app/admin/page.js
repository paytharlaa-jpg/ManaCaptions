"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  Users,
  Zap,
  Mail,
  Send,
  Download,
  Search,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Loader2,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Sparkles,
  ExternalLink
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [adminKey, setAdminKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Platform Data
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCredits: 0,
    totalJobs: 0,
    totalTransactions: 0
  });
  const [users, setUsers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState("users"); // "users" | "broadcast" | "ledger"
  const [searchQuery, setSearchQuery] = useState("");

  // Credit Adjustment Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(20);
  const [adjustReason, setAdjustReason] = useState("Promotional Bonus");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustSuccess, setAdjustSuccess] = useState(null);

  // Email Broadcaster State
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastMode, setBroadcastMode] = useState("all"); // "all" | "test"
  const [testEmail, setTestEmail] = useState("paytharlaabhiram@gmail.com");
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  // Stealth Mode: Non-admin users are immediately redirected to /studio
  useEffect(() => {
    if (!isLoading) {
      if (!user || !user.isAdmin) {
        router.replace("/studio");
      }
    }
  }, [user, isLoading, router]);

  // Check saved session passkey on mount
  useEffect(() => {
    if (user && user.isAdmin) {
      const savedKey = typeof window !== "undefined" ? sessionStorage.getItem("mc_admin_key") : "";
      if (savedKey) {
        setAdminKey(savedKey);
        fetchAdminData(savedKey);
      } else {
        setLoading(false);
      }
    }
  }, [user]);

  const fetchAdminData = async (key) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/data", {
        headers: { "x-admin-key": key || adminKey }
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setIsAuthorized(false);
        setError(data.error || "Please enter the admin passkey to continue.");
      } else {
        setIsAuthorized(true);
        setStats(data.stats || {});
        setUsers(data.users || []);
        setRecentTransactions(data.recentTransactions || []);
        if (key && typeof window !== "undefined") {
          sessionStorage.setItem("mc_admin_key", key);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to connect to admin API");
      setIsAuthorized(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleKeySubmit = (e) => {
    e.preventDefault();
    fetchAdminData(adminKey);
  };

  // Adjust User Credits
  const handleAdjustCredits = async (e) => {
    e.preventDefault();
    if (!selectedUser || !adjustAmount) return;

    setAdjustLoading(true);
    setAdjustSuccess(null);
    try {
      const res = await fetch("/api/admin/adjust-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: parseInt(adjustAmount, 10),
          reason: adjustReason.trim() || "admin_adjustment"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to adjust credits");
      }

      setAdjustSuccess(data.message);
      // Update local state
      setUsers(prev =>
        prev.map(u => (u.id === selectedUser.id ? { ...u, credits_balance: data.newBalance } : u))
      );
      setTimeout(() => {
        setSelectedUser(null);
        setAdjustSuccess(null);
      }, 1500);
    } catch (err) {
      alert(err.message);
    } finally {
      setAdjustLoading(false);
    }
  };

  // Send Broadcast Email
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      alert("Please enter subject and message.");
      return;
    }

    if (broadcastMode === "all") {
      const confirmSend = window.confirm(
        `Are you sure you want to broadcast this email to all ${users.length} registered users?`
      );
      if (!confirmSend) return;
    }

    setBroadcastLoading(true);
    setBroadcastResult(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey
        },
        body: JSON.stringify({
          subject: broadcastSubject,
          message: broadcastMessage,
          testEmailOnly: broadcastMode === "test" ? testEmail : null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Broadcast delivery failed");
      }

      setBroadcastResult(data);
    } catch (err) {
      setBroadcastResult({ ok: false, error: err.message });
    } finally {
      setBroadcastLoading(false);
    }
  };

  // Export Users to CSV
  const handleExportCSV = () => {
    if (!users || users.length === 0) {
      alert("No users found to export.");
      return;
    }

    const headers = ["ID", "Name", "Email", "Provider", "Plan", "Credits Balance", "Registered At"];
    const rows = users.map(u => [
      `"${u.id}"`,
      `"${u.name || ""}"`,
      `"${u.email}"`,
      `"${u.provider || ""}"`,
      `"${u.plan || "free"}"`,
      u.credits_balance ?? 10,
      `"${u.created_at || ""}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `manacaptions_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      u =>
        u.email?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  return (
    <div className="min-h-screen w-full bg-[#060919] text-[#F8F3F0] flex flex-col font-sans selection:bg-[#20309A] selection:text-[#F8F3F0]">
      {/* Top Header */}
      <header className="h-16 px-4 sm:px-8 border-b border-[#20309A]/30 bg-[#060919]/90 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#20309A] via-[#384DE8] to-[#BB232B] flex items-center justify-center shadow-[0_0_15px_rgba(32,48,154,0.5)] border border-[#F8F3F0]/20 text-white font-black text-xs">
              MC
            </div>
            <span className="font-extrabold text-[#F8F3F0] text-base tracking-tight hidden sm:inline">ManaCaption</span>
          </Link>
          <span className="text-[#20309A]/60">/</span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BB232B]/20 border border-[#BB232B]/40 text-[#F8F3F0] text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(187,35,43,0.25)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#BB232B]" />
            <span>Admin Hub</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isAuthorized && (
            <>
              <button
                onClick={() => { setRefreshing(true); fetchAdminData(adminKey); }}
                disabled={refreshing}
                title="Refresh Data"
                className="p-2 rounded-xl border border-[#20309A]/40 hover:bg-[#0D1333] text-[#F8F3F0]/70 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#384DE8]" : ""}`} />
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#20309A]/40 hover:bg-[#0D1333] text-xs font-semibold text-[#F8F3F0]/80 hover:text-white transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </>
          )}

          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] border border-[#20309A]/40 text-xs font-semibold text-[#F8F3F0] transition-colors"
          >
            <span>Open Studio</span>
            <ExternalLink className="w-3 h-3 text-[#384DE8]" />
          </Link>
        </div>
      </header>

      {/* Main Content - Clean natural scrolling */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Passkey Authorization Screen (if not authorized) */}
        {!isAuthorized ? (
          <div className="max-w-md mx-auto my-16 bg-[#0C1230] border border-[#20309A]/40 rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(32,48,154,0.2)] text-center space-y-5 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#20309A]/20 border border-[#20309A]/40 text-[#384DE8] flex items-center justify-center mx-auto shadow-md">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F8F3F0]">Admin Command Center</h1>
              <p className="text-xs text-[#F8F3F0]/60 mt-1">Two-Factor Authentication: Signed in as <span className="text-[#384DE8] font-semibold">{user?.email}</span></p>
            </div>

            <form onSubmit={handleKeySubmit} className="space-y-3">
              <input
                type="password"
                required
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter secret passkey"
                className="w-full bg-[#060919] border border-[#20309A]/40 rounded-xl px-4 py-2.5 text-xs text-[#F8F3F0] placeholder-[#F8F3F0]/30 focus:outline-none focus:border-[#384DE8] text-center font-mono tracking-widest"
              />

              {error && (
                <div className="p-2.5 rounded-xl bg-[#BB232B]/15 border border-[#BB232B]/40 text-[#F8F3F0] text-xs flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#E0353E]" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white font-bold text-xs shadow-[0_0_20px_rgba(32,48,154,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Unlock &rarr;</span>}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Stats Overview Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium">Total Registered Users</span>
                  <Users className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stats.totalUsers}
                </div>
                <div className="text-[11px] text-neutral-500">Active Creator Profiles</div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium">Credits In Circulation</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
                  {stats.totalCredits}
                </div>
                <div className="text-[11px] text-neutral-500">Available across all accounts</div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium">AI Transcriptions / Jobs</span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stats.totalJobs}
                </div>
                <div className="text-[11px] text-neutral-500">Subtitles generated &amp; exported</div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium">Credit Ledger Events</span>
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stats.totalTransactions}
                </div>
                <div className="text-[11px] text-neutral-500">Audit transactions recorded</div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-3">
              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "users"
                    ? "bg-orange-500/15 border border-orange-500/30 text-orange-400 shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Users &amp; Credit Balances ({users.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("broadcast")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "broadcast"
                    ? "bg-orange-500/15 border border-orange-500/30 text-orange-400 shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Broadcast Update to All Users</span>
              </button>

              <button
                onClick={() => setActiveTab("ledger")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "ledger"
                    ? "bg-orange-500/15 border border-orange-500/30 text-orange-400 shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>System Transactions Ledger</span>
              </button>
            </div>

            {/* TAB 1: Users Directory */}
            {activeTab === "users" && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search creators by email, name, or ID..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="text-xs text-neutral-400">
                    Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
                  </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400 text-[11px] uppercase tracking-wider font-mono">
                          <th className="py-3 px-4">Creator / User</th>
                          <th className="py-3 px-4">Provider</th>
                          <th className="py-3 px-4">Credits</th>
                          <th className="py-3 px-4">Joined Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-neutral-500">
                              No creators found matching your search.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-neutral-800/30 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name || "Creator")}&backgroundColor=f97316`}
                                    alt={u.name}
                                    className="w-8 h-8 rounded-lg object-cover border border-neutral-700"
                                  />
                                  <div>
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      <span>{u.name || "Creator"}</span>
                                    </div>
                                    <div className="text-neutral-400 font-mono text-[11px]">{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  u.provider === "google"
                                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                                    : "bg-orange-500/15 text-orange-400 border border-orange-500/25"
                                }`}>
                                  {u.provider || "email"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/25 text-orange-400 font-bold font-mono">
                                  <Zap className="w-3 h-3 fill-orange-400" />
                                  <span>{u.credits_balance ?? 10}</span>
                                </span>
                              </td>
                              <td className="py-3 px-4 text-neutral-400 text-[11px]">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Recently"}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => { setSelectedUser(u); setAdjustAmount(20); }}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-orange-500 hover:text-white text-neutral-300 transition-colors font-medium text-xs cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Manage Credits</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Email Broadcaster */}
            {activeTab === "broadcast" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Broadcaster Form (2 cols) */}
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-orange-400" />
                        <span>Send Product Update or Announcement</span>
                      </h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Broadcasts an official notification to all {users.length} registered creators via Resend.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSendBroadcast} className="space-y-4">
                    {/* Send Mode Picker */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBroadcastMode("all")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          broadcastMode === "all"
                            ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        Broadcast to All ({users.length} Users)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBroadcastMode("test")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          broadcastMode === "test"
                            ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        Test Email Only (Send to Myself)
                      </button>
                    </div>

                    {broadcastMode === "test" && (
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Test Recipient Email
                        </label>
                        <input
                          type="email"
                          required
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        required
                        value={broadcastSubject}
                        onChange={(e) => setBroadcastSubject(e.target.value)}
                        placeholder="e.g. 🎉 New Telugu Karaoke Subtitle Styles & Faster AI Export!"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Message Body
                      </label>
                      <textarea
                        required
                        rows={8}
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder="Hi Creator,&#10;&#10;We just released an exciting new update to ManaCaptions Studio!&#10;&#10;- Faster dual-script Telugu subtitles&#10;- New glowing punchy reel presets&#10;- 10 bonus credits credited to your account!&#10;&#10;Try it out today in your Studio."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 font-sans leading-relaxed"
                      />
                    </div>

                    {broadcastResult && (
                      <div className={`p-3 rounded-xl border text-xs ${
                        broadcastResult.ok
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      }`}>
                        {broadcastResult.ok ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{broadcastResult.message}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{broadcastResult.error}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={broadcastLoading}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {broadcastLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Delivering Emails...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>
                            {broadcastMode === "test"
                              ? `Send Test Email to ${testEmail}`
                              : `Broadcast to All ${users.length} Creators`}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Email Live Preview (1 col) */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center gap-1.5 pb-2 border-b border-neutral-800">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>Recipient Inbox Preview</span>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3 text-xs">
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-bold uppercase">
                      ManaCaptions Announcement
                    </div>
                    <h3 className="font-bold text-white text-sm leading-snug">
                      {broadcastSubject || "Your Subject Line Will Appear Here"}
                    </h3>
                    <p className="text-neutral-400 whitespace-pre-line text-xs leading-relaxed">
                      {broadcastMessage || "Your formatted message body will appear here for all users..."}
                    </p>
                    <div className="pt-2">
                      <span className="inline-block px-3 py-1.5 rounded-lg bg-orange-500 text-white font-bold text-[11px]">
                        Open ManaCaptions Studio &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: System Transactions Ledger */}
            {activeTab === "ledger" && (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400 text-[11px] uppercase tracking-wider font-mono">
                        <th className="py-3 px-4">Transaction ID</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Credits</th>
                        <th className="py-3 px-4">Reason / Reference</th>
                        <th className="py-3 px-4">Date &amp; Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                      {recentTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-neutral-500">
                            No transactions recorded in database yet.
                          </td>
                        </tr>
                      ) : (
                        recentTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-neutral-800/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-neutral-400 text-[11px]">
                              {tx.id}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-white">{tx.user_email || tx.user_id}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-0.5 font-bold font-mono px-2 py-0.5 rounded ${
                                tx.amount > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                              }`}>
                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-neutral-300">
                              <span className="capitalize">{tx.reason?.replace(/_/g, " ")}</span>
                            </td>
                            <td className="py-3 px-4 text-neutral-500 text-[11px]">
                              {tx.created_at ? new Date(tx.created_at).toLocaleString() : ""}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Adjust Credits Modal Dialog */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400 flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-5 h-5 fill-orange-400" />
                </div>
                <h3 className="text-base font-bold text-white">Manage User Credits</h3>
                <p className="text-xs text-neutral-400">{selectedUser.name} ({selectedUser.email})</p>
                <div className="text-xs text-amber-400 font-mono pt-1">
                  Current Balance: <strong>{selectedUser.credits_balance ?? 10} credits</strong>
                </div>
              </div>

              <form onSubmit={handleAdjustCredits} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Amount to Add / Deduct
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustAmount(Math.max(-100, (parseInt(adjustAmount, 10) || 0) - 10))}
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      required
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      placeholder="+20 or -10"
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-center text-sm font-bold font-mono text-white focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setAdjustAmount((parseInt(adjustAmount, 10) || 0) + 10)}
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Audit Note / Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. Creator Welcome Gift, Promo bonus"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                {adjustSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{adjustSuccess}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    disabled={adjustLoading}
                    className="flex-1 py-2 rounded-xl border border-neutral-800 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjustLoading}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {adjustLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm Update</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
