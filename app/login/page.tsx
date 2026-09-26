"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Coffee,
  Shield,
  KeyRound,
  Store,
  User,
  Lock,
  ArrowRight,
  Building2,
  MapPin,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  ChevronDown,
  Monitor,
  Fingerprint,
  Clock,
  TrendingUp,
  Users,
  Utensils,
  Star,
  Loader2,
  Delete,
  CornerDownLeft,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getAllCafeAccounts, getOnlyCafeBranches, INITIAL_CAFE_ACCOUNTS } from "@/lib/auth";
import { CafeAccount } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Late Night Session";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Late Night Session";
}

function getTimeEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "🌙";
  if (hour < 12) return "☀️";
  if (hour < 17) return "🌤️";
  if (hour < 21) return "🌆";
  return "🌙";
}

const BRANCH_EMOJIS: Record<string, string> = {
  "admin-hq": "👑",
  "cafe-delhi-flagship": "☕",
  "cafe-cp-02": "🏛️",
  "cafe-gurgaon-03": "🏙️",
};

const BRANCH_COLORS: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  "admin-hq": {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    ring: "ring-amber-500/20",
  },
  "cafe-delhi-flagship": {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/30",
    ring: "ring-orange-500/20",
  },
  "cafe-cp-02": {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/30",
    ring: "ring-indigo-500/20",
  },
  "cafe-gurgaon-03": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/20",
  },
};

const DEFAULT_COLORS = {
  bg: "bg-slate-500/10",
  text: "text-slate-600 dark:text-slate-400",
  border: "border-slate-500/30",
  ring: "ring-slate-500/20",
};

// ─── Login Page ───────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPin, isLoading: authLoading } = useAuth();

  // ── State ──
  const [mode, setMode] = useState<"password" | "pin">("password");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuickAccounts, setShowQuickAccounts] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pinInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // ── Detect cafe setup ──
  const branches = useMemo(() => {
    if (typeof window === "undefined") return [];
    return getOnlyCafeBranches().filter((b) => b.status === "ACTIVE");
  }, []);

  const allAccounts = useMemo(() => {
    if (typeof window === "undefined") return [];
    return getAllCafeAccounts().filter((a) => a.status === "ACTIVE");
  }, []);

  const isSingleCafe = branches.length <= 1;
  const singleCafe = isSingleCafe ? branches[0] || null : null;

  // ── Animations ──
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // ── Focus management ──
  useEffect(() => {
    if (mode === "pin") {
      pinInputRef.current?.focus();
    } else {
      usernameInputRef.current?.focus();
    }
  }, [mode]);

  // ── Clear error on mode switch ──
  const switchMode = useCallback(
    (newMode: "password" | "pin") => {
      setMode(newMode);
      setError(null);
      setSuccess(null);
      setPin("");
    },
    []
  );

  // ── Handlers ──
  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);

      if (!username.trim() || !password.trim()) {
        setError("Please enter both username and password.");
        return;
      }

      setIsSubmitting(true);
      // Tiny delay for visual feedback
      await new Promise((r) => setTimeout(r, 300));
      const result = login(username, password);
      setIsSubmitting(false);

      if (!result.success) {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    },
    [username, password, login]
  );

  const handlePinSubmit = useCallback(
    async (currentPin?: string) => {
      const pinValue = currentPin || pin;
      setError(null);
      setSuccess(null);

      if (pinValue.length !== 4) {
        setError("Please enter a complete 4-digit PIN.");
        return;
      }

      setIsSubmitting(true);
      await new Promise((r) => setTimeout(r, 300));
      const result = loginWithPin(pinValue);
      setIsSubmitting(false);

      if (!result.success) {
        setError(result.error || "Incorrect 4-digit PIN.");
        setPin("");
      }
    },
    [pin, loginWithPin]
  );

  const handlePinKeypad = useCallback(
    (key: string) => {
      if (key === "DEL") {
        setPin((prev) => prev.slice(0, -1));
        setError(null);
      } else if (key === "GO") {
        handlePinSubmit();
      } else {
        setPin((prev) => {
          if (prev.length >= 4) return prev;
          const newPin = prev + key;
          // Auto-submit on 4 digits
          if (newPin.length === 4) {
            setTimeout(() => handlePinSubmit(newPin), 150);
          }
          return newPin;
        });
        setError(null);
      }
    },
    [handlePinSubmit]
  );

  const handleQuickLogin = useCallback(
    async (account: CafeAccount) => {
      setError(null);
      setSuccess(`Signing in as ${account.cafeName.split(" - ")[1] || account.cafeName}...`);
      setUsername(account.username);
      setPassword(account.password);
      setIsSubmitting(true);
      await new Promise((r) => setTimeout(r, 400));
      const result = login(account.username, account.password);
      setIsSubmitting(false);
      if (!result.success) {
        setSuccess(null);
        setError(result.error || "Quick login failed.");
      }
    },
    [login]
  );

  // ── Render ──
  const greeting = getGreeting();
  const timeEmoji = getTimeEmoji();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* ╔═══ LEFT PANEL — Branding & Feature Showcase ═══╗ */}
      <div
        className={`hidden lg:flex lg:w-[45%] xl:w-[42%] relative overflow-hidden flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 xl:p-14 transition-all duration-700 ${
          mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
        }`}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-amber-600/5 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-amber-400/3 blur-2xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(245,158,11,0.4) 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Top: Logo & Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Coffee className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-tight">
                Chandni Chowk
              </h1>
              <p className="text-xs font-semibold text-amber-400/90 tracking-wider uppercase">
                Cheese Cafe
              </p>
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-4 mb-12">
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight">
              {isSingleCafe ? (
                <>
                  Your Cafe.
                  <br />
                  <span className="text-amber-400">Your Dashboard.</span>
                </>
              ) : (
                <>
                  Every Branch.
                  <br />
                  <span className="text-amber-400">One Command Center.</span>
                </>
              )}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {isSingleCafe
                ? "Manage orders, track kitchen workflow, generate invoices, and grow your business — all from one powerful terminal."
                : "Centralized POS management across all cafe locations. Monitor sales, manage kitchen operations, and track performance in real time."}
            </p>
          </div>
        </div>

        {/* Middle: Feature Pills */}
        <div className="relative z-10 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Monitor, label: "Live POS Terminal", desc: "Real-time orders" },
              { icon: Utensils, label: "Kitchen Display", desc: "KOT management" },
              { icon: TrendingUp, label: "Sales Analytics", desc: "Revenue insights" },
              { icon: Users, label: isSingleCafe ? "Staff Access" : "Multi-Branch", desc: isSingleCafe ? "Role-based" : "Unified control" },
            ].map((feat) => (
              <div
                key={feat.label}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                  <feat.icon className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{feat.label}</p>
                  <p className="text-[10px] text-slate-500 truncate">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Branch count or single cafe info */}
        <div className="relative z-10 mt-8">
          {isSingleCafe && singleCafe ? (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/15">
              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{singleCafe.cafeName}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {singleCafe.location.addressLine}, {singleCafe.location.city}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-slate-500 text-xs">
              <Shield className="w-3.5 h-3.5 text-amber-500/60" />
              <span>
                <span className="text-amber-400 font-bold">{branches.length}</span> active
                branches connected to the network
              </span>
            </div>
          )}
          <p className="text-[10px] text-slate-600 mt-4">
            © {new Date().getFullYear()} Chandni Chowk Cheese Cafe — Enterprise POS v2.0
          </p>
        </div>
      </div>

      {/* ╔═══ RIGHT PANEL — Login Form ═══╗ */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 xl:px-20 py-8 relative">
        {/* Mobile-only top brand */}
        <div className="lg:hidden w-full max-w-md mb-8 text-center">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-xl shadow-amber-500/20 mb-3 transition-all duration-500 ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            <Coffee className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1
            className={`text-2xl font-black tracking-tight text-slate-900 dark:text-white transition-all duration-500 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Chandni Chowk Cheese Cafe
          </h1>
          <p
            className={`text-xs text-slate-500 dark:text-slate-400 mt-1 transition-all duration-500 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {isSingleCafe ? "POS Terminal Login" : "Multi-Branch Enterprise POS"}
          </p>
        </div>

        {/* Login Card */}
        <div
          className={`w-full max-w-md transition-all duration-700 delay-200 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Greeting */}
          <div className="mb-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <span>{timeEmoji}</span> {greeting}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isSingleCafe
                ? "Sign in to access your POS terminal"
                : "Sign in to your branch or admin console"}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6 relative">
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 ease-out"
              style={{ left: mode === "password" ? "4px" : "calc(50% + 0px)" }}
            />
            <button
              type="button"
              onClick={() => switchMode("password")}
              className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors duration-200 flex items-center justify-center gap-1.5 ${
                mode === "password"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Credentials</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode("pin")}
              className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors duration-200 flex items-center justify-center gap-1.5 ${
                mode === "pin"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Quick PIN</span>
            </button>
          </div>

          {/* Card Body */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-black/30 backdrop-blur-sm">
            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-[shake_0.3s_ease-in-out]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                <span>{success}</span>
              </div>
            )}

            {/* ── PASSWORD MODE ── */}
            {mode === "password" ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Username
                    </span>
                    {isSingleCafe && singleCafe && (
                      <button
                        type="button"
                        onClick={() => {
                          setUsername(singleCafe.username);
                          setError(null);
                        }}
                        className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-medium"
                      >
                        Use default
                      </button>
                    )}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      ref={usernameInputRef}
                      type="text"
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError(null);
                      }}
                      placeholder={
                        isSingleCafe && singleCafe
                          ? singleCafe.username
                          : "e.g. admin or chandni_flagship"
                      }
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 dark:focus:ring-amber-400/40 dark:focus:border-amber-400 text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {isSingleCafe ? "Default: cafe123" : "Default: admin123 / cafe123"}
                    </span>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter password"
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 dark:focus:ring-amber-400/40 dark:focus:border-amber-400 text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none group"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ── PIN MODE ── */
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cashier Quick Access
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Enter your 4-digit PIN to sign in instantly
                  </p>
                </div>

                {/* PIN Display Dots */}
                <div className="flex justify-center gap-3 py-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all duration-200 ${
                        i < pin.length
                          ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 scale-105"
                          : i === pin.length
                          ? "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 animate-pulse"
                          : "border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40"
                      }`}
                    >
                      {i < pin.length ? "•" : ""}
                    </div>
                  ))}
                </div>

                {/* Hidden input for accessibility */}
                <input
                  ref={pinInputRef}
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setPin(val);
                    setError(null);
                    if (val.length === 4) {
                      setTimeout(() => handlePinSubmit(val), 150);
                    }
                  }}
                  className="sr-only"
                  maxLength={4}
                  inputMode="numeric"
                  aria-label="PIN input"
                />

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", "GO"].map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePinKeypad(key)}
                        disabled={key === "GO" && pin.length !== 4}
                        className={`h-14 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                          key === "GO"
                            ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1"
                            : key === "DEL"
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 flex items-center justify-center"
                            : "bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/50 text-lg font-mono shadow-sm hover:shadow"
                        }`}
                      >
                        {key === "DEL" ? (
                          <Delete className="w-4.5 h-4.5" />
                        ) : key === "GO" ? (
                          <>
                            <CornerDownLeft className="w-3.5 h-3.5" />
                            <span className="text-xs">GO</span>
                          </>
                        ) : (
                          key
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Quick Access Accounts (Multi-Cafe Mode Only) ── */}
          {!isSingleCafe && allAccounts.length > 0 && (
            <div
              className={`mt-5 transition-all duration-500 delay-400 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowQuickAccounts(!showQuickAccounts)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Quick Demo Access
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {allAccounts.length} accounts available • Click to expand
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                    showQuickAccounts ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Expandable Account List */}
              <div
                className={`overflow-hidden transition-all duration-400 ease-out ${
                  showQuickAccounts
                    ? "max-h-[600px] opacity-100 mt-2"
                    : "max-h-0 opacity-0 mt-0"
                }`}
              >
                <div className="space-y-1.5 p-1">
                  {allAccounts.map((account) => {
                    const colors = BRANCH_COLORS[account.id] || DEFAULT_COLORS;
                    const emoji = BRANCH_EMOJIS[account.id] || "🏪";
                    const isSuperAdmin = account.role === "SUPER_ADMIN";

                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => handleQuickLogin(account)}
                        disabled={isSubmitting}
                        className={`w-full text-left p-3 rounded-xl ${colors.bg} hover:ring-2 ${colors.ring} border ${colors.border} transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center text-base flex-shrink-0`}
                          >
                            {emoji}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {account.cafeName.replace("Chandni Chowk Cheese Cafe - ", "")}
                              </span>
                              {isSuperAdmin && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                  Admin
                                </span>
                              )}
                              {account.pin && !isSuperAdmin && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono bg-slate-200/80 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  PIN: {account.pin}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {isSuperAdmin
                                ? `${account.username} • Admin Monitoring Panel`
                                : `${account.username} • ${account.location.city}`}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Single Cafe: Simplified quick login ── */}
          {isSingleCafe && singleCafe && (
            <div
              className={`mt-4 transition-all duration-500 delay-400 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-sm">
                  ☕
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Default credentials
                  </p>
                  <p className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                    {singleCafe.username} / cafe123
                    {singleCafe.pin && <span className="text-slate-400"> • PIN: {singleCafe.pin}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickLogin(singleCafe)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Quick Login
                </button>
              </div>
            </div>
          )}

          {/* Security Footer */}
          <div
            className={`mt-6 text-center transition-all duration-500 delay-500 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
              <Shield className="w-3 h-3" />
              <span>Secured with local encryption • Session auto-expires</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Global Styles ── */}
      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-6px);
          }
          50% {
            transform: translateX(6px);
          }
          75% {
            transform: translateX(-3px);
          }
        }
      `}</style>
    </div>
  );
}
