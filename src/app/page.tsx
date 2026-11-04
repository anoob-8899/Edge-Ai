"use client";

import * as React from "react";
import Link from "next/link";
import {
  Glasses,
  Sparkles,
  GraduationCap,
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
import { TopBar } from "@/components/layout/top-bar";

export default function HomePage() {
  const { user, role } = useAuth();

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#222222] selection:bg-[#FFD95E]/40 selection:text-[#222222] flex flex-col justify-between">
      {/* Top Floating Pill Navigation */}
      <React.Suspense fallback={<div className="h-20 bg-[#F5F4EF] border-b border-[#E6E4DD]" />}>
        <TopBar />
      </React.Suspense>

      {/* Main Hero & Content (Editorial Proportions & Authority) */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16 flex-1 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E6E4DD] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#FFD95E]" />
            <span className="text-xs font-bold text-[#222222] tracking-wide uppercase">
              Optical Staff Training & AI Coaching Platform
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#222222] tracking-tight leading-[1.08]">
            Master Clinical Conversations.{" "}
            <span className="relative inline-block">
              Deliver Premium Care.
              <span className="absolute bottom-2 left-0 right-0 h-3 bg-[#FFD95E]/50 -z-10 rounded-full" />
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#737373] leading-relaxed max-w-2xl mx-auto font-normal">
            A refined sales coaching and dispensing performance improvement platform for luxury optical retail boutiques.
            Empower opticians to conquer progressive lens adaptation, high-index materials, and price objections through grounded AI simulation.
          </p>

          {/* Prominent CTAs (Pill-shaped, warm yellow & charcoal) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link href="/opticoach">
              <Button variant="yellow" size="lg" pill className="text-sm px-7 font-bold shadow-sm">
                <Sparkles className="h-4 w-4" />
                <span>Launch AI Coach Studio</span>
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="dark" size="lg" pill className="text-sm px-7 font-semibold shadow-xs">
                <Trophy className="h-4 w-4 text-[#FFD95E]" />
                <span>View Leaderboard</span>
              </Button>
            </Link>
            <Link href="/catalogue">
              <Button variant="outline" size="lg" pill className="text-sm px-7 font-medium shadow-xs">
                <Sun className="h-4 w-4 text-[#222222]" />
                <span>Eyewear Catalogue</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Value Highlights (Clean White Rounded Cards) */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-[#E6E4DD] shadow-xs">
            <div className="w-10 h-10 rounded-full bg-[#F0EFE9] text-[#222222] flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-[#255217]" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-[#222222]">Clinical Scenarios</div>
              <div className="text-[#737373]">Progressives, High-Myopia, Luxury styling</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-[#E6E4DD] shadow-xs">
            <div className="w-10 h-10 rounded-full bg-[#EAF5D5] text-[#255217] flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-[#222222]">Grounded Knowledge</div>
              <div className="text-[#737373]">Verified lens science & brand archetypes</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-[#E6E4DD] shadow-xs">
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#92400E] flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-[#222222]">Objective 6-Criterion Scoring</div>
              <div className="text-[#737373]">Turn-by-turn insights & audited progress</div>
            </div>
          </div>
        </div>

        {/* 3 Core Experience Pillars (White Rounded Cards, Generous Padding) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Pillar 1 */}
          <div className="bg-white border border-[#E6E4DD] rounded-[28px] p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-[#292929] flex items-center justify-center text-[#FFD95E]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                  Simulation Studio
                </span>
                <h3 className="text-xl font-bold text-[#222222] mt-2">AI Sales Practice</h3>
              </div>
              <p className="text-xs leading-relaxed text-[#737373]">
                Conduct live consultations with simulated customer personas. Practice active listening, lifestyle discovery, and overcome hesitation around progressive designs and high-index materials without customer churn risk.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E6E4DD]/60">
              <Link
                href="/opticoach"
                className="text-xs font-bold text-[#222222] inline-flex items-center gap-1.5 hover:underline"
              >
                <span>Launch simulation arena</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white border border-[#E6E4DD] rounded-[28px] p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-[#F0EFE9] flex items-center justify-center text-[#222222]">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F0EFE9] text-[#737373]">
                  Staff Workspace
                </span>
                <h3 className="text-xl font-bold text-[#222222] mt-2">Personal Mastery</h3>
              </div>
              <p className="text-xs leading-relaxed text-[#737373]">
                Structured optical dispensing modules, technical quizzes, and weekly practice missions. Track personal tier progression and earn verified CE dispensing points.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E6E4DD]/60">
              <Link
                href={user ? "/staff" : "/sign-in"}
                className="text-xs font-bold text-[#222222] inline-flex items-center gap-1.5 hover:underline"
              >
                <span>Enter staff training portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white border border-[#E6E4DD] rounded-[28px] p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-[#292929] flex items-center justify-center text-white">
                <Sun className="h-6 w-6 text-[#FFD95E]" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EAF5D5] text-[#255217]">
                  Inventory Dossier
                </span>
                <h3 className="text-xl font-bold text-[#222222] mt-2">Product Library</h3>
              </div>
              <p className="text-xs leading-relaxed text-[#737373]">
                Comprehensive technical dossier covering 12 premier brand portfolios, frame geometries, hinge mechanisms, and polarized lens dispensing guidelines without retail price distractions.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E6E4DD]/60">
              <Link
                href="/catalogue"
                className="text-xs font-bold text-[#222222] inline-flex items-center gap-1.5 hover:underline"
              >
                <span>Explore eyewear catalogue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#E6E4DD] bg-white py-6">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737373]">
          <div className="flex items-center gap-2">
            <Glasses className="h-4 w-4 text-[#222222]" />
            <span className="font-bold text-[#222222]">OptiTrain.ai</span>
            <span>• Enterprise Optical Staff Training</span>
          </div>
          <div>
            <span>Strict Zero-Price Educational System • All Rights Reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
