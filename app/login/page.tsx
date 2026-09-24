"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Coffee,
  Shield,
  KeyRound,
  Store,
  User,
  Lock,
  ArrowRight,
  Sparkles,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { INITIAL_CAFE_ACCOUNTS } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPin } = useAuth();

  const [mode, setMode] = useState<"password" | "pin">("password");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setIsSubmitting(true);
    const result = login(username, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Login failed. Please check your credentials.");
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin.length !== 4) {
      setError("Please enter a 4-digit PIN.");
      return;
    }

    setIsSubmitting(true);
    const result = loginWithPin(pin);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Incorrect 4-digit PIN.");
    }
  };

  const handleQuickLogin = (userCred: { user: string; pass: string }) => {
    setError(null);
    setUsername(userCred.user);
    setPassword(userCred.pass);
    setIsSubmitting(true);
    const result = login(userCred.user, userCred.pass);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || "Quick login failed.");
    }
  };

  return (
    <div className="min-h-full flex-1 flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      <div className="w-full max-w-md space-y-6">
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-xl shadow-amber-500/20 mb-2">
            <Coffee className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Chandni Chowk Cheese Cafe
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Multi-Branch Enterprise POS &amp; Central Management Network
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/40">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === "password"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Username &amp; Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("pin");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === "pin"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Cashier Quick PIN</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === "password" ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or chandni_cp"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 text-slate-900 dark:text-white transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">Default: admin123 / cafe123</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 text-slate-900 dark:text-white transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
              >
                <span>{isSubmitting ? "Signing In..." : "Sign In to Terminal"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  Enter 4-Digit Cashier PIN
                </label>
                <div className="flex justify-center mb-4">
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    className="w-48 text-center text-3xl tracking-[0.5em] py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white shadow-inner"
                    autoFocus
                  />
                </div>

                {/* Numeric Keypad for fast PIN input */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (key === "C") {
                          setPin("");
                        } else if (key === "OK") {
                          if (pin.length === 4) {
                            handlePinSubmit({ preventDefault: () => {} } as React.FormEvent);
                          }
                        } else {
                          if (pin.length < 4) {
                            const newPin = pin + key;
                            setPin(newPin);
                            if (newPin.length === 4) {
                              setIsSubmitting(true);
                              const res = loginWithPin(newPin);
                              setIsSubmitting(false);
                              if (!res.success) {
                                setError(res.error || "Incorrect PIN.");
                              }
                            }
                          }
                        }
                      }}
                      className={`h-12 rounded-xl text-sm font-bold font-mono transition-all active:scale-95 ${
                        key === "OK"
                          ? "bg-amber-600 text-white hover:bg-amber-500"
                          : key === "C"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-200"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60"
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* Quick Demo Logins Divider */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                1-Click Fast Demo Accounts
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Click to login</span>
            </div>

            <div className="space-y-2">
              {/* Super Admin HQ */}
              <button
                type="button"
                onClick={() => handleQuickLogin({ user: "admin", pass: "admin123" })}
                className="w-full text-left p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    👑
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Super Admin (Central HQ)</span>
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-amber-600 text-white font-semibold">
                        Master Access
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      admin / admin123 • Opens Admin Monitoring Panel
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Flagship Old Delhi */}
              <button
                type="button"
                onClick={() => handleQuickLogin({ user: "chandni_flagship", pass: "cafe123" })}
                className="w-full text-left p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    ☕
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Flagship Old Delhi</span>
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        PIN: 1122
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      chandni_flagship / cafe123 • Chandni Chowk
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Connaught Place */}
              <button
                type="button"
                onClick={() => handleQuickLogin({ user: "chandni_cp", pass: "cafe123" })}
                className="w-full text-left p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                    🏢
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Connaught Place Branch</span>
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        PIN: 2233
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      chandni_cp / cafe123 • Inner Circle CP
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Cyber Hub Gurugram */}
              <button
                type="button"
                onClick={() => handleQuickLogin({ user: "chandni_gurgaon", pass: "cafe123" })}
                className="w-full text-left p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                    🏙️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Cyber Hub Gurugram</span>
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        PIN: 3344
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      chandni_gurgaon / cafe123 • DLF Phase 2
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature highlight footer */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            Centralized Multi-Store Architecture
          </p>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Super Admin can monitor live sales, orders, and active KOT tickets across all cafe locations, create new branch accounts with location details, and switch store access in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
