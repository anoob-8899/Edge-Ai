"use client";

import * as React from "react";
import Link from "next/link";
import {
  Trophy,
  Search,
  Award,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Building2,
  Users,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterPill } from "@/components/shared/filter-pill";
import { ProgressBar } from "@/components/shared/progress-bar";
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
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters state
  const [period, setPeriod] = React.useState<"week" | "month" | "all">("month");
  const [selectedBranch, setSelectedBranch] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

  const fetchLeaderboard = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/staff/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setMyStanding(data.myStanding || null);
        setTotalParticipants(data.totalParticipants || (data.leaderboard ? data.leaderboard.length : 0));
        // Auto-select current user or top performer
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

  // Unique clinic/branches list
  const branches = React.useMemo(() => {
    const list = Array.from(new Set(leaderboard.map((e) => e.clinicId).filter(Boolean)));
    return ["all", ...list];
  }, [leaderboard]);

  // Filtered leaderboard
  const filteredLeaderboard = React.useMemo(() => {
    return leaderboard.filter((entry) => {
      const matchesSearch =
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.clinicId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBranch = selectedBranch === "all" || entry.clinicId === selectedBranch;
      return matchesSearch && matchesBranch;
    });
  }, [leaderboard, searchQuery, selectedBranch]);

  // Sort: weekly vs all-time points based on period
  const sortedLeaderboard = React.useMemo(() => {
    return [...filteredLeaderboard].sort((a, b) => {
      if (period === "week") {
        return (b.recentPoints || 0) - (a.recentPoints || 0);
      }
      return b.totalPoints - a.totalPoints;
    });
  }, [filteredLeaderboard, period]);

  // Current selected user details
  const selectedUser = sortedLeaderboard.find((u) => u.userId === selectedUserId) || sortedLeaderboard[0] || myStanding;

  // Calculate practice-wide aggregate stats
  const totalVerifiedPoints = leaderboard.reduce((acc, curr) => acc + curr.totalPoints, 0);
  const avgCompletion = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((acc, curr) => acc + (curr.tier.progressPercent || 0), 0) / leaderboard.length)
    : 0;

  return (
    <AppShell
      title="Performance Leaderboard"
      subtitle="Audited dispensing points, weekly rankings & team mastery"
    >
      <div className="space-y-6">
        {/* Top Summary Metrics Bar (Reference 1 Inspiration) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#242629] text-white rounded-[20px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Active Staff</p>
              <h3 className="text-2xl font-bold mt-0.5">{totalParticipants}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-[#FFD95E] text-[#20242B] rounded-[20px] p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold text-[#20242B]/80 uppercase tracking-wider">My Standing</p>
              <h3 className="text-2xl font-bold mt-0.5">
                {myStanding
                  ? `#${leaderboard.findIndex((e) => e.userId === myStanding.userId) + 1 || 1}`
                  : "Rank #1"}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center text-[#20242B]">
              <Trophy className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E3E9EF] rounded-[20px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-[#737D8B] uppercase tracking-wider">Total Points</p>
              <h3 className="text-2xl font-bold text-[#20242B] mt-0.5">{totalVerifiedPoints.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#EEF3F7] flex items-center justify-center text-[#20242B]">
              <Target className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E3E9EF] rounded-[20px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-[#737D8B] uppercase tracking-wider">Avg Mastery</p>
              <h3 className="text-2xl font-bold text-[#20242B] mt-0.5">{avgCompletion}%</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#DDF4CF] flex items-center justify-center text-[#225414]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar Controls (Crextio Pill Style) */}
        <div className="bg-white border border-[#E3E9EF] rounded-[20px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left Pill Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#737D8B] mr-1 hidden sm:inline">Timeline:</span>
            <FilterPill
              label="This Week"
              active={period === "week"}
              onClick={() => setPeriod("week")}
            />
            <FilterPill
              label="This Month"
              active={period === "month"}
              onClick={() => setPeriod("month")}
            />
            <FilterPill
              label="All-Time"
              active={period === "all"}
              onClick={() => setPeriod("all")}
            />

            <div className="h-5 w-px bg-[#E3E9EF] mx-1 hidden sm:block" />

            <span className="text-xs font-semibold text-[#737D8B] mr-1 hidden md:inline">Branch:</span>
            {branches.map((b) => (
              <FilterPill
                key={b}
                label={b === "all" ? "All Clinics" : b}
                active={selectedBranch === b}
                onClick={() => setSelectedBranch(b)}
              />
            ))}
          </div>

          {/* Right Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737D8B]" />
            <input
              type="text"
              placeholder="Search staff or clinic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-xs rounded-full bg-[#EEF3F7] text-[#20242B] placeholder-[#737D8B] border border-transparent focus:border-[#9CCBFF] focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Main Ranking Table Card */}
        <Card className="overflow-hidden border border-[#E3E9EF]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3E9EF] bg-[#EEF3F7]/50 text-[11px] font-semibold text-[#737D8B] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                  <th className="py-3.5 px-4">Staff Dispenser</th>
                  <th className="py-3.5 px-4">Practice Site</th>
                  <th className="py-3.5 px-4">Curriculum Tier</th>
                  <th className="py-3.5 px-4 text-center">Simulations</th>
                  <th className="py-3.5 px-4 text-center">Quizzes</th>
                  <th className="py-3.5 px-4 w-44">Mastery Progress</th>
                  <th className="py-3.5 px-4 text-right">Points Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E9EF]/60 text-sm">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={8} className="py-4 px-4">
                        <div className="h-6 bg-[#EEF3F7] rounded-full w-full" />
                      </td>
                    </tr>
                  ))
                ) : sortedLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#737D8B]">
                      No staff dispensers found matching your filters.
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
                        className={`transition-colors cursor-pointer group ${
                          isSelected
                            ? "bg-[#FFD95E] text-[#20242B] font-medium"
                            : isCurrentUser
                            ? "bg-[#DCEEFF]/40 hover:bg-[#DCEEFF]/60"
                            : "hover:bg-[#EEF3F7]/50"
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              rank === 1
                                ? isSelected ? "bg-[#20242B] text-[#FFD95E]" : "bg-[#FFD95E] text-[#20242B] shadow-xs"
                                : rank === 2
                                ? "bg-[#EEF3F7] text-[#20242B] border border-[#E3E9EF]"
                                : rank === 3
                                ? "bg-[#FFF0C2] text-[#7A5300]"
                                : "text-[#737D8B]"
                            }`}
                          >
                            {rank}
                          </span>
                        </td>

                        {/* Staff Name and Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <StaffAvatar name={entry.name} size="md" status={isCurrentUser ? "active" : undefined} />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-semibold ${isSelected ? "text-[#20242B]" : "text-[#20242B]"}`}>
                                  {entry.name}
                                </span>
                                {isCurrentUser && (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                                    isSelected ? "bg-[#20242B] text-white" : "bg-[#242629] text-white"
                                  }`}>
                                    You
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs block ${isSelected ? "text-[#20242B]/80" : "text-[#737D8B]"}`}>
                                {entry.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Practice Site */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <Building2 className={`h-3.5 w-3.5 ${isSelected ? "text-[#20242B]" : "text-[#737D8B]"}`} />
                            <span className="text-xs font-medium">
                              {entry.clinicId || "Apex Optical Lab"}
                            </span>
                          </div>
                        </td>

                        {/* Curriculum Tier */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isSelected
                                ? "bg-white/60 text-[#20242B] border border-[#20242B]/10"
                                : "bg-[#EEF3F7] text-[#20242B] border border-[#E3E9EF]"
                            }`}
                          >
                            <Award className="h-3 w-3 text-[#20242B]" />
                            {entry.tier.tierName}
                          </span>
                        </td>

                        {/* Simulations Completed */}
                        <td className="py-3.5 px-4 text-center font-mono font-medium">
                          {entry.simulationsCompleted}
                        </td>

                        {/* Quizzes Passed */}
                        <td className="py-3.5 px-4 text-center font-mono font-medium">
                          {entry.quizzesPassed}
                        </td>

                        {/* Mastery Progress Bar */}
                        <td className="py-3.5 px-4">
                          <div className="w-full">
                            <div className="flex justify-between text-[11px] mb-1 font-mono">
                              <span className={isSelected ? "text-[#20242B]" : "text-[#737D8B]"}>
                                Tier Level {entry.tier.level}
                              </span>
                              <span className="font-bold">{entry.tier.progressPercent}%</span>
                            </div>
                            <div className={`w-full h-2 rounded-full overflow-hidden ${isSelected ? "bg-black/15" : "bg-[#EEF3F7]"}`}>
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isSelected ? "bg-[#20242B]" : "bg-[#FFD95E]"
                                }`}
                                style={{ width: `${entry.tier.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Points */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold text-base tracking-tight font-mono">
                            {period === "week"
                              ? (entry.recentPoints || 0).toLocaleString()
                              : entry.totalPoints.toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground ml-1">pts</span>
                          </div>
                          {period === "week" && (
                            <span className={`text-[10px] font-medium block ${isSelected ? "text-[#20242B]/80" : "text-[#8CE071]"}`}>
                              +{entry.recentPoints || 0} this week
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Selected Staff Performer Detail Spotlight (Bottom Drawer/Card) */}
        {selectedUser && (
          <div className="bg-white border border-[#E3E9EF] rounded-[20px] p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <StaffAvatar name={selectedUser.name} size="xl" status="active" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-[#20242B]">{selectedUser.name}</h4>
                  <Badge variant="yellow" size="sm">
                    {selectedUser.tier.tierName}
                  </Badge>
                </div>
                <p className="text-xs text-[#737D8B] mt-0.5">
                  Assigned Practice: <span className="font-semibold text-[#20242B]">{selectedUser.clinicId}</span> • Total Points: <span className="font-mono font-bold text-[#20242B]">{selectedUser.totalPoints} pts</span>
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-[#737D8B]">
                  <span><strong>{selectedUser.simulationsCompleted}</strong> Coaching Scenarios</span>
                  <span>•</span>
                  <span><strong>{selectedUser.lessonsCompleted}</strong> Dispensing Modules</span>
                  <span>•</span>
                  <span><strong>{selectedUser.quizzesPassed}</strong> Knowledge Checks</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/opticoach">
                <Button variant="outline" size="sm" pill>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Challenge in AI Coach</span>
                </Button>
              </Link>
              <Link href="/staff">
                <Button variant="dark" size="sm" pill>
                  <span>View Full Profile</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
