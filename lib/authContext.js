"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// Initial sample projects for demonstration
const DEFAULT_PROJECTS = [
  {
    id: "proj-1",
    title: "Telugu AI Secrets Viral Reel",
    aspectRatio: "9/16",
    duration: 15.4,
    date: "2026-10-22",
    language: "Telugu (Native)",
    segmentsCount: 4,
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    status: "Completed",
    views: "48.2K"
  },
  {
    id: "proj-2",
    title: "I Was Never There — Lyrics Sync",
    aspectRatio: "9/16",
    duration: 31.3,
    date: "2026-10-22",
    language: "English (Lyrics)",
    segmentsCount: 3,
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
    status: "Draft",
    views: "12.4K"
  },
  {
    id: "proj-3",
    title: "Tech Tips Telugu Episode #08",
    aspectRatio: "9/16",
    duration: 28.0,
    date: "2026-10-20",
    language: "Telugu + English",
    segmentsCount: 8,
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    status: "Exported",
    views: "89.1K"
  },
  {
    id: "proj-4",
    title: "Hyderabad Biryani Secret Recipe Reel",
    aspectRatio: "9/16",
    duration: 45.2,
    date: "2026-10-18",
    language: "Telugu (Native)",
    segmentsCount: 12,
    thumbnail: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
    status: "Completed",
    views: "142.8K"
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(null);

  // Load persisted user & check Google OAuth configuration on mount
  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Query server session and Google OAuth config
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setGoogleConfigured(Boolean(data.googleConfigured));
          setGoogleClientId(data.googleClientId || null);

          if (data.authenticated && data.user) {
            setUser(data.user);
            localStorage.setItem("tc_user", JSON.stringify(data.user));
            setIsLoading(false);
            return;
          } else {
            setUser(null);
            localStorage.removeItem("tc_user");
          }
        }

        const storedProjects = localStorage.getItem("tc_projects");
        if (storedProjects) {
          setProjects(JSON.parse(storedProjects));
        }
      } catch (err) {
        console.warn("Could not load auth state:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  // Real Google OAuth 2.0 Sign-In
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (!googleConfigured) {
        throw new Error(
          "Google OAuth credentials are not configured yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env.local file."
        );
      }
      // Redirect to Google OAuth authorization endpoint
      window.location.href = "/api/auth/google/login";
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  // Verify Google Identity Services credential token (Popup / One-Tap)
  const verifyGoogleCredential = async (credential) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/google/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential })
      });
      const data = await res.json();
      if (!data.ok || !data.user) {
        throw new Error(data.error || "Google credential verification failed");
      }
      setUser(data.user);
      localStorage.setItem("tc_user", JSON.stringify(data.user));
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  // Claim any guest projects created during anonymous trial
  const claimGuestProjects = async () => {
    try {
      const res = await fetch("/api/guest/claim", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newProjects = data.projects.filter(p => !existingIds.has(p.id));
            const merged = [...newProjects, ...prev];
            localStorage.setItem("tc_projects", JSON.stringify(merged));
            return merged;
          });
          return data.projects;
        }
      }
    } catch (e) {
      console.warn("Could not claim guest projects:", e);
    }
    return [];
  };

  // Sync session cookie with server and get live user from database
  const syncUserSession = async (userData) => {
    if (typeof document !== "undefined") {
      document.cookie = `tc_session=${btoa(JSON.stringify(userData))}; path=/; max-age=2592000; SameSite=Lax`;
    }
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem("tc_user", JSON.stringify(data.user));
          await claimGuestProjects();
          return data.user;
        }
      }
    } catch (e) {
      console.warn("Session sync notice:", e.message);
    }
    setUser(userData);
    localStorage.setItem("tc_user", JSON.stringify(userData));
    await claimGuestProjects();
    return userData;
  };

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem("tc_user", JSON.stringify(data.user));
          return data.user;
        }
      }
    } catch (e) {
      console.warn("Could not refresh user:", e);
    }
  };

  const updateCreditsBalance = (newBalance) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, credits_balance: newBalance };
      localStorage.setItem("tc_user", JSON.stringify(updated));
      return updated;
    });
  };

  // Sign in directly with chosen Google account
  const loginWithGoogleAccount = async (account) => {
    setIsLoading(true);
    const googleUser = {
      id: account.id || `google_${Date.now()}`,
      name: account.name || "Google Creator",
      email: account.email || "creator@gmail.com",
      avatar: account.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(account.name || "Creator")}&backgroundColor=f97316`,
      provider: "google",
      plan: "free"
    };
    const synced = await syncUserSession(googleUser);
    setIsLoading(false);
    return synced;
  };

  // Quick Demo Account Login (for development testing before OAuth setup)
  const loginDemoAccount = async () => {
    setIsLoading(true);
    const demoUser = {
      id: "usr_creator_demo",
      name: "Abhiram Gantyada",
      email: "abhiram.creator@gmail.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      provider: "demo",
      plan: "free"
    };
    const synced = await syncUserSession(demoUser);
    setIsLoading(false);
    return synced;
  };

  // Email / Password Login
  const loginWithEmail = async (email, password) => {
    setIsLoading(true);
    const namePart = email.split("@")[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const emailUser = {
      id: `usr_${Date.now()}`,
      name: formattedName || "Telugu Creator",
      email: email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}&backgroundColor=f97316`,
      provider: "email",
      plan: "free"
    };
    const synced = await syncUserSession(emailUser);
    setIsLoading(false);
    return synced;
  };

  // Sign up
  const signup = async (name, email, password) => {
    setIsLoading(true);
    const newUser = {
      id: `usr_${Date.now()}`,
      name: name || "Telugu Creator",
      email: email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || "Creator")}&backgroundColor=f97316`,
      provider: "email",
      plan: "free"
    };
    const synced = await syncUserSession(newUser);
    setIsLoading(false);
    return synced;
  };

  // Request 6-digit OTP code for email verification
  const sendOtp = async (email) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 6-digit OTP and sign in user
  const verifyOtp = async (email, otp, name) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, name })
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.user) {
        throw new Error(data.error || "Verification failed");
      }
      setUser(data.user);
      localStorage.setItem("tc_user", JSON.stringify(data.user));
      await claimGuestProjects();
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  // Log out
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout request failed:", e);
    }
    if (typeof document !== "undefined") {
      document.cookie = "tc_session=; path=/; max-age=0; SameSite=Lax";
    }
    setUser(null);
    localStorage.removeItem("tc_user");
  };

  // Add new project
  const addProject = (project) => {
    const updated = [project, ...projects];
    setProjects(updated);
    localStorage.setItem("tc_projects", JSON.stringify(updated));
  };

  // Delete project
  const deleteProject = (id) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem("tc_projects", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        googleConfigured,
        googleClientId,
        loginWithGoogle,
        loginWithGoogleAccount,
        verifyGoogleCredential,
        loginDemoAccount,
        loginWithEmail,
        signup,
        sendOtp,
        verifyOtp,
        logout,
        projects,
        addProject,
        deleteProject,
        refreshUser,
        updateCreditsBalance,
        claimGuestProjects
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
