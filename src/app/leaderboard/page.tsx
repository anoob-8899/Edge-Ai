"use client";

import * as React from "react";
import Link from "next/link";
import {
  Trophy,
  Search,
  Award,
  Sparkles,
  CheckCircle2,
  Building2,
  Users,
  Target,
  ChevronDown,
  Plus,
  SlidersHorizontal,
  Download,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StaffAvatar } from "@/components/shared/staff-avatar";
import { useAuth } from "@/components/auth/auth-context";

interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  clinicId: string;
  totalPoints: number;
  recentPoints: number;
  challengesCompleted: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  simulationsCompleted: number;
  tier: {
    tierName: string;
    level: number;
    nextTierThreshold: number;
    progressPercent: number;
  };
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([]);
  const [myStanding, setMyStanding] = React.useState<LeaderboardEntry | null>(null);
  const [totalParticipants, setTotalParticipants] = React.useState(0);
  const [isDemoData, setIsDemoData] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters state
  const [period, setPeriod] = React.useState<"week" | "month" | "all">("month");
  const [selectedBranch, setSelectedBranch] = React.useState<string>("all");
  const [selectedTier, setSelectedTier] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

  const fetchLeaderboard = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/staff/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setIsDemoData(Boolean(data.isDemoData));
        setMyStanding(data.myStanding || null);
        setTotalParticipants(data.totalParticipants || (data.leaderboard ? data.leaderboard.length : 0));
        if (data.myStanding) {
          setSelectedUserId(data.myStanding.userId);
        } else if (data.leaderboard?.length > 0) {
          setSelectedUserId(data.leaderboard[0].userId);
        }
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const branches = React.useMemo(() => {
    const list = Array.from(new Set(leaderboard.map((e) => e.clinicId).filter(Boolean)));
    return ["all", ...list];
  }, [leaderboard]);

  const tiers = React.useMemo(() => {
    const list = Array.from(new Set(leaderboard.map((e) => e.tier?.tierName).filter(Boolean)));
    return ["all", ...list];
  }, [leaderboard]);

  const filteredLeaderboard = React.useMemo(() => {
    return leaderboard.filter((entry) => {
      const matchesSearch =
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.clinicId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBranch = selectedBranch === "all" || entry.clinicId === selectedBranch;
      const matchesTier = selectedTier === "all" || entry.tier?.tierName === selectedTier;
      return matchesSearch && matchesBranch && matchesTier;
    });
  }, [leaderboard, searchQuery, selectedBranch, selectedTier]);

  const sortedLeaderboard = React.useMemo(() => {
    return [...filteredLeaderboard].sort((a, b) => {
      if (period === "week") {
        return (b.recentPoints || 0) - (a.recentPoints || 0);
      }
      return b.totalPoints - a.totalPoints;
    });
  }, [filteredLeaderboard, period]);

  const totalVerifiedPoints = leaderboard.reduce((acc, curr) => acc + curr.totalPoints, 0);
  const avgCompletion = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((acc, curr) => acc + (curr.tier.progressPercent || 0), 0) / leaderboard.length)
    : 0;

  return (
    <AppShell
      title="Staff Performance Leaderboard"
      subtitle="Audited dispensing points, weekly rankings & team mastery"
    >
      <div className="space-y-6">
        {/* Top Header Section (Reference 1 Composition: Large Heading + Segmented Metric Bar + Actions) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#222222]">
              People & Performance
            </h1>
            
            {/* Segmented Progress Metric Pill Bar (Faithful to Reference 1) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#292929] text-white text-xs font-semibold shadow-xs">
                <span className="text-gray-400 font-normal">Active Staff</span>
                <span>{totalParticipants || leaderboard.length}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FFD95E] text-[#222222] text-xs font-bold shadow-xs">
                <span>Avg Mastery</span>
                <span>{avgCompletion}%</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E6E4DD] text-xs font-medium text-[#737373]">
                <span>Total Points</span>
                <span className="font-semibold text-[#222222]">{totalVerifiedPoints.toLocaleString()}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0EFE9] border border-[#E6E4DD] text-xs font-medium text-[#737373]">
                <span>Timeline</span>
                <span className="font-semibold text-[#222222] capitalize">{period}</span>
              </div>
            </div>
          </div>

          {/* Right Action Pills (Reference 1) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
            {/* Timeline Filter Pill Dropdown */}
            <div className="flex items-center bg-white border border-[#E6E4DD] rounded-full p-1 shadow-xs">
              <button
                onClick={() => setPeriod("week")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  period === "week" ? "bg-[#292929] text-white" : "text-[#737373] hover:text-[#222222]"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPeriod("month")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  period === "month" ? "bg-[#292929] text-white" : "text-[#737373] hover:text-[#222222]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPeriod("all")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  period === "all" ? "bg-[#292929] text-white" : "text-[#737373] hover:text-[#222222]"
                }`}
              >
                All-Time
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const csvData = sortedLeaderboard.map((e, idx) => `${idx + 1},${e.name},${e.clinicId},${e.totalPoints}`).join("\n");
                const blob = new Blob([`Rank,Name,Clinic,Points\n${csvData}`], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `optitrain-leaderboard-${period}.csv`;
                a.click();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E6E4DD] text-xs font-medium text-[#222222] hover:bg-[#F0EFE9] transition-all shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-[#737373]" />
              <span>Export</span>
            </button>

            <Link href="/opticoach">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FFD95E] hover:bg-[#F2CD52] text-[#222222] text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Simulate Practice</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Main Ranking Table Card Container (Reference 1: Spacious White Rounded Container with Internal Filters) */}
        <div className="bg-white rounded-[32px] border border-[#E6E4DD] p-5 md:p-8 shadow-sm space-y-6">
          {/* Demonstration Record Indicator */}
          {isDemoData && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FFF8E1] border border-[#FFE082] text-xs text-[#7A5300]">
              <span className="w-2 h-2 rounded-full bg-[#EAB308] shrink-0" />
              <span className="font-semibold">Demonstration Benchmark Dataset:</span>
              <span>Showing optical practice performance references. Real patient and employee identities are protected.</span>
            </div>
          )}

          {/* Inner Filter Row: Pill Selectors & Search Input */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[#E6E4DD]/60">
            <div className="flex flex-wrap items-center gap-2">
              {/* Branch Filter */}
              <div className="relative">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="appearance-none pl-3.5 pr-8 py-1.5 bg-[#F0EFE9] text-xs font-medium text-[#222222] rounded-full border border-transparent hover:border-[#E6E4DD] focus:outline-none focus:border-[#292929] transition-all cursor-pointer"
                >
                  <option value="all">Clinic: All Branches</option>
                  {branches.filter((b) => b !== "all").map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373] pointer-events-none" />
              </div>

              {/* Tier Filter */}
              <div className="relative">
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="appearance-none pl-3.5 pr-8 py-1.5 bg-[#F0EFE9] text-xs font-medium text-[#222222] rounded-full border border-transparent hover:border-[#E6E4DD] focus:outline-none focus:border-[#292929] transition-all cursor-pointer"
                >
                  <option value="all">Tier: All Levels</option>
                  {tiers.filter((t) => t !== "all").map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373] pointer-events-none" />
              </div>

              {/* Status Indicator */}
              <div className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#EAF5D5] text-[#255217] text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-[#255217]" />
                <span>Live Audited</span>
              </div>
            </div>

            {/* Rounded Search Input (Reference 1 Style) */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
              <input
                type="text"
                placeholder="Search staff, clinic or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-xs rounded-full bg-[#F0EFE9] text-[#222222] placeholder-[#737373] border border-transparent focus:border-[#292929] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center"></th>
                  <th className="py-2.5 px-4 font-medium">Staff Member</th>
                  <th className="py-2.5 px-4 font-medium">Clinical Role</th>
                  <th className="py-2.5 px-4 font-medium">Practice Site</th>
                  <th className="py-2.5 px-4 font-medium text-center">Simulations</th>
                  <th className="py-2.5 px-4 font-medium text-center">Quizzes</th>
                  <th className="py-2.5 px-4 font-medium text-right">Points Earned</th>
                  <th className="py-2.5 px-4 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={8} className="py-4 px-4 bg-[#F0EFE9]/40 rounded-2xl">
                        <div className="h-6 bg-[#E6E4DD]/60 rounded-full w-full" />
                      </td>
                    </tr>
                  ))
                ) : sortedLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#737373]">
                      <div className="max-w-sm mx-auto space-y-2">
                        <p className="font-semibold text-base text-[#222222]">No Staff Matching Filters</p>
                        <p className="text-xs text-[#737373]">Try adjusting your search criteria or clinic branch filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedLeaderboard.map((entry, index) => {
                    const isSelected = selectedUserId === entry.userId;
                    const isCurrentUser = user?.id === entry.userId;
                    const rank = index + 1;

                    return (
                      <tr
                        key={entry.userId}
                        onClick={() => setSelectedUserId(entry.userId)}
                        className={`transition-all cursor-pointer group ${
                          isSelected
                            ? "bg-[#FFD95E] text-[#222222] shadow-xs font-medium"
                            : "bg-white hover:bg-[#F0EFE9]/70 text-[#222222] border border-[#E6E4DD]"
                        }`}
                      >
                        {/* Checkbox / Rank Column */}
                        <td className="py-3.5 px-3 text-center rounded-l-2xl">
                          <div className="flex items-center justify-center">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isSelected
                                  ? "bg-[#292929] text-white"
                                  : rank === 1
                                  ? "bg-[#FFD95E] text-[#222222] font-extrabold"
                                  : rank === 2
                                  ? "bg-[#E6E4DD] text-[#222222]"
                                  : rank === 3
                                  ? "bg-[#FEF3C7] text-[#92400E]"
                                  : "text-[#737373]"
                              }`}
                            >
                              {rank}
                            </span>
                          </div>
                        </td>

                        {/* Staff Name & Profile Photo Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <StaffAvatar
                              name={entry.name}
                              size="md"
                              status={isCurrentUser ? "active" : undefined}
                              className={isSelected ? "ring-2 ring-[#292929]" : ""}
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-semibold ${isSelected ? "text-[#222222]" : "text-[#222222]"}`}>
                                  {entry.name}
                                </span>
                                {isCurrentUser && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    isSelected ? "bg-[#292929] text-white" : "bg-[#292929] text-white"
                                  }`}>
                                    You
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs block ${isSelected ? "text-[#222222]/80" : "text-[#737373]"}`}>
                                {entry.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Clinical Role */}
                        <td className="py-3.5 px-4">
                          <span className={`text-xs font-medium ${isSelected ? "text-[#222222]" : "text-[#737373]"}`}>
                            {entry.tier?.tierName || "Dispensing Optician"}
                          </span>
                        </td>

                        {/* Practice Site */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <Building2 className={`h-3.5 w-3.5 ${isSelected ? "text-[#222222]" : "text-[#737373]"}`} />
                            <span className="text-xs font-medium">
                              {entry.clinicId || "Apex Optical"}
                            </span>
                          </div>
                        </td>

                        {/* Simulations */}
                        <td className="py-3.5 px-4 text-center font-mono font-medium text-xs">
                          {entry.simulationsCompleted}
                        </td>

                        {/* Quizzes */}
                        <td className="py-3.5 px-4 text-center font-mono font-medium text-xs">
                          {entry.quizzesPassed}
                        </td>

                        {/* Points Earned */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                          {entry.totalPoints.toLocaleString()} <span className="text-xs font-normal opacity-80">pts</span>
                        </td>

                        {/* Status Pill (Reference 1: Soft green pill with dot "Invited" / "Active") */}
                        <td className="py-3.5 px-4 text-center rounded-r-2xl">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                              isSelected
                                ? "bg-white text-[#222222] shadow-xs"
                                : "bg-[#EAF5D5] text-[#255217]"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#255217]" />
                            <span>Active</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
