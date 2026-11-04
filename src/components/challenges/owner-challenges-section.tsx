"use client";

import * as React from "react";
import {
  Trophy,
  Award,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Eye,
  Sparkles,
  BarChart3,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface OwnerChallenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  pointsReward: number;
  isActive: boolean;
  isPastDeadline: boolean;
  requirements: {
    requiredLessons: number;
    requiredQuizzes: number;
    requiredSimulations: number;
    minOptiCoachScore: number;
    specificLessonId?: string;
    specificScenarioId?: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  metrics: {
    totalStaff: number;
    completedCount: number;
    inProgressCount: number;
    completionRate: number;
  };
}

interface StaffReportItem {
  staffId: string;
  name: string;
  email: string;
  clinicId: string | null;
  status: string;
  isCompleted: boolean;
  completedAt: string | null;
  pointsAwarded: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  simulationsCompleted: number;
  percentComplete: number;
}

interface ChallengeReportData {
  challenge: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    pointsReward: number;
    isActive: boolean;
    isExpired: boolean;
    requirements: any;
    creator?: any;
  };
  metrics: {
    totalStaff: number;
    completedCount: number;
    inProgressCount: number;
    expiredCount: number;
    completionRate: number;
  };
  staffReport: StaffReportItem[];
}

export function OwnerChallengesSection() {
  const [challenges, setChallenges] = React.useState<OwnerChallenge[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Selected challenge report dialog
  const [selectedChallengeReport, setSelectedChallengeReport] = React.useState<ChallengeReportData | null>(null);
  const [isLoadingReport, setIsLoadingReport] = React.useState(false);

  // Form State
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [pointsReward, setPointsReward] = React.useState(200);
  const [requiredLessons, setRequiredLessons] = React.useState(1);
  const [requiredQuizzes, setRequiredQuizzes] = React.useState(1);
  const [requiredSimulations, setRequiredSimulations] = React.useState(1);
  const [minOptiCoachScore, setMinOptiCoachScore] = React.useState(70);

  const fetchChallenges = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/owner/challenges");
      if (res.ok) {
        const d = await res.json();
        setChallenges(d.challenges || []);
      }
    } catch (err) {
      console.error("Failed to fetch challenges:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/owner/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          endDate: new Date(endDate).toISOString(),
          pointsReward: Number(pointsReward),
          requirements: {
            requiredLessons: Number(requiredLessons),
            requiredQuizzes: Number(requiredQuizzes),
            requiredSimulations: Number(requiredSimulations),
            minOptiCoachScore: Number(minOptiCoachScore),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create challenge");
      }

      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      setEndDate("");
      fetchChallenges();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReport = async (challengeId: string) => {
    setIsLoadingReport(true);
    try {
      const res = await fetch(`/api/owner/challenges/${challengeId}`);
      if (res.ok) {
        const report = await res.json();
        setSelectedChallengeReport(report);
      }
    } catch (err) {
      console.error("Failed to load challenge report:", err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">
            Weekly Practice Challenges & Completion Reports
          </h2>
          <p className="text-xs text-[#65758B]">
            Create structured dispensing sprints with clear deadlines, defined completion requirements, and automated auditable point bonuses.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateOpen(true)}
          className="shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New Weekly Challenge</span>
        </Button>
      </div>

      {/* Challenges List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-[#8796AA]">
          Loading practice challenges and participation rates...
        </div>
      ) : challenges.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12 text-center space-y-3">
            <Trophy className="h-10 w-10 text-[#8796AA] mx-auto opacity-70" />
            <h3 className="text-base font-bold text-[#172B4D]">
              No Weekly Challenges Created Yet
            </h3>
            <p className="text-xs text-[#65758B] max-w-md mx-auto">
              Boost your opticians&apos; clinical skills and product knowledge by launching a weekly challenge with verified points.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="mt-2"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Practice Sprint</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {challenges.map((ch) => {
            const isExpired = ch.isPastDeadline;
            const completionPercent = ch.metrics.completionRate;

            return (
              <Card
                key={ch.id}
                variant="glass"
                hoverable
                className="flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge
                        variant={isExpired ? "neutral" : "primary"}
                        size="sm"
                        isMono
                      >
                        {isExpired ? "EXPIRED" : "ACTIVE SPRINT"}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs font-bold font-mono text-[#4285F4] bg-[#E8F3FF] px-2 py-0.5 rounded-full border border-[#B8D9FF]">
                        <Award className="h-3.5 w-3.5" />
                        <span>+{ch.pointsReward} PTS</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-[#172B4D] tracking-tight">
                      {ch.title}
                    </h3>
                    <p className="text-xs text-[#65758B] mt-1 line-clamp-2 leading-relaxed">
                      {ch.description}
                    </p>
                  </div>

                  {/* Requirements & Deadline Info */}
                  <div className="px-5 py-3 bg-[#F0F7FF]/50 border-y border-[#DCE8F5]/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#8796AA] font-mono text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#4285F4]" />
                        Deadline: {new Date(ch.endDate).toLocaleDateString()}
                      </span>
                      <span>
                        {isExpired ? "Closed" : "In Progress"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-[#8796AA]">Criteria:</span>
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {(ch.requirements?.requiredLessons ?? 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-white border border-[#DCE8F5] text-[#172B4D]">
                            {ch.requirements?.requiredLessons} Lessons
                          </span>
                        )}
                        {(ch.requirements?.requiredQuizzes ?? 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-white border border-[#DCE8F5] text-[#172B4D]">
                            {ch.requirements?.requiredQuizzes} Quizzes
                          </span>
                        )}
                        {(ch.requirements?.requiredSimulations ?? 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-white border border-[#DCE8F5] text-[#172B4D]">
                            {ch.requirements?.requiredSimulations} Simulations
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Completion Rate Metrics */}
                  <div className="p-5 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#65758B] font-medium">Practice Completion:</span>
                      <span className="font-mono font-bold text-[#172B4D]">
                        {ch.metrics.completedCount} / {ch.metrics.totalStaff} staff ({completionPercent}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E8F3FF] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#4285F4] to-[#16865C] rounded-full transition-all duration-300"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => handleOpenReport(ch.id)}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>View Completion Report</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE CHALLENGE DIALOG MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#DCE8F5] shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE8F5] pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#4285F4]" />
                <h3 className="font-bold text-base text-[#172B4D]">
                  Launch Practice Weekly Challenge
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-[#8796AA] hover:text-[#172B4D] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C83F4F] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Challenge Title *
                </label>
                <Input
                  required
                  placeholder="e.g. Progressive Lens Adaptation & Corridor Fitting Sprint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Description & Clinical Objectives *
                </label>
                <Textarea
                  required
                  rows={3}
                  placeholder="Provide clinical instructions and goals for staff opticians..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                    Completion Deadline *
                  </label>
                  <Input
                    required
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                    Points Reward *
                  </label>
                  <Input
                    type="number"
                    min={50}
                    max={2000}
                    step={25}
                    value={pointsReward}
                    onChange={(e) => setPointsReward(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Completion Requirements Inputs */}
              <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#B8D9FF]/70 space-y-3">
                <div className="text-xs font-bold text-[#172B4D]">
                  Defined Completion Requirements:
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#65758B] mb-1">
                      Required Lessons
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={requiredLessons}
                      onChange={(e) => setRequiredLessons(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#65758B] mb-1">
                      Required Quizzes
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={requiredQuizzes}
                      onChange={(e) => setRequiredQuizzes(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#65758B] mb-1">
                      AI Coach Sims
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={requiredSimulations}
                      onChange={(e) => setRequiredSimulations(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#65758B] mb-1">
                    Minimum Simulation Score (%)
                  </label>
                  <Input
                    type="number"
                    min={60}
                    max={100}
                    value={minOptiCoachScore}
                    onChange={(e) => setMinOptiCoachScore(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE8F5]">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Launching..." : "Launch Weekly Challenge"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHALLENGE COMPLETION REPORT MODAL */}
      {selectedChallengeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white border border-[#DCE8F5] shadow-2xl overflow-y-auto p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#DCE8F5] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="primary" size="sm" isMono>
                    CHALLENGE COMPLETION AUDIT REPORT
                  </Badge>
                  <Badge
                    variant={selectedChallengeReport.challenge.isExpired ? "neutral" : "success"}
                    size="sm"
                    isMono
                  >
                    {selectedChallengeReport.challenge.isExpired ? "EXPIRED" : "ACTIVE"}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-[#172B4D]">
                  {selectedChallengeReport.challenge.title}
                </h3>
                <p className="text-xs text-[#65758B] mt-1 max-w-2xl leading-relaxed">
                  {selectedChallengeReport.challenge.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedChallengeReport(null)}
                className="text-[#8796AA] hover:text-[#172B4D] p-1.5 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#DCE8F5] text-center">
                <div className="text-[10px] font-semibold text-[#8796AA] uppercase tracking-wider">
                  Total Staff
                </div>
                <div className="text-xl font-bold text-[#172B4D] font-mono mt-0.5">
                  {selectedChallengeReport.metrics.totalStaff}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#E8F8F2] border border-[#A5DEC7] text-center">
                <div className="text-[10px] font-semibold text-[#16865C] uppercase tracking-wider">
                  Completed
                </div>
                <div className="text-xl font-bold text-[#16865C] font-mono mt-0.5">
                  {selectedChallengeReport.metrics.completedCount}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FEF6E7] border border-[#FAD99F] text-center">
                <div className="text-[10px] font-semibold text-[#A96A08] uppercase tracking-wider">
                  In Progress
                </div>
                <div className="text-xl font-bold text-[#A96A08] font-mono mt-0.5">
                  {selectedChallengeReport.metrics.inProgressCount}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#DCE8F5] text-center shadow-xs">
                <div className="text-[10px] font-semibold text-[#8796AA] uppercase tracking-wider">
                  Completion Rate
                </div>
                <div className="text-xl font-bold text-[#4285F4] font-mono mt-0.5">
                  {selectedChallengeReport.metrics.completionRate}%
                </div>
              </div>
            </div>

            {/* Staff Completion Breakdown Table */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-[#172B4D]">
                Staff Opticians Progress & Verified Completion Breakdown
              </h4>

              <div className="rounded-xl border border-[#DCE8F5] overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F0F7FF] border-b border-[#DCE8F5] text-[11px] font-semibold text-[#8796AA]">
                      <th className="py-3 px-4">OPTICIAN</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4 text-center">LESSONS</th>
                      <th className="py-3 px-4 text-center">QUIZZES</th>
                      <th className="py-3 px-4 text-center">SIMULATIONS</th>
                      <th className="py-3 px-4 text-center">COMPLETED AT</th>
                      <th className="py-3 px-4 text-right">POINTS AWARDED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE8F5]">
                    {selectedChallengeReport.staffReport.map((staff) => (
                      <tr key={staff.staffId} className="hover:bg-[#F8FBFF]">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#172B4D]">{staff.name}</div>
                          <div className="text-[10px] text-[#8796AA] font-mono">{staff.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={staff.isCompleted ? "success" : staff.status === "EXPIRED" ? "error" : "neutral"}
                            size="sm"
                            isMono
                          >
                            {staff.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {staff.lessonsCompleted} / {selectedChallengeReport.challenge.requirements?.requiredLessons || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {staff.quizzesPassed} / {selectedChallengeReport.challenge.requirements?.requiredQuizzes || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {staff.simulationsCompleted} / {selectedChallengeReport.challenge.requirements?.requiredSimulations || 0}
                        </td>
                        <td className="py-3 px-4 text-center text-[11px] text-[#8796AA] font-mono">
                          {staff.completedAt ? new Date(staff.completedAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#16865C]">
                          {staff.pointsAwarded > 0 ? `+${staff.pointsAwarded} PTS` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#DCE8F5]">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedChallengeReport(null)}
              >
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
