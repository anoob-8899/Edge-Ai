"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Award,
  Glasses,
  Lock,
  ChevronRight,
  User,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  Target,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/auth/auth-context";
import { StaffChallengesCard } from "@/components/challenges/staff-challenges-card";
import { AssessmentReportModal } from "@/components/opticoach/assessment-report-modal";

interface StaffPrivateRecord {
  id: string;
  title: string;
  notes: string;
  confidentialSalaryOrBonusTier?: string | null;
  createdAt: string;
}

interface StaffAssignment {
  id: string;
  title: string;
  notes?: string | null;
  activityType: "LESSON" | "QUIZ" | "OPTICOACH_SCENARIO";
  dueDate?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
  completedAt?: string | null;
  createdAt: string;
  assignedBy?: {
    name: string;
    email: string;
  };
  lesson?: {
    id: string;
    title: string;
    slug: string;
    subcategory?: {
      slug: string;
      category?: {
        slug: string;
      };
    };
  } | null;
  scenarioId?: string | null;
  scenarioTitle?: string | null;
}

interface ContinueLesson {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categoryName: string;
  subcategoryName: string;
  categorySlug: string;
  subcategorySlug: string;
  isCompleted: boolean;
  status: "completed" | "in-progress" | "not-started";
}

interface PracticeSession {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioCategory: string;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  score?: number | null;
  durationSeconds: number;
  feedbackSummary?: string | null;
  createdAt: string;
  _count?: {
    messages: number;
  };
}

export default function StaffDashboardPage() {
  const { user, role } = useAuth();
  const [privateRecords, setPrivateRecords] = React.useState<StaffPrivateRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = React.useState(true);
  const [assignments, setAssignments] = React.useState<StaffAssignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = React.useState(true);
  const [completingId, setCompletingId] = React.useState<string | null>(null);

  // Real learning progress & practice sessions
  const [continueLessons, setContinueLessons] = React.useState<ContinueLesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = React.useState(true);
  const [sessions, setSessions] = React.useState<PracticeSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(true);

  // Review modal state
  const [activeReview, setActiveReview] = React.useState<any | null>(null);
  const [activeSessionMeta, setActiveSessionMeta] = React.useState<{ title: string; category: string } | null>(null);
  const [isReviewOpen, setIsReviewOpen] = React.useState(false);

  // Fetch current staff member's private records
  const fetchPrivateRecords = React.useCallback(async () => {
    setIsLoadingRecords(true);
    try {
      const res = await fetch("/api/staff/records");
      if (res.ok) {
        const data = await res.json();
        setPrivateRecords(data.records || []);
      }
    } catch (err) {
      console.error("Failed to load staff records:", err);
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  // Fetch current staff member's learning assignments
  const fetchAssignments = React.useCallback(async () => {
    setIsLoadingAssignments(true);
    try {
      const res = await fetch("/api/staff/assignments");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error("Failed to load assignments:", err);
    } finally {
      setIsLoadingAssignments(false);
    }
  }, []);

  // Fetch learning progress from library
  const fetchContinueLearning = React.useCallback(async () => {
    setIsLoadingLessons(true);
    try {
      const res = await fetch("/api/library/continue-learning");
      if (res.ok) {
        const data = await res.json();
        setContinueLessons(data.continueLessons || []);
      }
    } catch (err) {
      console.error("Failed to load continue learning:", err);
    } finally {
      setIsLoadingLessons(false);
    }
  }, []);

  // Fetch practice sessions from AI coach
  const fetchSessions = React.useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch("/api/opticoach/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load coaching sessions:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPrivateRecords();
    fetchAssignments();
    fetchContinueLearning();
    fetchSessions();
  }, [fetchPrivateRecords, fetchAssignments, fetchContinueLearning, fetchSessions]);

  const handleCompleteAssignment = async (assignmentId: string) => {
    setCompletingId(assignmentId);
    try {
      const res = await fetch(`/api/staff/assignments/${assignmentId}/complete`, {
        method: "POST",
      });
      if (res.ok) {
        fetchAssignments();
      }
    } catch (err) {
      console.error("Failed to complete assignment:", err);
    } finally {
      setCompletingId(null);
    }
  };

  const handleOpenReview = (session: PracticeSession) => {
    if (!session.feedbackSummary) return;
    try {
      const parsed = JSON.parse(session.feedbackSummary);
      setActiveReview(parsed);
      setActiveSessionMeta({
        title: session.scenarioTitle,
        category: session.scenarioCategory,
      });
      setIsReviewOpen(true);
    } catch (err) {
      console.error("Failed to parse session feedback:", err);
    }
  };

  const pendingAssignments = assignments.filter((a) => a.status === "PENDING" || a.status === "IN_PROGRESS" || a.status === "OVERDUE");
  const completedAssignments = assignments.filter((a) => a.status === "COMPLETED");
  const completedSessions = sessions.filter((s) => s.status === "COMPLETED");

  // Next recommended learning activity (first incomplete lesson from progress, or first pending assignment)
  const nextRecommendedLesson = continueLessons.find((l) => !l.isCompleted) || continueLessons[0];
  const nextRecommendedAssignment = pendingAssignments[0];

  return (
    <AppShell
      title="Staff Dashboard"
      subtitle="Personal optical dispensing progression, practice records & assignments"
    >
      <div className="space-y-6">
        {/* Welcome Header Banner (Reference 3 Editorial Style) */}
        <div className="relative rounded-[28px] p-6 md:p-8 bg-white border border-[#E6E4DD] shadow-sm overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary" size="sm">
                Optical Dispensing Trainee
              </Badge>
              <Badge variant="secondary" size="sm" isMono>
                {user?.clinicId || "APEX-OPTICAL"}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#222222] tracking-tight">
              Welcome back, {user?.name || "Licensed Optician"}
            </h1>
            <p className="text-xs sm:text-sm text-[#737373] mt-1.5 leading-relaxed">
              Sharpen your retail consultation skills, master high-index materials and progressive lens adaptation,
              and review your clinical coaching evaluations.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href="/opticoach">
                <Button variant="yellow" size="md" pill className="font-bold">
                  <Sparkles className="h-4 w-4" />
                  <span>Launch AI Coach</span>
                </Button>
              </Link>
              <Link href="/library">
                <Button variant="secondary" size="md" pill>
                  <BookOpen className="h-4 w-4 text-[#222222]" />
                  <span>Explore Curriculum</span>
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="outline" size="md" pill>
                  <Award className="h-4 w-4 text-[#737373]" />
                  <span>View Leaderboard</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Optical Watermark Icon */}
          <div className="absolute -right-6 -bottom-6 text-[#F0EFE9] pointer-events-none">
            <Glasses className="w-56 h-56 stroke-[1.2]" />
          </div>
        </div>

        {/* Real Metric Cards Row (Reference 3 Composition) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E6E4DD] rounded-[24px] p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#737373]">
              <span>PRACTITIONER PROFILE</span>
              <User className="h-4 w-4 text-[#222222]" />
            </div>
            <div className="mt-2 text-xl font-bold text-[#222222] truncate">
              {user?.name || "Staff Optician"}
            </div>
            <p className="mt-1 text-xs text-[#737373] font-mono">
              Role: {role || "STAFF"}
            </p>
          </div>

          <div className="bg-white border border-[#E6E4DD] rounded-[24px] p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#737373]">
              <span>PENDING ASSIGNMENTS</span>
              <Clock className="h-4 w-4 text-[#92400E]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#222222] font-mono">
              {pendingAssignments.length}
            </div>
            <p className="mt-1 text-xs text-[#737373]">
              {completedAssignments.length} completed
            </p>
          </div>

          <div className="bg-white border border-[#E6E4DD] rounded-[24px] p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#737373]">
              <span>PRACTICE SIMULATIONS</span>
              <Sparkles className="h-4 w-4 text-[#222222]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#222222] font-mono">
              {completedSessions.length}
            </div>
            <p className="mt-1 text-xs text-[#737373]">
              {sessions.length} total sessions recorded
            </p>
          </div>

          <div className="bg-white border border-[#E6E4DD] rounded-[24px] p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#737373]">
              <span>LEARNING MODULES</span>
              <BookOpen className="h-4 w-4 text-[#255217]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#222222] font-mono">
              {continueLessons.filter((l) => l.isCompleted).length}
            </div>
            <p className="mt-1 text-xs text-[#737373]">
              {continueLessons.length} modules tracked
            </p>
          </div>
        </div>

        {/* DISTINCTIVE DARK PANEL (#292929) FOR IMPORTANT NEXT TASK (Reference 3 Requirement) */}
        {(nextRecommendedAssignment || nextRecommendedLesson) && (
          <div className="p-6 md:p-7 rounded-[28px] bg-[#292929] text-white border border-[#3D3D3D] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#FFD95E] shrink-0">
                <Target className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-[#FFD95E] text-[#222222]">
                    Priority Learning Next
                  </span>
                  {nextRecommendedAssignment && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                      Due Soon
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-white">
                  {nextRecommendedAssignment
                    ? nextRecommendedAssignment.title
                    : nextRecommendedLesson?.title}
                </h3>
                <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
                  {nextRecommendedAssignment?.notes ||
                    nextRecommendedLesson?.summary ||
                    "Master this core dispensing competency to raise your store sales confidence and client satisfaction."}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              {nextRecommendedAssignment ? (
                <Link
                  href={
                    nextRecommendedAssignment.activityType === "OPTICOACH_SCENARIO"
                      ? "/opticoach"
                      : nextRecommendedAssignment.lesson
                      ? `/library/${nextRecommendedAssignment.lesson.subcategory?.category?.slug}/${nextRecommendedAssignment.lesson.subcategory?.slug}/${nextRecommendedAssignment.lesson.slug}`
                      : "/library"
                  }
                >
                  <Button variant="yellow" size="md" pill className="font-bold">
                    <span>Continue Mission</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : nextRecommendedLesson ? (
                <Link
                  href={`/library/${nextRecommendedLesson.categorySlug}/${nextRecommendedLesson.subcategorySlug}/${nextRecommendedLesson.slug}`}
                >
                  <Button variant="yellow" size="md" pill className="font-bold">
                    <span>Resume Lesson</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        )}

        {/* Weekly Challenges & Points System */}
        <StaffChallengesCard currentUserId={user?.id} />

        {/* Two-Column Layout: Assigned Training Modules & Recent Practice Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Column 1: Assigned Learning Modules */}
          <div className="bg-white border border-[#E6E4DD] rounded-[24px] p-6 h-full flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex flex-row items-center justify-between pb-3 border-b border-[#E6E4DD]">
                <div>
                  <h3 className="text-base font-bold text-[#222222]">Assigned Training Tasks</h3>
                  <p className="text-xs text-[#737373]">
                    Practice scenarios & dispensing modules assigned by management
                  </p>
                </div>
                <Badge variant="secondary" size="sm" isMono>
                  {assignments.length} Total
                </Badge>
              </div>

              <div className="pt-3">
                {isLoadingAssignments ? (
                  <div className="py-8 text-center text-xs text-[#737373]">
                    Loading assignments...
                  </div>
                ) : assignments.length === 0 ? (
                  <EmptyState
                    icon={<Calendar className="h-5 w-5" />}
                    title="No Assigned Modules"
                    description="You are currently up to date on all assigned optical dispensing coursework."
                    badgeText="Up To Date"
                    action={
                      <Link href="/opticoach">
                        <Button variant="outline" size="sm" pill>
                          <span>Practice in AI Coach</span>
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="divide-y divide-[#E6E4DD]">
                    {assignments.map((assignment) => {
                      const isCompleted = assignment.status === "COMPLETED";
                      const isOverdue = assignment.status === "OVERDUE";

                      let targetUrl = "/library";
                      if (
                        assignment.lesson?.subcategory?.category?.slug &&
                        assignment.lesson?.subcategory?.slug &&
                        assignment.lesson?.slug
                      ) {
                        targetUrl = `/library/${assignment.lesson.subcategory.category.slug}/${assignment.lesson.subcategory.slug}/${assignment.lesson.slug}`;
                      } else if (assignment.activityType === "OPTICOACH_SCENARIO") {
                        targetUrl = "/opticoach";
                      }

                      return (
                        <div
                          key={assignment.id}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1 max-w-sm">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-[#222222]">
                                {assignment.title}
                              </span>
                              <Badge
                                variant={
                                  isCompleted ? "success" : isOverdue ? "error" : "neutral"
                                }
                                size="sm"
                                isMono
                              >
                                {assignment.status}
                              </Badge>
                            </div>

                            {assignment.notes && (
                              <p className="text-xs text-[#737373] line-clamp-1">
                                {assignment.notes}
                              </p>
                            )}

                            <div className="flex items-center gap-2 text-[11px] text-[#737373] font-mono">
                              {assignment.dueDate && (
                                <span className="flex items-center gap-1 text-[#222222]">
                                  <Calendar className="h-3 w-3 text-[#737373]" />
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              {assignment.completedAt && (
                                <span className="text-[#255217]">
                                  Completed: {new Date(assignment.completedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Link href={targetUrl}>
                              <Button variant="secondary" size="sm" pill className="h-7 text-xs px-3">
                                <span>Open</span>
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </Link>
                            {!isCompleted && (
                              <Button
                                variant="outline"
                                size="sm"
                                pill
                                className="h-7 text-xs px-3"
                                disabled={completingId === assignment.id}
                                onClick={() => handleCompleteAssignment(assignment.id)}
                              >
                                <CheckCircle2 className="h-3 w-3 text-[#255217]" />
                                <span>{completingId === assignment.id ? "Saving..." : "Done"}</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Recent Practice Sessions & Coaching Feedback */}
          <div className="bg-white border border-[#E6E4DD] rounded-[24px] p-6 h-full flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex flex-row items-center justify-between pb-3 border-b border-[#E3E9EF]">
                <div>
                  <h3 className="text-base font-bold text-[#20242B]">Recent Practice Sessions</h3>
                  <p className="text-xs text-[#737D8B]">
                    Simulated customer consultations and AI evaluation scorecards
                  </p>
                </div>
                <Badge variant="secondary" size="sm" isMono>
                  {sessions.length} Sessions
                </Badge>
              </div>

              <div className="pt-3">
                {isLoadingSessions ? (
                  <div className="py-8 text-center text-xs text-[#737D8B]">
                    Loading practice sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <EmptyState
                    icon={<Sparkles className="h-5 w-5" />}
                    title="No Practice Sessions Yet"
                    description="Conduct your first simulated optical sales consultation to earn points and receive coaching feedback."
                    badgeText="Ready to Practice"
                    action={
                      <Link href="/opticoach">
                        <Button variant="yellow" size="sm" pill>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Start AI Simulation</span>
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="divide-y divide-[#E3E9EF]">
                    {sessions.slice(0, 5).map((session) => (
                      <div
                        key={session.id}
                        className="py-3.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-xs text-[#20242B] truncate max-w-xs">
                            {session.scenarioTitle}
                          </div>
                          <div className="text-[11px] text-[#737D8B] flex items-center gap-2">
                            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{session.scenarioCategory}</span>
                            <span>•</span>
                            <span>{Math.round(session.durationSeconds / 60)} min</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {session.score !== null && session.score !== undefined ? (
                            <Badge
                              variant={
                                session.score >= 80
                                  ? "success"
                                  : session.score >= 60
                                  ? "primary"
                                  : "warning"
                              }
                              size="sm"
                              isMono
                            >
                              {session.score}%
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm" isMono>
                              {session.status}
                            </Badge>
                          )}

                          {session.feedbackSummary && (
                            <Button
                              variant="outline"
                              size="sm"
                              pill
                              className="h-7 text-xs px-3"
                              onClick={() => handleOpenReview(session)}
                            >
                              <span>Feedback</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {sessions.length > 5 && (
              <div className="p-4 pt-3 text-center border-t border-[#E3E9EF] mt-3">
                <Link href="/opticoach">
                  <Button variant="ghost" size="sm" pill className="text-xs">
                    <span>View all sessions in AI Coach</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Current Learning Progress Card */}
        {continueLessons.length > 0 && (
          <div className="bg-white border border-[#E3E9EF] rounded-[20px] p-5 space-y-4 shadow-xs">
            <div className="flex flex-row items-center justify-between pb-3 border-b border-[#E3E9EF]">
              <div>
                <h3 className="text-base font-bold text-[#20242B]">Current Learning Progress</h3>
                <p className="text-xs text-[#737D8B]">
                  Dispensing curriculum and lens science lessons in progress
                </p>
              </div>
              <Link href="/library" className="text-xs text-[#20242B] hover:text-[#9CCBFF] font-semibold flex items-center gap-1">
                <span>View Full Library</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {continueLessons.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={`/library/${item.categorySlug}/${item.subcategorySlug}/${item.slug}`}
                    className="p-4 rounded-[16px] border border-[#E3E9EF] hover:border-[#9CCBFF] bg-[#EEF3F7]/50 hover:bg-white transition-all space-y-2 block group shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#737D8B]">
                      <span className="truncate">{item.categoryName}</span>
                      <Badge
                        variant={item.isCompleted ? "success" : "primary"}
                        size="sm"
                      >
                        {item.isCompleted ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                    <div className="font-semibold text-xs text-[#20242B] group-hover:text-[#242629] transition-colors truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[#737D8B] flex items-center justify-between">
                      <span className="truncate">{item.subcategoryName}</span>
                      <span className="text-[#20242B] font-semibold flex items-center gap-0.5">
                        <span>{item.isCompleted ? "Review" : "Resume"}</span>
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Confidential Practice Records Section */}
        <div id="records" className="bg-white border border-[#E3E9EF] rounded-[20px] p-5 space-y-4 shadow-xs">
          <div className="flex flex-row items-center justify-between pb-3 border-b border-[#E3E9EF]">
            <div>
              <h3 className="text-base font-bold text-[#20242B]">Supervisory Practice Records</h3>
              <p className="text-xs text-[#737D8B]">
                Confidential performance appraisals & competency reviews recorded by practice management
              </p>
            </div>
            <Badge variant="secondary" size="sm" isMono>
              {privateRecords.length} Records
            </Badge>
          </div>
          <div>
            {isLoadingRecords ? (
              <div className="py-8 text-center text-xs text-[#737D8B]">
                Loading confidential records...
              </div>
            ) : privateRecords.length === 0 ? (
              <div className="p-5 text-center text-xs text-[#737D8B] bg-[#EEF3F7] rounded-[16px] border border-[#E3E9EF]">
                No supervisory records have been logged yet by practice management.
              </div>
            ) : (
              <div className="space-y-3">
                {privateRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-[16px] bg-[#EEF3F7]/50 border border-[#E3E9EF] shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-[#20242B]" />
                        <span className="font-semibold text-sm text-[#20242B]">
                          {rec.title}
                        </span>
                      </div>
                      {rec.confidentialSalaryOrBonusTier && (
                        <Badge variant="success" size="sm" isMono>
                          {rec.confidentialSalaryOrBonusTier}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#737D8B] leading-relaxed">
                      {rec.notes}
                    </p>
                    <div className="text-[10px] text-[#737D8B] font-mono">
                      Recorded: {new Date(rec.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal for inspecting coaching feedback */}
      {activeReview && (
        <AssessmentReportModal
          open={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          assessment={activeReview}
          scenarioTitle={activeSessionMeta?.title}
          scenarioCategory={activeSessionMeta?.category}
        />
      )}
    </AppShell>
  );
}
