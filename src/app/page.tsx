"use client";

import * as React from "react";
import Link from "next/link";
import {
  Glasses,
  Sparkles,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  ArrowRight,
  BookOpen,
  Sun,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  UserCheck,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-context";

export default function HomePage() {
  const { user, role } = useAuth();

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#20242B] selection:bg-[#DCEEFF] selection:text-[#20242B] relative overflow-hidden flex flex-col justify-between">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-[-8%] left-1/2 -translate-x-1/2 w-[900px] h-[460px] rounded-full bg-gradient-to-b from-[#DCEEFF]/40 to-transparent blur-3xl pointer-events-none" />

      {/* Navigation Bar */}
      <header className="relative z-10 w-full border-b border-[#E3E9EF] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-[14px] bg-[#242629] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Glasses className="h-5 w-5 text-[#FFD95E]" />
            </div>
            <div>
              <span className="font-bold text-lg text-[#20242B] tracking-tight">
                OptiTrain<span className="text-[#9CCBFF]">.ai</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-[#737D8B]">
                • Optical Sales Coach & Training
              </span>
            </div>
          </Link>

          {/* Nav Links & Actions */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/library" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" pill className="text-xs">
                <BookOpen className="h-3.5 w-3.5 text-[#20242B]" />
                <span>Curriculum</span>
              </Button>
            </Link>

            <Link href="/catalogue" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm" pill className="text-xs">
                <Sun className="h-3.5 w-3.5 text-[#20242B]" />
                <span>Catalogue</span>
              </Button>
            </Link>

            <Link href="/leaderboard" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm" pill className="text-xs">
                <Trophy className="h-3.5 w-3.5 text-[#20242B]" />
                <span>Leaderboard</span>
              </Button>
            </Link>

            {user ? (
              <Link href={role === "OWNER" ? "/owner" : "/staff"}>
                <Button variant="outline" size="sm" pill className="text-xs">
                  <UserCheck className="h-3.5 w-3.5 text-[#225414]" />
                  <span>{user.name.split(" ")[0]} ({role})</span>
                </Button>
              </Link>
            ) : (
              <Link href="/sign-in">
                <Button variant="outline" size="sm" pill className="text-xs">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}

            <Link href="/opticoach">
              <Button variant="yellow" size="sm" pill className="text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Coach Studio</span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Hero & Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16 flex-1">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E3E9EF] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#FFD95E] animate-pulse" />
            <span className="text-xs font-bold text-[#20242B] tracking-wide uppercase">
              AI Sales Coach & Optical Staff Training
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#20242B] tracking-tight leading-[1.12]">
            Build Better Conversations.{" "}
            <span className="text-[#20242B] relative inline-block">
              Deliver Better Service.
              <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#FFD95E]/60 -z-10 rounded-full" />
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#737D8B] leading-relaxed max-w-2xl mx-auto font-normal">
            A premium sales coaching and performance improvement platform for optical retail teams.
            Empower opticians and dispensers to master progressive lens adaptation,
            high-index recommendations, and customer price objections through realistic AI simulations.
          </p>

          {/* Prominent CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link href="/opticoach">
              <Button variant="yellow" size="lg" pill className="text-sm px-6 font-bold">
                <Sparkles className="h-4 w-4" />
                <span>Launch AI Coach</span>
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="dark" size="lg" pill className="text-sm px-6">
                <Trophy className="h-4 w-4 text-[#FFD95E]" />
                <span>View Leaderboard</span>
              </Button>
            </Link>
            <Link href="/library">
              <Button variant="outline" size="lg" pill className="text-sm px-6">
                <BookOpen className="h-4 w-4 text-[#20242B]" />
                <span>Explore Curriculum</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Value Highlights Pill Bar */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="flex items-center gap-3 p-4 rounded-[16px] bg-white border border-[#E3E9EF] shadow-xs">
            <div className="w-9 h-9 rounded-full bg-[#EEF3F7] text-[#20242B] flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-[#20242B]">Clinical Scenarios</div>
              <div className="text-[#737D8B]">Presbyopes, High-Myopia, Sunglass specs</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-[16px] bg-white border border-[#E3E9EF] shadow-xs">
            <div className="w-9 h-9 rounded-full bg-[#DDF4CF] text-[#225414] flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-[#20242B]">Grounded Knowledge</div>
              <div className="text-[#737D8B]">Verified product science & lens specs</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-[16px] bg-white border border-[#E3E9EF] shadow-xs">
            <div className="w-9 h-9 rounded-full bg-[#FFF0C2] text-[#7A5300] flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-[#20242B]">Objective Rubric Scoring</div>
              <div className="text-[#737D8B]">Turn-by-turn insights & competency metrics</div>
            </div>
          </div>
        </div>

        {/* 3 Core Experience Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Pillar 1: AI Sales Practice */}
          <div className="bg-white border border-[#E3E9EF] rounded-[20px] p-6 hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EEF3F7] flex items-center justify-center text-[#20242B]">
                <Sparkles className="h-6 w-6 text-[#FFD95E]" />
              </div>
              <div>
                <Badge variant="yellow" size="sm" className="mb-2">
                  Simulation Studio
                </Badge>
                <h3 className="text-lg font-bold text-[#20242B]">AI Sales Practice</h3>
              </div>
              <p className="text-xs leading-relaxed text-[#737D8B]">
                Conduct interactive consultations with simulated customer personas.
                Practice active listening, lifestyle discovery, and overcome hesitation
                around progressive designs and high-index materials without customer risk.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E3E9EF]">
              <Link
                href="/opticoach"
                className="text-xs font-bold text-[#20242B] inline-flex items-center gap-1.5 hover:underline"
              >
                <span>Launch simulation studio</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Pillar 2: Staff Learning & Progress */}
          <div className="bg-white border border-[#E3E9EF] rounded-[20px] p-6 hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EEF3F7] flex items-center justify-center text-[#20242B]">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="secondary" size="sm" className="mb-2">
                  Staff Workspace
                </Badge>
                <h3 className="text-lg font-bold text-[#20242B]">Staff Learning & Progress</h3>
              </div>
              <p className="text-xs leading-relaxed text-[#737D8B]">
                Access structured dispensing curricula, verified sunglasses catalogues,
                and self-paced knowledge checks. Review assigned modules, earned points,
                and competency feedback in one unified workspace.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E3E9EF]">
              <Link
                href="/staff"
                className="text-xs font-bold text-[#20242B] inline-flex items-center gap-1.5 hover:underline"
              >
                <span>Open staff dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Pillar 3: Owner Insights */}
          <div className="bg-white border border-[#E3E9EF] rounded-[20px] p-6 hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EEF3F7] flex items-center justify-center text-[#20242B]">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="secondary" size="sm" className="mb-2">
                  Practice Operations
                </Badge>
                <h3 className="text-lg font-bold text-[#20242B]">Owner Insights</h3>
              </div>
              <p className="text-xs leading-relaxed text-[#737D8B]">
                Review practice-wide engagement metrics, track staff module completion,
                dispatch targeted training assignments, and approve catalogued frame and lens models
                with strict role-based access control.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E3E9EF]">
              <Link
                href="/owner"
                className="text-xs font-bold text-[#20242B] inline-flex items-center gap-1.5 hover:underline"
              >
                <span>Access owner hub</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Editorial Footer */}
      <footer className="relative z-10 w-full border-t border-[#E3E9EF] bg-white py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737D8B]">
          <div className="flex items-center gap-2">
            <Glasses className="h-4 w-4 text-[#20242B]" />
            <span className="font-bold text-[#20242B]">OptiTrain.ai (Edge AI)</span>
            <span>• Optical Retail Staff Training & Sales Coaching Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/leaderboard" className="hover:text-[#20242B] transition-colors">
              Leaderboard
            </Link>
            <Link href="/library" className="hover:text-[#20242B] transition-colors">
              Library
            </Link>
            <Link href="/catalogue" className="hover:text-[#20242B] transition-colors">
              Catalogue
            </Link>
            <Link href="/opticoach" className="hover:text-[#20242B] transition-colors">
              AI Coach
            </Link>
            <Link href="/sign-in" className="hover:text-[#20242B] transition-colors">
              Staff Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
