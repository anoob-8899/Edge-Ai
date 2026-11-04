"use client";

import * as React from "react";
import Link from "next/link";
import {
  Trophy,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  BookOpen,
  HelpCircle,
  TrendingUp,
  History,
  ShieldCheck,
  ChevronRight,
  Medal,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ChallengeRequirement {
  requiredLessons?: number;
  requiredQuizzes?: number;
  requiredSimulations?: number;
  minOptiCoachScore?: number;
  specificLessonId?: string;
  specificScenarioId?: string;
}

interface StaffChallenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  pointsReward: number;
  requirements: ChallengeRequirement;
  isPastDeadline: boolean;
  userProgress: {
    status: string;
    isCompleted: boolean;
    completedAt: string | null;
    pointsAwarded: boolean;
    progressDetails: {
      lessonsCompleted?: number;
      requiredLessons?: number;
      quizzesPassed?: number;
      requiredQuizzes?: number;
      simulationsCompleted?: number;
      requiredSimulations?: number;
      percentComplete?: number;
    };
  };
}

interface LeaderboardEntry {
  rank: number;
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
    badgeColor: string;
    level: number;
  };
}

interface PointLedgerEntry {
  id: string;
  points: number;
  activityType: string;
  referenceId: string;
  description: string;
  metadata: any;
  createdAt: string;
}

interface PointsHistoryData {
  totalPoints: number;
  tier: {
    tierName: string;
    level: number;
    nextTierThreshold: number | null;
    progressPercent: number;
  };
  ledger: PointLedgerEntry[];
}

export function StaffChallengesCard({ currentUserId }: { currentUserId?: string }) {
  const [activeTab, setActiveTab] = React.useState<"challenges" | "leaderboard" | "history">("challenges");
  const [challenges, setChallenges] = React.useState<StaffChallenge[]>([]);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([]);
  const [pointsData, setPointsData] = React.useState<PointsHistoryData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [chalRes, leadRes, histRes] = await Promise.all([
        fetch("/api/staff/challenges"),
        fetch("/api/staff/leaderboard"),
        fetch("/api/staff/points/history"),
      ]);

      if (chalRes.ok) {
        const d = await chalRes.json();
        setChallenges(d.challenges || []);
      }
      if (leadRes.ok) {
        const d = await leadRes.json();
        setLeaderboard(d.leaderboard || []);
      }
      if (histRes.ok) {
        const d = await histRes.json();
        setPointsData(d);
      }
    } catch (err) {
      console.error("Failed to load challenges and points data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeChallenges = challenges.filter((c) => !c.isPastDeadline || c.userProgress.isCompleted);
  const myRank = leaderboard.find((e) => e.userId === currentUserId);

  return (
    <div className="bg-white border border-[#E3E9EF] rounded-[20px] overflow-hidden shadow-xs">
      {/* Header Banner: Points & Tier */}
      <div className="p-6 bg-gradient-to-r from-white via-[#EEF3F7]/50 to-white border-b border-[#E3E9EF]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFD95E] text-[#20242B] flex items-center justify-center shadow-xs">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#20242B]">
                    Points & Weekly Practice Challenges
                  </h2>
                  <Badge variant="yellow" size="sm" isMono>
                    VERIFIED LEDGER
                  </Badge>
                </div>
                <p className="text-xs text-[#737D8B]">
                  Earn auditable points for passing quizzes, mastering lessons, and completing customer simulations
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-[#EEF3F7] border border-[#E3E9EF] shadow-xs text-center min-w-[100px]">
              <div className="text-[10px] font-semibold text-[#737D8B] uppercase tracking-wider">
                Total Points
              </div>
              <div className="text-xl font-bold text-[#20242B] font-mono">
                {pointsData?.totalPoints ?? 0}
              </div>
            </div>

            <div className="px-4 py-2 rounded-full bg-[#FFD95E] border border-[#EAC248] shadow-xs text-center min-w-[100px]">
              <div className="text-[10px] font-semibold text-[#20242B]/80 uppercase tracking-wider">
                Practice Rank
              </div>
              <div className="text-xl font-bold text-[#20242B] font-mono">
                #{myRank?.rank ?? "-"}
              </div>
            </div>

            <div className="px-4 py-2 rounded-full bg-[#EEF3F7] border border-[#E3E9EF] shadow-xs text-left">
              <div className="text-[10px] font-semibold text-[#737D8B] uppercase tracking-wider">
                Dispenser Tier
              </div>
              <div className="text-xs font-bold text-[#20242B] truncate">
                {pointsData?.tier?.tierName || "Apprentice Optician"}
              </div>
            </div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        {pointsData?.tier?.nextTierThreshold && (
          <div className="mt-4 pt-3 border-t border-[#E3E9EF] flex items-center gap-3">
            <span className="text-[11px] font-medium text-[#737D8B]">
              Progress to next tier ({pointsData.tier.nextTierThreshold} pts):
            </span>
            <div className="flex-1 max-w-md h-2 rounded-full bg-[#EEF3F7] border border-[#E3E9EF] overflow-hidden">
              <div
                className="h-full bg-[#FFD95E] rounded-full transition-all duration-500"
                style={{ width: `${pointsData.tier.progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-[#20242B]">
              {pointsData.tier.progressPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 flex items-center gap-2 border-b border-[#E3E9EF] bg-[#EEF3F7]/40">
        <button
          onClick={() => setActiveTab("challenges")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            activeTab === "challenges"
              ? "bg-[#242629] text-white shadow-xs"
              : "bg-white text-[#737D8B] hover:text-[#20242B] hover:bg-[#EEF3F7] border border-[#E3E9EF]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Active Challenges ({activeChallenges.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            activeTab === "leaderboard"
              ? "bg-[#242629] text-white shadow-xs"
              : "bg-white text-[#737D8B] hover:text-[#20242B] hover:bg-[#EEF3F7] border border-[#E3E9EF]"
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>Staff Leaderboard ({leaderboard.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            activeTab === "history"
              ? "bg-[#242629] text-white shadow-xs"
              : "bg-white text-[#737D8B] hover:text-[#20242B] hover:bg-[#EEF3F7] border border-[#E3E9EF]"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Points Ledger ({pointsData?.ledger?.length ?? 0})</span>
        </button>
      </div>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#8796AA]">
            Loading practice challenges, leaderboard & points ledger...
          </div>
        ) : activeTab === "challenges" ? (
          <div>
            {challenges.length === 0 ? (
              <div className="p-8 text-center bg-[#F0F7FF] rounded-xl border border-[#DCE8F5] space-y-2">
                <Trophy className="h-8 w-8 text-[#8796AA] mx-auto" />
                <div className="text-sm font-semibold text-[#172B4D]">
                  No Active Weekly Challenges
                </div>
                <p className="text-xs text-[#65758B] max-w-md mx-auto">
                  Practice owners create weekly optical sprints. Check back soon or continue completing lessons in the Library!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {challenges.map((ch) => {
                  const prog = ch.userProgress?.progressDetails || {
                    percentComplete: 0,
                    lessonsCompleted: 0,
                    quizzesPassed: 0,
                    simulationsCompleted: 0,
                  };
                  const isDone = ch.userProgress?.isCompleted || false;
                  const isExpired = ch.isPastDeadline && !isDone;

                  return (
                    <div
                      key={ch.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isDone
                          ? "bg-[#E8F8F2]/60 border-[#A5DEC7]"
                          : isExpired
                          ? "bg-gray-50/60 border-gray-200 opacity-70"
                          : "bg-white/90 border-[#DCE8F5] shadow-xs hover:border-[#B8D9FF]"
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge
                          variant={isDone ? "success" : isExpired ? "neutral" : "primary"}
                          size="sm"
                          isMono
                        >
                          {isDone ? "COMPLETED" : isExpired ? "EXPIRED" : "ACTIVE SPRINT"}
                        </Badge>

                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F3FF] border border-[#B8D9FF] text-xs font-bold text-[#4285F4]">
                          <Award className="h-3.5 w-3.5" />
                          <span>+{ch.pointsReward} PTS</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h4 className="text-sm font-bold text-[#172B4D] tracking-tight">
                        {ch.title}
                      </h4>
                      <p className="text-xs text-[#65758B] mt-1 line-clamp-2 leading-relaxed">
                        {ch.description}
                      </p>

                      {/* Deadline Countdown */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#8796AA] font-mono">
                        <Calendar className="h-3.5 w-3.5 text-[#4285F4]" />
                        <span>Deadline: {new Date(ch.endDate).toLocaleDateString()}</span>
                        {isDone && ch.userProgress?.completedAt && (
                          <span className="text-[#16865C] ml-auto font-semibold">
                            ✓ Achieved {new Date(ch.userProgress.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Defined Completion Requirements Breakdown */}
                      <div className="mt-4 pt-3 border-t border-[#DCE8F5]/70 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#8796AA]">
                          <span>COMPLETION REQUIREMENTS</span>
                          <span className="font-mono text-[#172B4D]">
                            {prog.percentComplete ?? 0}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 rounded-full bg-[#E8F3FF] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isDone ? "bg-[#16865C]" : "bg-[#4285F4]"
                            }`}
                            style={{ width: `${prog.percentComplete ?? 0}%` }}
                          />
                        </div>

                        {/* Requirement Badges */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                          {ch.requirements?.requiredLessons !== undefined && ch.requirements.requiredLessons > 0 && (
                            <div className="p-1.5 rounded-lg bg-[#F0F7FF] border border-[#DCE8F5] text-[10px]">
                              <div className="text-[#8796AA]">Lessons</div>
                              <div className="font-bold text-[#172B4D] font-mono">
                                {prog.lessonsCompleted || 0} / {ch.requirements.requiredLessons}
                              </div>
                            </div>
                          )}

                          {ch.requirements?.requiredQuizzes !== undefined && ch.requirements.requiredQuizzes > 0 && (
                            <div className="p-1.5 rounded-lg bg-[#F0F7FF] border border-[#DCE8F5] text-[10px]">
                              <div className="text-[#8796AA]">Quizzes</div>
                              <div className="font-bold text-[#172B4D] font-mono">
                                {prog.quizzesPassed || 0} / {ch.requirements.requiredQuizzes}
                              </div>
                            </div>
                          )}

                          {ch.requirements?.requiredSimulations !== undefined && ch.requirements.requiredSimulations > 0 && (
                            <div className="p-1.5 rounded-lg bg-[#F0F7FF] border border-[#DCE8F5] text-[10px]">
                              <div className="text-[#8796AA]">AI Coaching</div>
                              <div className="font-bold text-[#172B4D] font-mono">
                                {prog.simulationsCompleted || 0} / {ch.requirements.requiredSimulations}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Action */}
                      {!isDone && !isExpired && (
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <Link href="/library">
                            <Button variant="secondary" size="sm">
                              <BookOpen className="h-3 w-3" />
                              <span>Go to Library</span>
                            </Button>
                          </Link>
                          <Link href="/opticoach">
                            <Button variant="primary" size="sm">
                              <Sparkles className="h-3 w-3" />
                              <span>Training Studio</span>
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "leaderboard" ? (
          <div>
            <div className="rounded-xl border border-[#DCE8F5] overflow-hidden bg-white/90">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F0F7FF] border-b border-[#DCE8F5] text-[11px] font-semibold text-[#8796AA]">
                    <th className="py-3 px-4">RANK</th>
                    <th className="py-3 px-4">PRACTITIONER</th>
                    <th className="py-3 px-4">TIER</th>
                    <th className="py-3 px-4 text-center">CHALLENGES</th>
                    <th className="py-3 px-4 text-center">LESSONS / QUIZZES</th>
                    <th className="py-3 px-4 text-right">TOTAL POINTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE8F5]">
                  {leaderboard.map((entry) => {
                    const isMe = entry.userId === currentUserId;
                    return (
                      <tr
                        key={entry.userId}
                        className={`transition-colors ${
                          isMe ? "bg-[#E8F3FF]/70 font-semibold" : "hover:bg-[#F8FBFF]"
                        }`}
                      >
                        <td className="py-3 px-4 font-mono">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              entry.rank === 1
                                ? "bg-amber-400 text-white shadow-xs"
                                : entry.rank === 2
                                ? "bg-slate-300 text-slate-800"
                                : entry.rank === 3
                                ? "bg-amber-700 text-white"
                                : "text-[#65758B]"
                            }`}
                          >
                            {entry.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-sm text-[#172B4D]">
                            {entry.name} {isMe && <span className="text-[#4285F4] text-xs font-bold">(You)</span>}
                          </div>
                          <div className="text-[10px] text-[#8796AA] font-mono">{entry.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" size="sm">
                            {entry.tier.tierName}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-[#16865C]">
                          {entry.challengesCompleted}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[#65758B]">
                          {entry.lessonsCompleted} / {entry.quizzesPassed}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#4285F4]">
                          {entry.totalPoints} PTS
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            {pointsData?.ledger?.length === 0 ? (
              <div className="p-8 text-center bg-[#F0F7FF] rounded-xl border border-[#DCE8F5]">
                No points recorded yet. Complete your first lesson or quiz to start your points ledger!
              </div>
            ) : (
              <div className="rounded-xl border border-[#DCE8F5] overflow-hidden bg-white/90">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F0F7FF] border-b border-[#DCE8F5] text-[11px] font-semibold text-[#8796AA]">
                      <th className="py-3 px-4">TIMESTAMP</th>
                      <th className="py-3 px-4">EVENT TYPE</th>
                      <th className="py-3 px-4">DESCRIPTION</th>
                      <th className="py-3 px-4 text-right">POINTS AWARDED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE8F5]">
                    {pointsData?.ledger.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#F8FBFF]">
                        <td className="py-3 px-4 text-[11px] text-[#8796AA] font-mono">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" size="sm" isMono>
                            {entry.activityType}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-[#172B4D]">
                          {entry.description}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#16865C]">
                          +{entry.points} PTS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </div>
  );
}
