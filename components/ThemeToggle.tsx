"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Placeholder to prevent hydration layout shift
    return (
      <div className={`w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse ${className}`} />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all select-none group border ${
        isDark
          ? "bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-800 hover:border-amber-500/50 shadow-sm"
          : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:border-amber-300 shadow-sm"
      } ${className}`}
      title={isDark ? "Switch to Light Mode (Day Theme)" : "Switch to Dark Mode (Night Theme)"}
      aria-label="Toggle dark and light theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform group-hover:rotate-45 duration-300 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 transition-transform group-hover:-rotate-12 duration-300 text-slate-700" />
      )}
    </button>
  );
}
