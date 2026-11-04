"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, AppRole } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  role: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string, clinicId?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  const fetchSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "Cache-Control": "no-cache" },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Session resolution error:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const signIn = async (email: string, password: string, clinicId = "apex-optics-01") => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, clinicId }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || (data.details ? data.details[0] : "Sign in failed"),
        };
      }

      setUser(data.user);

      // Route based on role (case-insensitive)
      const roleStr = String(data.user.role || "").toUpperCase();
      const targetUrl = (roleStr === "OWNER" || roleStr === "ADMIN") ? "/owner" : "/staff";
      window.location.href = targetUrl;
      return { success: true };
    } catch (error) {
      console.error("Sign-in network error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Sign-out network error:", error);
    } finally {
      setUser(null);
      window.location.href = "/sign-in";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        signIn,
        signOut,
        refreshUser: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
