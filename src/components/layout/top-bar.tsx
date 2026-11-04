"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  ChevronRight,
  LogOut,
  LogIn,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-context";

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const pathname = usePathname();
  const { user, role, signOut } = useAuth();

  const getBreadcrumb = () => {
    if (pathname.startsWith("/opticoach")) {
      return { section: "Sales Simulator", current: "AI Coach" };
    }
    if (pathname.startsWith("/staff")) {
      return { section: "Staff Training", current: "My Dashboard" };
    }
    if (pathname.startsWith("/owner")) {
      return { section: "Operations", current: "Owner Hub" };
    }
    if (pathname.startsWith("/leaderboard")) {
      return { section: "Gamification", current: "Leaderboard" };
    }
    if (pathname.startsWith("/library")) {
      return { section: "Curriculum", current: "Learning Library" };
    }
    if (pathname.startsWith("/catalogue")) {
      return { section: "Dispensing Inventory", current: "Product Catalogue" };
    }
    return { section: "Platform", current: "Overview" };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="sticky top-0 z-20 w-full h-16 bg-white border-b border-[#E3E9EF] px-4 md:px-8 flex items-center justify-between">
      {/* Breadcrumb & Section Info */}
      <div className="flex items-center gap-2 text-xs md:text-sm">
        <span className="text-[#737D8B] hidden sm:inline">
          {breadcrumb.section}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-[#737D8B] hidden sm:inline" />
        <span className="font-semibold text-[#20242B] truncate">
          {title || breadcrumb.current}
        </span>
        {subtitle && (
          <span className="text-xs text-[#737D8B] hidden xl:inline">
            • {subtitle}
          </span>
        )}
      </div>

      {/* Right Action Icons & Direct Shortcuts */}
      <div className="flex items-center gap-2.5">
        <Link href="/leaderboard" className="hidden sm:inline-flex">
          <Button variant="secondary" size="sm" pill>
            <Trophy className="h-3.5 w-3.5 text-[#737D8B]" />
            <span className="text-xs">Leaderboard</span>
          </Button>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF3F7] border border-[#E3E9EF] text-xs text-[#737D8B]">
              <span className="w-2 h-2 rounded-full bg-[#8CE071]" />
              <span className="font-semibold text-[#20242B]">{user.name}</span>
              <span className="text-[10px] uppercase font-bold text-[#20242B] px-1.5 py-0.5 rounded-full bg-white border border-[#E3E9EF]">
                {role}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              pill
              onClick={() => signOut()}
              className="text-[#962222] hover:bg-[#FCE4E4] hover:border-[#F7C5C5]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        ) : (
          <Link href="/sign-in">
            <Button variant="dark" size="sm" pill>
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Button>
          </Link>
        )}

        {!pathname.startsWith("/opticoach") && (
          <Link href="/opticoach">
            <Button variant="yellow" size="sm" pill className="hidden sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Coach</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
