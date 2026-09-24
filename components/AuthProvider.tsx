"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CafeAccount, AuthSession } from "@/lib/types";
import {
  getSession,
  getCurrentUser,
  isSuperAdmin as checkIsSuperAdmin,
  login as authLogin,
  loginWithPin as authLoginWithPin,
  logout as authLogout,
  switchActiveCafe as authSwitchActiveCafe,
  getActiveCafe,
  getActiveCafeId,
  getAllCafeAccounts,
} from "@/lib/auth";

interface AuthContextType {
  user: CafeAccount | null;
  session: AuthSession | null;
  isSuperAdmin: boolean;
  activeCafe: CafeAccount | null;
  activeCafeId: string;
  allCafes: CafeAccount[];
  isLoading: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  loginWithPin: (pin: string) => { success: boolean; error?: string };
  logout: () => void;
  switchCafe: (cafeId: string) => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<CafeAccount | null>(null);
  const [activeCafe, setActiveCafe] = useState<CafeAccount | null>(null);
  const [activeCafeId, setActiveCafeIdState] = useState<string>("cafe-delhi-flagship");
  const [allCafes, setAllCafes] = useState<CafeAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAuth = () => {
    try {
      const sess = getSession();
      const currUser = getCurrentUser();
      const activeId = getActiveCafeId();
      const currentActive = getActiveCafe();
      const cafes = getAllCafeAccounts();

      setSession(sess);
      setUser(currUser);
      setActiveCafeIdState(activeId);
      setActiveCafe(currentActive);
      setAllCafes(cafes);
    } catch (e) {
      console.error("Error refreshing auth:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();

    const handleAuthChange = () => {
      refreshAuth();
    };

    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  // Protected route checking
  useEffect(() => {
    if (isLoading) return;

    const isPublicBill = pathname.startsWith("/bill/");
    const isLoginPage = pathname === "/login";

    // If not logged in and not on a public receipt, redirect to login
    if (!user && !isLoginPage && !isPublicBill) {
      router.push("/login");
      return;
    }

    // If logged in and on login page, redirect to appropriate destination
    if (user && isLoginPage) {
      if (user.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/pos");
      }
      return;
    }

    // Role check: Only Super Admin can access /admin
    if (pathname.startsWith("/admin") && user && user.role !== "SUPER_ADMIN") {
      router.push("/pos");
    }
  }, [user, isLoading, pathname, router]);

  const handleLogin = (username: string, password: string) => {
    const res = authLogin(username, password);
    if (res.success && res.session) {
      refreshAuth();
      if (res.session.user.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/pos");
      }
      return { success: true };
    }
    return { success: false, error: res.error || "Authentication failed" };
  };

  const handleLoginWithPin = (pin: string) => {
    const res = authLoginWithPin(pin);
    if (res.success && res.session) {
      refreshAuth();
      if (res.session.user.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/pos");
      }
      return { success: true };
    }
    return { success: false, error: res.error || "Invalid PIN" };
  };

  const handleLogout = () => {
    authLogout();
    refreshAuth();
    router.push("/login");
  };

  const handleSwitchCafe = (cafeId: string) => {
    authSwitchActiveCafe(cafeId);
    refreshAuth();
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isSuperAdmin: checkIsSuperAdmin(),
        activeCafe,
        activeCafeId,
        allCafes,
        isLoading,
        login: handleLogin,
        loginWithPin: handleLoginWithPin,
        logout: handleLogout,
        switchCafe: handleSwitchCafe,
        refreshAuth,
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
