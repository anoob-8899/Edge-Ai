"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Glasses,
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Sun,
  Trophy,
  Users,
  TrendingUp,
  ClipboardList,
  ShieldCheck,
  Award,
  ChevronRight,
  LogOut,
  User,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-context";

export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab");
  const { user, role, signOut, isLoading } = useAuth();
  const isOwner = role === "OWNER";

  // Owner specific navigation
  const ownerNavItems = [
    {
      title: "Overview",
      href: "/owner",
      icon: LayoutDashboard,
      active: pathname === "/owner" && (!currentTab || currentTab === "overview"),
    },
    {
      title: "Staff Analytics",
      href: "/owner?tab=staff",
      icon: Users,
      badge: "Profiles",
      active: pathname === "/owner" && currentTab === "staff",
    },
    {
      title: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
      badge: "Rankings",
      badgeHighlight: true,
      active: pathname === "/leaderboard",
    },
    {
      title: "Training Tasks",
      href: "/owner?tab=assignments",
      icon: ClipboardList,
      active: pathname === "/owner" && currentTab === "assignments",
    },
    {
      title: "Product Knowledge",
      href: "/catalogue",
      icon: Sun,
      badge: "Specs",
      active: pathname.startsWith("/catalogue"),
    },
    {
      title: "AI Coach Studio",
      href: "/opticoach",
      icon: Sparkles,
      badge: "Simulator",
      active: pathname.startsWith("/opticoach"),
    },
    {
      title: "Performance Reports",
      href: "/owner?tab=reports",
      icon: TrendingUp,
      active: pathname === "/owner" && (currentTab === "reports" || currentTab === "assessments"),
    },
    {
      title: "Audit & Security",
      href: "/owner?tab=audit",
      icon: ShieldCheck,
      active: pathname === "/owner" && currentTab === "audit",
    },
  ];

  // Staff specific navigation
  const staffNavItems = [
    {
      title: "My Dashboard",
      href: "/staff",
      icon: LayoutDashboard,
      active: pathname === "/staff",
    },
    {
      title: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
      badge: "Points",
      badgeHighlight: true,
      active: pathname === "/leaderboard",
    },
    {
      title: "Optical Library",
      href: "/library",
      icon: BookOpen,
      badge: "Curriculum",
      active: pathname.startsWith("/library"),
    },
    {
      title: "Product Catalogue",
      href: "/catalogue",
      icon: Sun,
      badge: "Specs",
      active: pathname.startsWith("/catalogue"),
    },
    {
      title: "AI Coach",
      href: "/opticoach",
      icon: Sparkles,
      badge: "Practice",
      active: pathname.startsWith("/opticoach"),
    },
  ];

  const navItems = isOwner ? ownerNavItems : staffNavItems;

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-64 lg:w-72 border-r border-[#E3E9EF] bg-white sticky top-0 h-screen z-30 transition-all select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E3E9EF] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-[14px] bg-[#242629] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Glasses className="h-5 w-5 text-[#FFD95E]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-[#20242B] tracking-tight">
                OptiTrain<span className="text-[#9CCBFF]">.ai</span>
              </span>
            </div>
            <p className="text-[11px] text-[#737D8B] font-medium leading-none mt-0.5">
              Edge AI • Optical Training
            </p>
          </div>
        </Link>
      </div>

      {/* Practice Clinic Pill */}
      <div className="px-4 py-2.5 mx-4 my-3 rounded-full bg-[#EEF3F7] border border-[#E3E9EF] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8CE071]" />
          <span className="text-xs font-semibold text-[#20242B] truncate max-w-[130px]">
            {user?.clinicId || "Apex Optical Lab"}
          </span>
        </div>
        <span className="text-[10px] font-mono font-semibold text-[#20242B] px-2 py-0.5 rounded-full bg-white border border-[#E3E9EF]">
          {isOwner ? "OWNER" : "STAFF"}
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[11px] font-semibold text-[#737D8B] uppercase tracking-wider">
          {isOwner ? "Practice Operations" : "Learning Workspace"}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between p-2.5 rounded-full md:rounded-[14px] text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[#242629] text-white shadow-xs"
                  : "text-[#737D8B] hover:text-[#20242B] hover:bg-[#EEF3F7]"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isActive
                      ? "bg-white/10 text-[#FFD95E]"
                      : "bg-[#EEF3F7] text-[#737D8B] group-hover:bg-white group-hover:text-[#20242B]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-left">
                  <div className={cn("font-semibold text-xs lg:text-sm truncate", isActive ? "text-white" : "text-[#20242B]")}>
                    {item.title}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0",
                    item.badgeHighlight
                      ? "bg-[#FFD95E] text-[#20242B] font-semibold"
                      : isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#EEF3F7] text-[#737D8B]"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Profile & Auth Control */}
      <div className="p-4 border-t border-[#E3E9EF] space-y-3 bg-[#F4F7FA]">
        <div className="flex items-center justify-between p-2.5 rounded-[14px] bg-white border border-[#E3E9EF]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#EEF3F7] border border-[#E3E9EF] flex items-center justify-center text-[#20242B] font-semibold text-xs shrink-0">
              {user ? user.name.slice(0, 2).toUpperCase() : "OP"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#20242B] truncate">
                {isLoading ? "Loading..." : user ? user.name : "Staff Member"}
              </div>
              <div className="text-[10px] text-[#737D8B] font-mono truncate">
                {user ? user.role : "Guest"}
              </div>
            </div>
          </div>
          <Link
            href="/sign-in"
            aria-label="Switch account"
            className="p-1.5 rounded-full text-[#737D8B] hover:text-[#20242B] hover:bg-[#EEF3F7] transition-colors shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {user ? (
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-medium text-[#962222] hover:text-red-700 rounded-full hover:bg-[#FCE4E4] transition-colors border border-transparent"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out Session</span>
          </button>
        ) : (
          <Link
            href="/sign-in"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold text-[#20242B] rounded-full bg-[#FFD95E] hover:bg-[#F2CD52] transition-colors text-center"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign In to Practice</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
