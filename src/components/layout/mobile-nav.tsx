"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  LogIn,
  Menu,
  X,
  Glasses,
  Store,
  BookOpen,
  Sun,
  User,
  LogOut,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-context";

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, role, signOut } = useAuth();

  const tabs = [
    {
      title: "Dashboard",
      href: role === "OWNER" ? "/owner" : "/staff",
      icon: LayoutDashboard,
    },
    {
      title: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
    },
    {
      title: "AI Coach",
      href: "/opticoach",
      icon: Sparkles,
    },
    {
      title: "Catalogue",
      href: "/catalogue",
      icon: Sun,
    },
    {
      title: "Library",
      href: "/library",
      icon: BookOpen,
    },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 w-full h-14 bg-white border-b border-[#E3E9EF] px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[#242629] flex items-center justify-center text-white">
            <Glasses className="h-4 w-4 text-[#FFD95E]" />
          </div>
          <span className="font-bold text-sm text-[#20242B]">
            OptiTrain<span className="text-[#9CCBFF]">.ai</span>
          </span>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="p-2 rounded-full text-[#737D8B] hover:text-[#20242B] hover:bg-[#EEF3F7] transition-colors"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 top-14 bg-[#20242B]/30 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border-b border-[#E3E9EF] p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-full bg-[#EEF3F7] border border-[#E3E9EF] text-xs font-medium text-[#20242B]">
              <div className="flex items-center gap-2 truncate">
                <Store className="h-4 w-4 text-[#20242B] shrink-0" />
                <span className="truncate">{user?.clinicId || "Apex Optical Practice"}</span>
              </div>
              {user && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[#20242B] border border-[#E3E9EF] shrink-0 font-semibold">
                  {user.role}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-1.5 pt-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname === tab.href;

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-full text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-[#242629] text-white"
                        : "text-[#737D8B] hover:text-[#20242B] hover:bg-[#EEF3F7]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4", isActive ? "text-[#FFD95E]" : "text-[#737D8B]")} />
                      <span>{tab.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#E3E9EF]">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    signOut();
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-3 text-xs font-semibold text-[#962222] rounded-full bg-[#FCE4E4] hover:bg-[#F9D0D0] transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out ({user.name})</span>
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-3 text-xs font-semibold text-[#20242B] rounded-full bg-[#FFD95E] hover:bg-[#F2CD52] transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Fixed Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E3E9EF] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-full text-[10px] font-medium transition-colors",
                isActive
                  ? "text-[#20242B] font-bold"
                  : "text-[#737D8B] hover:text-[#20242B]"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-full mb-0.5",
                  isActive ? "bg-[#242629] text-[#FFD95E]" : "text-[#737D8B]"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="truncate max-w-[60px]">{tab.title}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
