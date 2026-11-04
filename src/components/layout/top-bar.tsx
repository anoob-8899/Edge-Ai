"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Glasses,
  Sparkles,
  Trophy,
  Users,
  BookOpen,
  Sun,
  LayoutDashboard,
  ClipboardList,
  Bell,
  LogOut,
  LogIn,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab");
  const { user, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isOwner = role === "OWNER";
  const homeDashboardHref = isOwner ? "/owner" : "/staff";

  const navLinks = [
    {
      label: "Dashboard",
      href: homeDashboardHref,
      isActive:
        (pathname === "/staff") ||
        (pathname === "/owner" && (!currentTab || currentTab === "overview")),
    },
    {
      label: "Leaderboard",
      href: "/leaderboard",
      isActive: pathname.startsWith("/leaderboard"),
    },
    {
      label: isOwner ? "Staff Analytics" : "My Performance",
      href: isOwner ? "/owner?tab=staff" : "/staff",
      isActive: pathname === "/owner" && currentTab === "staff",
    },
    {
      label: isOwner ? "Training Tasks" : "Assignments",
      href: isOwner ? "/owner?tab=assignments" : "/staff",
      isActive: pathname === "/owner" && currentTab === "assignments",
    },
    {
      label: "Curriculum",
      href: "/library",
      isActive: pathname.startsWith("/library"),
    },
    {
      label: "Catalogue",
      href: "/catalogue",
      isActive: pathname.startsWith("/catalogue"),
    },
    {
      label: "AI Coach",
      href: "/opticoach",
      isActive: pathname.startsWith("/opticoach"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F5F4EF]/90 backdrop-blur-md border-b border-[#E6E4DD]/80 transition-all">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Capsule (Reference 1 & 2 Style) */}
        <Link
          href="/"
          className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#E6E4DD] bg-white shadow-xs hover:border-[#FFD95E] transition-all group shrink-0"
        >
          <div className="w-7 h-7 rounded-full bg-[#292929] flex items-center justify-center text-white">
            <Glasses className="h-4 w-4 text-[#FFD95E]" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#222222]">
            OptiTrain<span className="text-[#737373] font-medium">.ai</span>
          </span>
        </Link>

        {/* Center Floating Pill Navigation Bar (Crextio Rounded Navigation) */}
        <nav className="hidden xl:flex items-center gap-1 bg-white/95 px-2 py-1.5 rounded-full border border-[#E6E4DD] shadow-xs">
          {navLinks.map((link) => {
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-150 select-none",
                  link.isActive
                    ? "bg-[#292929] text-white shadow-xs font-semibold"
                    : "text-[#737373] hover:text-[#222222] hover:bg-[#F0EFE9]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Subtle Demo Evaluation Indicator */}
          {process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true" && (
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0C2] border border-[#FFE082] text-[11px] font-semibold text-[#7A5300]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308] animate-pulse" />
              Demo Mode
            </span>
          )}

          {/* Notification Pill */}
          <button
            type="button"
            title="Notifications"
            className="w-9 h-9 rounded-full bg-white border border-[#E6E4DD] flex items-center justify-center text-[#737373] hover:text-[#222222] hover:bg-[#F0EFE9] transition-colors relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FFD95E]" />
          </button>

          {/* AI Coach Fast-Pill */}
          {!pathname.startsWith("/opticoach") && (
            <Link href="/opticoach" className="hidden sm:inline-flex">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFD95E] hover:bg-[#F2CD52] text-[#222222] text-xs font-bold transition-all shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Coach</span>
              </span>
            </Link>
          )}

          {/* User Account Controls */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E6E4DD] text-xs">
                <span className="w-2 h-2 rounded-full bg-[#8CE071]" />
                <span className="font-semibold text-[#222222] truncate max-w-[120px]">
                  {user.name.split(" ")[0]}
                </span>
                <span className="text-[10px] uppercase font-bold text-[#737373] px-2 py-0.5 rounded-full bg-[#F0EFE9]">
                  {role}
                </span>
              </div>

              <button
                type="button"
                onClick={() => signOut()}
                title="Sign Out"
                className="w-9 h-9 rounded-full bg-white border border-[#E6E4DD] flex items-center justify-center text-[#991B1B] hover:bg-[#FEE2E2] hover:border-[#FECACA] transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link href="/sign-in">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#292929] hover:bg-[#3d3d3d] text-white text-xs font-semibold shadow-xs">
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </span>
            </Link>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden w-9 h-9 rounded-full bg-white border border-[#E6E4DD] flex items-center justify-center text-[#222222] hover:bg-[#F0EFE9]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-[#E6E4DD] px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors",
                link.isActive
                  ? "bg-[#292929] text-white font-semibold"
                  : "text-[#737373] hover:bg-[#F0EFE9] hover:text-[#222222]"
              )}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <div className="pt-2 border-t border-[#E6E4DD] flex items-center justify-between text-xs text-[#737373] px-2">
              <span>Signed in as <strong className="text-[#222222]">{user.name}</strong> ({role})</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="text-[#991B1B] font-semibold"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
