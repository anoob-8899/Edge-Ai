"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Award,
  Sparkles,
  UserPlus,
  Glasses,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Lock,
  Calendar,
  BookOpen,
  CheckCircle2,
  XCircle,
  Layers,
  HelpCircle,
  FileText,
  History,
  Send,
  Eye,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag,
  Trophy,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { OwnerChallengesSection } from "@/components/challenges/owner-challenges-section";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/auth-context";
import { OwnerAnalyticsOverview } from "@/components/owner/owner-analytics-overview";

// ==========================================
// TYPES
// ==========================================

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  clinicId?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
  privateRecords?: {
    id: string;
    title: string;
    notes: string;
    confidentialSalaryOrBonusTier?: string | null;
  }[];
}

interface AssignmentItem {
  id: string;
  assignedById: string;
  assignedToId: string;
  targetGroup?: string | null;
  activityType: "LESSON" | "QUIZ" | "OPTICOACH_SCENARIO";
  lessonId?: string | null;
  scenarioId?: string | null;
  scenarioTitle?: string | null;
  title: string;
  notes?: string | null;
  dueDate?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
  completedAt?: string | null;
  createdAt: string;
  assignedTo: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  assignedBy?: {
    name: string;
  };
  lesson?: {
    id: string;
    title: string;
    slug: string;
  };
}

interface BrandItem {
  id: string;
  slug: string;
  name: string;
  parentCompany?: string | null;
  countryOfOrigin?: string | null;
  heritage?: string | null;
  websiteUrl?: string | null;
  totalModels: number;
  approvedCount: number;
  pendingCount: number;
  unverifiedCount: number;
}

interface ModelItem {
  id: string;
  brandId: string;
  officialProductName: string;
  modelCode: string;
  subName?: string | null;
  slug: string;
  category: string;
  gender?: string | null;
  frameShape: string;
  frameShapeVerified: boolean;
  frameMaterial?: string | null;
  frameMaterialVerified: boolean;
  frameFinish?: string | null;
  frameFinishVerified: boolean;
  lensColor?: string | null;
  lensColorVerified: boolean;
  lensMaterial?: string | null;
  lensMaterialVerified: boolean;
  uvProtection?: string | null;
  uvProtectionVerified: boolean;
  isPolarized?: boolean | null;
  polarizationVerified: boolean;
  lensTechnology?: string | null;
  lensTechnologyVerified: boolean;
  dimensionsVerified: boolean;
  lensWidthMm?: number | null;
  bridgeWidthMm?: number | null;
  templeLengthMm?: number | null;
  lensHeightMm?: number | null;
  verificationStatus: "VERIFIED" | "PARTIALLY_VERIFIED" | "UNVERIFIED";
  approvalStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  approvedBy?: string | null;
  approvedAt?: string | null;
  reviewNotes?: string | null;
  opticalLearningNotes?: string | null;
  createdAt: string;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
}

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  orderIndex: number;
  subcategories: {
    id: string;
    slug: string;
    name: string;
    description: string;
    lessons: {
      id: string;
      title: string;
      slug: string;
      orderIndex: number;
      isPublished: boolean;
      _count: { quizQuestions: number };
    }[];
  }[];
}

interface QuizQuestionItem {
  id: string;
  lessonId: string;
  question: string;
  options: string;
  correctOptionIndex: number;
  explanation: string;
  orderIndex: number;
  lesson: {
    id: string;
    title: string;
    slug: string;
  };
}

interface StaffProgressReport {
  id: string;
  name: string;
  email: string;
  status: string;
  joinedAt: string;
  lastActiveAt?: string | null;
  lessons: {
    completed: number;
    inProgress: number;
    totalAvailable: number;
    completionPercentage: number;
  };
  quizzes: {
    totalAttempts: number;
    passedCount: number;
    averageScorePercent?: number | null;
  };
  optiCoach: {
    completedCount: number;
    averageScore?: number | null;
  };
  assignments: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
}

interface AssessmentReportData {
  sessions: {
    id: string;
    staffId: string;
    staffName: string;
    staffEmail: string;
    scenarioId: string;
    scenarioTitle: string;
    scenarioCategory: string;
    score?: number | null;
    durationSeconds: number;
    feedbackSummary?: string | null;
    completedAt?: string | null;
  }[];
  learningGaps: {
    staffId: string;
    staffName: string;
    area: string;
    category: string;
    severity: "MODERATE" | "HIGH";
    observedIn: string;
    notes: string;
    detectedAt: string;
  }[];
}

interface AuditLogItem {
  id: string;
  userId?: string | null;
  action: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function OwnerDashboardPage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "staff" | "challenges" | "assignments" | "approvals" | "catalogue" | "curriculum" | "reports" | "assessments" | "audit"
  >("overview");

  // Data states
  const [staffList, setStaffList] = React.useState<StaffMember[]>([]);
  const [assignments, setAssignments] = React.useState<AssignmentItem[]>([]);
  const [brands, setBrands] = React.useState<BrandItem[]>([]);
  const [models, setModels] = React.useState<ModelItem[]>([]);
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [quizQuestions, setQuizQuestions] = React.useState<QuizQuestionItem[]>([]);
  const [reports, setReports] = React.useState<StaffProgressReport[]>([]);
  const [assessmentData, setAssessmentData] = React.useState<AssessmentReportData>({ sessions: [], learningGaps: [] });
  const [auditLogs, setAuditLogs] = React.useState<AuditLogItem[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Dialog States
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = React.useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = React.useState(false);
  const [selectedModelForReview, setSelectedModelForReview] = React.useState<ModelItem | null>(null);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = React.useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = React.useState(false);

  // Enroll Staff Form
  const [inviteName, setInviteName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [invitePassword, setInvitePassword] = React.useState("");
  const [invitePrivateNote, setInvitePrivateNote] = React.useState("");
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = React.useState<string | null>(null);

  // Create Assignment Form
  const [assignTitle, setAssignTitle] = React.useState("");
  const [assignActivityType, setAssignActivityType] = React.useState<"LESSON" | "QUIZ" | "OPTICOACH_SCENARIO">("LESSON");
  const [assignLessonId, setAssignLessonId] = React.useState("");
  const [assignScenarioId, setAssignScenarioId] = React.useState("");
  const [assignTargetType, setAssignTargetType] = React.useState<"INDIVIDUAL" | "GROUP">("GROUP");
  const [assignTargetStaffId, setAssignTargetStaffId] = React.useState("");
  const [assignDueDate, setAssignDueDate] = React.useState("");
  const [assignNotes, setAssignNotes] = React.useState("");

  // Review & Approve Form
  const [reviewDecision, setReviewDecision] = React.useState<"APPROVED" | "REJECTED" | "PENDING_REVIEW">("APPROVED");
  const [reviewNotes, setReviewNotes] = React.useState("");
  const [verifiedShape, setVerifiedShape] = React.useState(true);
  const [verifiedMaterial, setVerifiedMaterial] = React.useState(false);
  const [verifiedColor, setVerifiedColor] = React.useState(false);
  const [verifiedLensMat, setVerifiedLensMat] = React.useState(false);
  const [verifiedUv, setVerifiedUv] = React.useState(false);
  const [verifiedPol, setVerifiedPol] = React.useState(false);
  const [verifiedDim, setVerifiedDim] = React.useState(false);

  // Add Brand Form
  const [brandName, setBrandName] = React.useState("");
  const [brandSlug, setBrandSlug] = React.useState("");
  const [brandOrigin, setBrandOrigin] = React.useState("");
  const [brandParent, setBrandParent] = React.useState("");
  const [brandHeritage, setBrandHeritage] = React.useState("");
  const [brandWebsite, setBrandWebsite] = React.useState("");

  // Add Category Form
  const [categoryName, setCategoryName] = React.useState("");
  const [categorySlug, setCategorySlug] = React.useState("");
  const [categoryDesc, setCategoryDesc] = React.useState("");

  // Add Quiz Question Form
  const [quizLessonId, setQuizLessonId] = React.useState("");
  const [quizQuestionText, setQuizQuestionText] = React.useState("");
  const [quizOpt0, setQuizOpt0] = React.useState("");
  const [quizOpt1, setQuizOpt1] = React.useState("");
  const [quizOpt2, setQuizOpt2] = React.useState("");
  const [quizOpt3, setQuizOpt3] = React.useState("");
  const [quizCorrectIdx, setQuizCorrectIdx] = React.useState(0);
  const [quizExplanation, setQuizExplanation] = React.useState("");

  // Fetch all initial data
  const loadAllData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        staffRes,
        assignRes,
        brandsRes,
        modelsRes,
        catRes,
        quizRes,
        reportsRes,
        assessRes,
        auditRes,
      ] = await Promise.all([
        fetch("/api/owner/staff"),
        fetch("/api/owner/assignments"),
        fetch("/api/owner/catalogue/brands"),
        fetch("/api/owner/catalogue/models"),
        fetch("/api/owner/library/categories"),
        fetch("/api/owner/library/quizzes"),
        fetch("/api/owner/reports/progress"),
        fetch("/api/owner/reports/assessments"),
        fetch("/api/owner/audit-logs"),
      ]);

      if (staffRes.ok) {
        const d = await staffRes.json();
        setStaffList(d.staff || []);
      }
      if (assignRes.ok) {
        const d = await assignRes.json();
        setAssignments(d.assignments || []);
      }
      if (brandsRes.ok) {
        const d = await brandsRes.json();
        setBrands(d.brands || []);
      }
      if (modelsRes.ok) {
        const d = await modelsRes.json();
        setModels(d.models || []);
      }
      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories || []);
      }
      if (quizRes.ok) {
        const d = await quizRes.json();
        setQuizQuestions(d.questions || []);
      }
      if (reportsRes.ok) {
        const d = await reportsRes.json();
        setReports(d.reports || []);
      }
      if (assessRes.ok) {
        const d = await assessRes.json();
        setAssessmentData(d);
      }
      if (auditRes.ok) {
        const d = await auditRes.json();
        setAuditLogs(d.auditLogs || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const isOwnerRole = role?.toUpperCase() === "OWNER" || role?.toUpperCase() === "ADMIN";
    if (isOwnerRole) {
      loadAllData();
    }
  }, [role, loadAllData]);

  // Handlers
  const handleToggleStaffStatus = async (staffId: string, currentStatus: "ACTIVE" | "SUSPENDED" | "INVITED") => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setActionLoading(true);
    try {
      const res = await fetch(`/api/owner/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error("Failed to toggle staff status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnrollStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const res = await fetch("/api/owner/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          password: invitePassword,
          initialPrivateNote: invitePrivateNote || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (data.details ? data.details[0] : "Failed to enroll optician"));
      }

      setInviteSuccess(`Successfully enrolled ${inviteName}!`);
      setInviteName("");
      setInviteEmail("");
      setInvitePassword("");
      setInvitePrivateNote("");
      loadAllData();
      setTimeout(() => {
        setIsInviteDialogOpen(false);
        setInviteSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setInviteError(e.message || "Failed to enroll staff member.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      let scenarioTitle: string | undefined = undefined;
      if (assignActivityType === "OPTICOACH_SCENARIO") {
        scenarioTitle = assignScenarioId || "AI Sales Coach Consultation";
      }

      const res = await fetch("/api/owner/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType: assignActivityType,
          lessonId: assignActivityType !== "OPTICOACH_SCENARIO" ? assignLessonId : undefined,
          scenarioId: assignActivityType === "OPTICOACH_SCENARIO" ? assignScenarioId : undefined,
          scenarioTitle,
          title: assignTitle,
          notes: assignNotes || undefined,
          dueDate: assignDueDate ? new Date(assignDueDate).toISOString() : undefined,
          targetType: assignTargetType,
          assignedToId: assignTargetType === "INDIVIDUAL" ? assignTargetStaffId : undefined,
          targetGroup: assignTargetType === "GROUP" ? "ALL_STAFF" : undefined,
        }),
      });

      if (res.ok) {
        setIsAssignmentDialogOpen(false);
        setAssignTitle("");
        setAssignNotes("");
        setAssignDueDate("");
        loadAllData();
      }
    } catch (err) {
      console.error("Failed to create assignment:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReview = (model: ModelItem) => {
    setSelectedModelForReview(model);
    setReviewDecision(model.approvalStatus);
    setReviewNotes(model.reviewNotes || "");
    setVerifiedShape(model.frameShapeVerified);
    setVerifiedMaterial(model.frameMaterialVerified);
    setVerifiedColor(model.lensColorVerified);
    setVerifiedLensMat(model.lensMaterialVerified);
    setVerifiedUv(model.uvProtectionVerified);
    setVerifiedPol(model.polarizationVerified);
    setVerifiedDim(model.dimensionsVerified);
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedModelForReview) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/owner/catalogue/models/${selectedModelForReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalStatus: reviewDecision,
          reviewNotes,
          frameShapeVerified: verifiedShape,
          frameMaterialVerified: verifiedMaterial,
          lensColorVerified: verifiedColor,
          lensMaterialVerified: verifiedLensMat,
          uvProtectionVerified: verifiedUv,
          polarizationVerified: verifiedPol,
          dimensionsVerified: verifiedDim,
        }),
      });

      if (res.ok) {
        setIsReviewDialogOpen(false);
        loadAllData();
      }
    } catch (err) {
      console.error("Failed to update product approval:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/owner/catalogue/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brandName,
          slug: brandSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          countryOfOrigin: brandOrigin || undefined,
          parentCompany: brandParent || undefined,
          heritage: brandHeritage || undefined,
          websiteUrl: brandWebsite || undefined,
        }),
      });
      if (res.ok) {
        setIsBrandDialogOpen(false);
        setBrandName("");
        setBrandSlug("");
        setBrandOrigin("");
        setBrandParent("");
        setBrandHeritage("");
        setBrandWebsite("");
        loadAllData();
      }
    } catch (err) {
      console.error("Failed to add brand:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/owner/library/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName,
          slug: categorySlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          description: categoryDesc,
        }),
      });
      if (res.ok) {
        setIsCategoryDialogOpen(false);
        setCategoryName("");
        setCategorySlug("");
        setCategoryDesc("");
        loadAllData();
      }
    } catch (err) {
      console.error("Failed to create category:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddQuizQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const optionsArr = [quizOpt0, quizOpt1, quizOpt2, quizOpt3].filter(Boolean);
      const res = await fetch("/api/owner/library/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: quizLessonId,
          question: quizQuestionText,
          options: optionsArr,
          correctOptionIndex: quizCorrectIdx,
          explanation: quizExplanation,
        }),
      });
      if (res.ok) {
        setIsQuizDialogOpen(false);
        setQuizQuestionText("");
        setQuizOpt0("");
        setQuizOpt1("");
        setQuizOpt2("");
        setQuizOpt3("");
        setQuizExplanation("");
        loadAllData();
      }
    } catch (err) {
      console.error("Failed to create quiz question:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuizQuestion = async (id: string) => {
    if (!confirm("Remove this quiz question from the lesson?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/owner/library/quizzes/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error("Failed to delete quiz question:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Check role authorization on client
  const isOwner = role?.toUpperCase() === "OWNER" || role?.toUpperCase() === "ADMIN";
  if (!authLoading && role && !isOwner) {
    return (
      <AppShell title="Owner Operations Hub" subtitle="Practice management & oversight">
        <div className="max-w-2xl mx-auto my-12">
          <Card variant="glass" className="border-red-200 p-6 md:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 text-[#C83F4F] flex items-center justify-center mx-auto">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-[#172B4D]">Access Restricted to Practice Owners</h2>
            <p className="text-sm text-[#65758B] leading-relaxed">
              You are signed in as <strong className="text-[#172B4D]">{user?.name}</strong> with role{" "}
              <Badge variant="secondary" size="sm" isMono>{user?.role}</Badge>.
              Optical store financials, staff rosters, and management controls are restricted to Practice Owners.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/staff">
                <Button variant="primary" size="md">
                  <span>Return to Staff Dashboard</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Filter pending review models
  const pendingModels = models.filter((m) => m.approvalStatus === "PENDING_REVIEW");
  const allLessons = categories.flatMap((c) => c.subcategories.flatMap((s) => s.lessons));

  return (
    <AppShell
      title="Practice Owner Operations Hub"
      subtitle="Staff administration, learning assignments, optical catalogue approvals & audit verification"
    >
      <div className="space-y-6">
        {/* Practice Management Banner */}
        <div className="rounded-[20px] p-6 md:p-8 bg-gradient-to-r from-white/95 via-[#F0F7FF]/90 to-[#E8F3FF]/85 border border-[#DCE8F5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                Owner Administration
              </Badge>
              <Badge variant="secondary" size="sm" isMono>
                {user?.clinicId || "APEX-OPTICS-HQ"}
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#172B4D] tracking-tight">
              Apex Eye Care & Optical Dispensary
            </h1>
            <p className="text-sm text-[#65758B] max-w-xl">
              Real-time oversight of staff opticians, active assignments, product approvals, and verified clinical audit trails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsInviteDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              <span>Enroll Optician</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsAssignmentDialogOpen(true)}
            >
              <Calendar className="h-4 w-4 text-[#4285F4]" />
              <span>Assign Learning</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={loadAllData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 text-[#4285F4] ${isLoading ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </Button>
          </div>
        </div>

        {/* Global KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8796AA]">
                <span>ENROLLED OPTICIANS</span>
                <Users className="h-4 w-4 text-[#4285F4]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-[#172B4D] font-mono">
                {staffList.length}
              </div>
              <p className="mt-1 text-xs text-[#8796AA]">
                {staffList.filter((s) => s.status === "ACTIVE").length} active in PostgreSQL
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8796AA]">
                <span>ACTIVE ASSIGNMENTS</span>
                <Clock className="h-4 w-4 text-[#A96A08]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-[#172B4D] font-mono">
                {assignments.filter((a) => a.status === "PENDING" || a.status === "IN_PROGRESS").length}
              </div>
              <p className="mt-1 text-xs text-[#8796AA]">
                {assignments.filter((a) => a.status === "COMPLETED").length} completed
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8796AA]">
                <span>AWAITING APPROVAL</span>
                <Eye className="h-4 w-4 text-[#C83F4F]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-[#C83F4F] font-mono">
                {pendingModels.length}
              </div>
              <p className="mt-1 text-xs text-[#8796AA]">
                {models.filter((m) => m.approvalStatus === "APPROVED").length} approved models
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8796AA]">
                <span>AUDIT TRAIL LOGS</span>
                <ShieldCheck className="h-4 w-4 text-[#16865C]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-[#16865C] font-mono">
                {auditLogs.length}
              </div>
              <p className="mt-1 text-xs text-[#8796AA]">
                Strict server enforcement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation Navigation (Pill Filter Bar matching Reference 1 & 2) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E3E9EF]">
          {[
            { id: "overview", label: "Overview & Analytics", icon: TrendingUp },
            { id: "staff", label: `Staff Accounts (${staffList.length})`, icon: Users },
            { id: "challenges", label: "Weekly Challenges", icon: Trophy },
            { id: "assignments", label: `Assignments (${assignments.length})`, icon: Calendar },
            {
              id: "approvals",
              label: `Pending Approvals (${pendingModels.length})`,
              icon: Eye,
              badge: pendingModels.length > 0 ? pendingModels.length : undefined,
            },
            { id: "catalogue", label: `Catalogue & Brands (${brands.length})`, icon: Glasses },
            { id: "curriculum", label: `Curriculum & Quizzes (${categories.length})`, icon: BookOpen },
            { id: "reports", label: "Progress Reports", icon: Award },
            { id: "assessments", label: `Gaps & Simulations (${assessmentData.learningGaps.length})`, icon: Sparkles },
            { id: "audit", label: `Audit Log (${auditLogs.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#242629] text-white shadow-xs"
                    : "bg-white text-[#20242B] border border-[#E3E9EF] hover:bg-[#EEF3F7]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#FFD95E] text-[#20242B] text-[10px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & STAFF PERFORMANCE ANALYTICS (Reference 2 Crextio Layout) */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {pendingModels.length > 0 && (
              <div className="p-4 rounded-[18px] bg-[#FFF0C2] border border-[#FBE19A] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white/70 text-[#7A5300]">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#7A5300]">
                      {pendingModels.length} Sunglasses Models Awaiting Practice Approval
                    </h4>
                    <p className="text-[11px] text-[#7A5300]/80">
                      Technical specifications require owner sign-off before being featured in staff dispensing simulations.
                    </p>
                  </div>
                </div>
                <Button
                  variant="dark"
                  size="sm"
                  pill
                  onClick={() => setActiveTab("approvals")}
                  className="shrink-0 text-xs"
                >
                  <span>Review Now</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <OwnerAnalyticsOverview
              staffList={staffList}
              reports={reports}
              assignments={assignments}
              onSelectTab={(tab) => setActiveTab(tab as any)}
              onEnrollStaff={() => setIsInviteDialogOpen(true)}
              onNewAssignment={() => setIsAssignmentDialogOpen(true)}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: STAFF ACCOUNT MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Optical Staff Roster & Supervisory Controls</CardTitle>
                  <CardDescription>
                    Manage active staff opticians, activation states, and confidential supervisory notes
                  </CardDescription>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  <span>Enroll Staff Optician</span>
                </Button>
              </CardHeader>
              <CardContent>
                {staffList.length === 0 ? (
                  <EmptyState
                    icon={<Users className="h-6 w-6" />}
                    badgeText="NO OPTICIANS"
                    title="No Staff Accounts Found"
                    description="Enroll dispensing opticians to assign optical training modules."
                    action={
                      <Button variant="primary" size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                        <UserPlus className="h-4 w-4" />
                        <span>Enroll First Optician</span>
                      </Button>
                    }
                  />
                ) : (
                  <div className="divide-y divide-[#DCE8F5]">
                    {staffList.map((staff) => (
                      <div
                        key={staff.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[#172B4D]">{staff.name}</span>
                            <Badge variant="secondary" size="sm">{staff.role}</Badge>
                            <Badge
                              variant={staff.status === "ACTIVE" ? "success" : "neutral"}
                              size="sm"
                              isMono
                            >
                              {staff.status}
                            </Badge>
                            <span className="text-xs text-[#8796AA]">
                              Clinic: {staff.clinicId || "HQ"}
                            </span>
                          </div>
                          <div className="text-xs text-[#65758B] flex items-center gap-2">
                            <span>{staff.email}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-[#8796AA]">
                              Enrolled: {new Date(staff.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Private Records (Owner Only) */}
                          {staff.privateRecords && staff.privateRecords.length > 0 && (
                            <div className="mt-2 p-2.5 rounded-lg bg-[#F0F7FF] border border-[#DCE8F5] text-xs space-y-1">
                              <div className="flex items-center gap-1.5 font-semibold text-[#172B4D]">
                                <Lock className="h-3 w-3 text-[#4285F4]" />
                                <span>Confidential Supervisory Record:</span>
                                {staff.privateRecords[0].confidentialSalaryOrBonusTier && (
                                  <span className="text-[#16865C] font-mono text-[11px]">
                                    [{staff.privateRecords[0].confidentialSalaryOrBonusTier}]
                                  </span>
                                )}
                              </div>
                              <p className="text-[#65758B] text-[11px]">{staff.privateRecords[0].notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant={staff.status === "ACTIVE" ? "outline" : "primary"}
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleToggleStaffStatus(staff.id, staff.status)}
                          >
                            {staff.status === "ACTIVE" ? "Deactivate Account" : "Activate Account"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: WEEKLY CHALLENGES */}
        {/* ========================================================================= */}
        {activeTab === "challenges" && (
          <OwnerChallengesSection />
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LEARNING ASSIGNMENTS */}
        {/* ========================================================================= */}
        {activeTab === "assignments" && (
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Staff Learning Assignments & Deadlines</CardTitle>
                  <CardDescription>
                    Assign optical lessons, quizzes, or AI Sales Coach clinical scenarios to individual opticians or the entire staff group
                  </CardDescription>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsAssignmentDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span>Create Assignment</span>
                </Button>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <EmptyState
                    icon={<Calendar className="h-6 w-6" />}
                    badgeText="NO ASSIGNMENTS"
                    title="No Learning Assignments Created"
                    description="Dispatch targeted optical curriculum lessons or patient simulation scenarios to staff opticians."
                    action={
                      <Button variant="primary" size="sm" onClick={() => setIsAssignmentDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        <span>Create First Assignment</span>
                      </Button>
                    }
                  />
                ) : (
                  <div className="divide-y divide-[#DCE8F5]">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[#172B4D]">{assignment.title}</span>
                            <Badge
                              variant={
                                assignment.status === "COMPLETED"
                                  ? "success"
                                  : assignment.status === "OVERDUE"
                                  ? "error"
                                  : "neutral"
                              }
                              size="sm"
                              isMono
                            >
                              {assignment.status}
                            </Badge>
                            <Badge variant="secondary" size="sm">
                              {assignment.activityType}
                            </Badge>
                            {assignment.targetGroup && (
                              <Badge variant="primary" size="sm">
                                Group: {assignment.targetGroup}
                              </Badge>
                            )}
                          </div>
                          {assignment.notes && (
                            <p className="text-xs text-[#65758B] leading-relaxed">{assignment.notes}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-[#8796AA] font-mono flex-wrap">
                            <span>Assignee: <strong>{assignment.assignedTo.name}</strong></span>
                            {assignment.dueDate && (
                              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                            )}
                            {assignment.completedAt && (
                              <span className="text-[#16865C]">
                                Completed: {new Date(assignment.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" size="sm" isMono>
                            {assignment.assignedTo.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CONTENT AWAITING APPROVAL */}
        {/* ========================================================================= */}
        {activeTab === "approvals" && (
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Content Awaiting Owner Review & Specification Approval</CardTitle>
                  <CardDescription>
                    Eyewear models and technical optical specifications requiring practice sign-off
                  </CardDescription>
                </div>
                <Badge variant="primary" size="sm" isMono>
                  {pendingModels.length} Models Pending
                </Badge>
              </CardHeader>
              <CardContent>
                {pendingModels.length === 0 ? (
                  <EmptyState
                    icon={<CheckCircle2 className="h-6 w-6 text-[#16865C]" />}
                    badgeText="ALL REVIEWS COMPLETE"
                    title="No Content Awaiting Review"
                    description="All product specifications, lens materials, and frame geometries have been verified and approved."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingModels.map((model) => (
                      <div
                        key={model.id}
                        className="p-4 rounded-xl bg-white/90 border border-[#DCE8F5] shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" size="sm">
                            {model.brand.name}
                          </Badge>
                          <Badge variant="error" size="sm" isMono>
                            {model.approvalStatus}
                          </Badge>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-[#172B4D]">
                            {model.officialProductName}
                          </h4>
                          <span className="text-xs text-[#8796AA] font-mono">
                            Model Code: {model.modelCode}
                          </span>
                        </div>

                        {/* Verification matrix badges */}
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          <span className={`px-2 py-0.5 rounded ${model.frameShapeVerified ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                            Shape: {model.frameShape} {model.frameShapeVerified ? "✓" : "?"}
                          </span>
                          <span className={`px-2 py-0.5 rounded ${model.frameMaterialVerified ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                            Material: {model.frameMaterial || "Unknown"} {model.frameMaterialVerified ? "✓" : "?"}
                          </span>
                          <span className={`px-2 py-0.5 rounded ${model.polarizationVerified ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                            Polarized: {model.isPolarized ? "Yes" : "No"} {model.polarizationVerified ? "✓" : "?"}
                          </span>
                          <span className={`px-2 py-0.5 rounded ${model.uvProtectionVerified ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                            UV: {model.uvProtection || "Pending"} {model.uvProtectionVerified ? "✓" : "?"}
                          </span>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-[#DCE8F5]">
                          <span className="text-[11px] text-[#8796AA]">
                            Verification: <strong>{model.verificationStatus}</strong>
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenReview(model)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Review & Certify</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: BRAND & PRODUCT CATALOGUE MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === "catalogue" && (
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Brand Management & Dispensing Portfolio</CardTitle>
                  <CardDescription>
                    Registered eyewear brand manufacturers and specification status
                  </CardDescription>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsBrandDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span>Register Brand</span>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {brands.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-white/90 border border-[#DCE8F5] shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#172B4D]">{b.name}</span>
                        <Badge variant="primary" size="sm" isMono>
                          {b.totalModels} Models
                        </Badge>
                      </div>
                      <p className="text-xs text-[#65758B] line-clamp-2">
                        {b.heritage || "Premium optical manufacturer."}
                      </p>
                      <div className="text-[11px] text-[#8796AA] flex items-center justify-between pt-1 font-mono">
                        <span>Origin: {b.countryOfOrigin || "Italy / USA"}</span>
                        <span className="text-[#16865C]">{b.approvedCount} Approved</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CURRICULUM & QUIZZES */}
        {/* ========================================================================= */}
        {activeTab === "curriculum" && (
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Optical Learning Categories & Structured Modules</CardTitle>
                  <CardDescription>
                    Core dispensing categories, subcategories, lessons, and clinical competencies
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsCategoryDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Category</span>
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsQuizDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Quiz Question</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="p-4 rounded-xl bg-white/80 border border-[#DCE8F5] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Glasses className="h-4 w-4 text-[#4285F4]" />
                          <h4 className="font-bold text-sm text-[#172B4D]">{cat.name}</h4>
                        </div>
                        <Badge variant="secondary" size="sm">
                          {cat.subcategories.length} Subcategories
                        </Badge>
                      </div>
                      <p className="text-xs text-[#65758B]">{cat.description}</p>

                      <div className="pl-4 border-l-2 border-[#DCE8F5] space-y-2 mt-2">
                        {cat.subcategories.map((sub) => (
                          <div key={sub.id} className="text-xs space-y-1">
                            <span className="font-semibold text-[#172B4D]">{sub.name}</span>
                            <div className="flex flex-wrap gap-2">
                              {sub.lessons.map((lesson) => (
                                <span
                                  key={lesson.id}
                                  className="px-2 py-1 rounded bg-[#F0F7FF] text-[#172B4D] text-[11px] border border-[#DCE8F5] flex items-center gap-1.5"
                                >
                                  <span>{lesson.title}</span>
                                  <Badge variant="primary" size="sm" isMono>
                                    {lesson._count.quizQuestions} Qs
                                  </Badge>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quiz Management Section */}
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Quiz Questions Bank ({quizQuestions.length})</CardTitle>
                  <CardDescription>
                    Technical assessment questions linked to specific lessons
                  </CardDescription>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsQuizDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span>Add Question</span>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-[#DCE8F5]">
                  {quizQuestions.map((q) => (
                    <div key={q.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-[#8796AA]">
                          Lesson: <strong className="text-[#172B4D]">{q.lesson.title}</strong>
                        </div>
                        <p className="text-xs font-semibold text-[#172B4D]">{q.question}</p>
                        <p className="text-[11px] text-[#65758B]">
                          Explanation: {q.explanation}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuizQuestion(q.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: STAFF PROGRESS REPORTS */}
        {/* ========================================================================= */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Staff Progress Reports & Optical Competency Analytics</CardTitle>
                  <CardDescription>
                    Real metrics derived from PostgreSQL activity records (strictly zero synthetic scores)
                  </CardDescription>
                </div>
                <Badge variant="success" size="sm" isMono>
                  Verified Real PostgreSQL Data
                </Badge>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <EmptyState
                    icon={<Award className="h-6 w-6" />}
                    badgeText="NO ACTIVITY"
                    title="No Staff Activity Recorded"
                    description="When staff opticians complete lessons, submit quizzes, and conduct AI Sales Coach simulations, real scores appear here."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F8FAFC] text-[#65758B] border-b border-[#DCE8F5]">
                        <tr>
                          <th className="p-3 font-semibold">Staff Optician</th>
                          <th className="p-3 font-semibold">Status</th>
                          <th className="p-3 font-semibold">Lessons Completed</th>
                          <th className="p-3 font-semibold">Quizzes Passed</th>
                          <th className="p-3 font-semibold">Avg Quiz Score</th>
                          <th className="p-3 font-semibold">AI Coach Sessions</th>
                          <th className="p-3 font-semibold">Avg Simulation Score</th>
                          <th className="p-3 font-semibold">Assignments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE8F5]">
                        {reports.map((r) => (
                          <tr key={r.id} className="hover:bg-[#F0F7FF]/50 transition-colors">
                            <td className="p-3 font-semibold text-[#172B4D]">
                              <div>{r.name}</div>
                              <span className="text-[11px] text-[#8796AA] font-normal">{r.email}</span>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={r.status === "ACTIVE" ? "success" : "neutral"}
                                size="sm"
                                isMono
                              >
                                {r.status}
                              </Badge>
                            </td>
                            <td className="p-3 font-mono">
                              {r.lessons.completed} / {r.lessons.totalAvailable} ({r.lessons.completionPercentage}%)
                            </td>
                            <td className="p-3 font-mono">
                              {r.quizzes.passedCount} / {r.quizzes.totalAttempts}
                            </td>
                            <td className="p-3 font-mono">
                              {r.quizzes.averageScorePercent !== null
                                ? `${r.quizzes.averageScorePercent}%`
                                : "N/A"}
                            </td>
                            <td className="p-3 font-mono">
                              {r.optiCoach.completedCount}
                            </td>
                            <td className="p-3 font-mono">
                              {r.optiCoach.averageScore !== null
                                ? `${r.optiCoach.averageScore}%`
                                : "N/A"}
                            </td>
                            <td className="p-3 font-mono">
                              {r.assignments.completed} / {r.assignments.total} ({r.assignments.completionRate}%)
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: ASSESSMENT HISTORY & LEARNING GAPS */}
        {/* ========================================================================= */}
        {activeTab === "assessments" && (
          <div className="space-y-6">
            {/* Identified Learning Gaps */}
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Identified Clinical & Technical Learning Gaps</CardTitle>
                  <CardDescription>
                    Real competency weaknesses detected from AI Sales Coach rubric criteria and failed quiz attempts
                  </CardDescription>
                </div>
                <Badge variant={assessmentData.learningGaps.length > 0 ? "error" : "success"} size="sm" isMono>
                  {assessmentData.learningGaps.length} Gaps Flagged
                </Badge>
              </CardHeader>
              <CardContent>
                {assessmentData.learningGaps.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8796AA] bg-[#F0F7FF] rounded-xl border border-[#DCE8F5]">
                    No critical learning gaps identified. Staff members are meeting optical competency standards.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assessmentData.learningGaps.map((gap, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white border border-[#DCE8F5] shadow-xs flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#172B4D]">{gap.area}</span>
                            <Badge
                              variant={gap.severity === "HIGH" ? "error" : "neutral"}
                              size="sm"
                              isMono
                            >
                              {gap.severity} PRIORITY
                            </Badge>
                            <span className="text-[#8796AA]">Staff: {gap.staffName}</span>
                          </div>
                          <p className="text-[#65758B]">{gap.notes}</p>
                          <div className="text-[11px] text-[#8796AA] font-mono">
                            Detected in: {gap.observedIn} • {new Date(gap.detectedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAssignTargetStaffId(gap.staffId);
                            setAssignTargetType("INDIVIDUAL");
                            setAssignTitle(`Targeted Practice: ${gap.area}`);
                            setIsAssignmentDialogOpen(true);
                          }}
                        >
                          <span>Assign Practice</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed AI Sales Coach Sessions History */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>AI Sales Coach Consultation History</CardTitle>
                <CardDescription>
                  Full simulation transcripts and scores stored in PostgreSQL
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assessmentData.sessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8796AA] bg-[#F0F7FF] rounded-xl border border-[#DCE8F5]">
                    No completed AI Sales Coach simulations logged yet in the database.
                  </div>
                ) : (
                  <div className="divide-y divide-[#DCE8F5]">
                    {assessmentData.sessions.map((sess) => (
                      <div key={sess.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-sm text-[#172B4D] flex items-center gap-2">
                            <span>{sess.scenarioTitle}</span>
                            <Badge variant="primary" size="sm">
                              Score: {sess.score !== null ? `${sess.score}%` : "Pending"}
                            </Badge>
                          </div>
                          <div className="text-[#65758B]">
                            Optician: <strong>{sess.staffName}</strong> ({sess.staffEmail}) • Duration: {Math.round(sess.durationSeconds / 60)} min
                          </div>
                          {sess.feedbackSummary && (
                            <p className="text-[11px] text-[#8796AA] italic line-clamp-1">
                              &ldquo;{sess.feedbackSummary}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-[#8796AA]">
                          {sess.completedAt ? new Date(sess.completedAt).toLocaleDateString() : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 9: ADMINISTRATIVE AUDIT HISTORY */}
        {/* ========================================================================= */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Administrative Audit Trail & Access Log</CardTitle>
                  <CardDescription>
                    Immutable PostgreSQL audit events recording management changes and access attempts
                  </CardDescription>
                </div>
                <Badge variant="secondary" size="sm" isMono>
                  {auditLogs.length} Records
                </Badge>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8796AA] bg-[#F0F7FF] rounded-xl border border-[#DCE8F5]">
                    No audit records logged yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F8FAFC] text-[#65758B] border-b border-[#DCE8F5]">
                        <tr>
                          <th className="p-3 font-semibold">Timestamp</th>
                          <th className="p-3 font-semibold">Action</th>
                          <th className="p-3 font-semibold">Actor</th>
                          <th className="p-3 font-semibold">IP Address</th>
                          <th className="p-3 font-semibold">Metadata</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE8F5]">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-[#F0F7FF]/50 transition-colors">
                            <td className="p-3 font-mono text-[11px] text-[#8796AA]">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="p-3 font-mono">
                              <Badge variant="secondary" size="sm" isMono>
                                {log.action}
                              </Badge>
                            </td>
                            <td className="p-3 font-semibold text-[#172B4D]">
                              {log.user ? `${log.user.name} (${log.user.role})` : "System / Unauthenticated"}
                            </td>
                            <td className="p-3 font-mono text-[#8796AA]">
                              {log.ipAddress || "127.0.0.1"}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-[#65758B] max-w-xs truncate">
                              {log.metadata ? JSON.stringify(log.metadata) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ENROLL STAFF OPTICIAN */}
      {/* ========================================================================= */}
      <Dialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        title="Enroll Optical Staff Optician"
        description="Create an active staff account with secure credentials and an optional confidential onboarding note."
      >
        <form onSubmit={handleEnrollStaff} className="space-y-3 pt-2">
          {inviteError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C83F4F] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{inviteError}</span>
            </div>
          )}
          {inviteSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#16865C] flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{inviteSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">
              Optician Full Name
            </label>
            <Input
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Jordan Hayes (Dispensing Optician)"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">
              Store Email Address
            </label>
            <Input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="jordan.hayes@apex-optics.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">
              Initial Password (min 8 characters)
            </label>
            <Input
              type="password"
              required
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">
              Confidential Onboarding Note (Owner Eyes Only)
            </label>
            <Input
              value={invitePrivateNote}
              onChange={(e) => setInvitePrivateNote(e.target.value)}
              placeholder="e.g. Starting dispensing tier. Assigned progressive certification."
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={actionLoading}>
              <UserPlus className="h-4 w-4" />
              <span>{actionLoading ? "Enrolling..." : "Enroll Optician"}</span>
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE LEARNING ASSIGNMENT */}
      {/* ========================================================================= */}
      <Dialog
        open={isAssignmentDialogOpen}
        onOpenChange={setIsAssignmentDialogOpen}
        title="Assign Optical Learning Activity"
        description="Dispatch educational modules, quizzes, or patient consultation simulations with deadlines."
      >
        <form onSubmit={handleCreateAssignment} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Assignment Title</label>
            <Input
              required
              value={assignTitle}
              onChange={(e) => setAssignTitle(e.target.value)}
              placeholder="e.g. Mandatory Progressive Adaptation Certification"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">Activity Type</label>
              <select
                value={assignActivityType}
                onChange={(e) => setAssignActivityType(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-[#DCE8F5] p-2.5 bg-white text-[#172B4D] outline-hidden focus:border-[#4285F4]"
              >
                <option value="LESSON">Optical Lesson</option>
                <option value="QUIZ">Quiz Knowledge Check</option>
                <option value="OPTICOACH_SCENARIO">AI Sales Coach Simulation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">Target Audience</label>
              <select
                value={assignTargetType}
                onChange={(e) => setAssignTargetType(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-[#DCE8F5] p-2.5 bg-white text-[#172B4D] outline-hidden focus:border-[#4285F4]"
              >
                <option value="GROUP">Entire Staff Group (All Active Staff)</option>
                <option value="INDIVIDUAL">Individual Staff Optician</option>
              </select>
            </div>
          </div>

          {assignTargetType === "INDIVIDUAL" && (
            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">Select Optician</label>
              <select
                required
                value={assignTargetStaffId}
                onChange={(e) => setAssignTargetStaffId(e.target.value)}
                className="w-full text-xs rounded-xl border border-[#DCE8F5] p-2.5 bg-white text-[#172B4D] outline-hidden focus:border-[#4285F4]"
              >
                <option value="">Choose an active staff member...</option>
                {staffList.filter((s) => s.status === "ACTIVE").map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {assignActivityType !== "OPTICOACH_SCENARIO" ? (
            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">Select Lesson Module</label>
              <select
                value={assignLessonId}
                onChange={(e) => setAssignLessonId(e.target.value)}
                className="w-full text-xs rounded-xl border border-[#DCE8F5] p-2.5 bg-white text-[#172B4D] outline-hidden focus:border-[#4285F4]"
              >
                <option value="">Choose a curriculum lesson...</option>
                {allLessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">AI Sales Coach Scenario</label>
              <select
                value={assignScenarioId}
                onChange={(e) => setAssignScenarioId(e.target.value)}
                className="w-full text-xs rounded-xl border border-[#DCE8F5] p-2.5 bg-white text-[#172B4D] outline-hidden focus:border-[#4285F4]"
              >
                <option value="">Choose patient scenario...</option>
                <option value="first-time-buyer">Maya Lin (First-Time Eyewear Buyer)</option>
                <option value="lens-upgrade-discussion">Arthur Pendelton (Lens Upgrade Discussion)</option>
                <option value="comparing-branded-sunglasses">Jordan Reed (Customer Comparing Branded Sunglasses)</option>
                <option value="polarization-inquiry">David Kim (Customer Asking About Polarization)</option>
                <option value="uv-protection-inquiry">Sophia Martinez (Customer Asking About UV Protection)</option>
                <option value="frame-styling-ergonomics">Priya Patel (Customer Unsure Which Frame Suits Needs)</option>
                <option value="budget-conscious-buyer">Kevin Miller (Budget-Conscious Customer)</option>
                <option value="customer-objection-handling">Marcus Vance (Handling a Customer Objection)</option>
                <option value="comprehensive-product-knowledge">Brenda Wallace (General Product Knowledge Practice)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Assignment Due Date (Deadline)</label>
            <Input
              type="date"
              value={assignDueDate}
              onChange={(e) => setAssignDueDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Owner Guidance & Instructions</label>
            <Textarea
              rows={2}
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="e.g. Please review Abbe values and index tradeoffs prior to Monday store shift."
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={actionLoading}>
              <Send className="h-4 w-4" />
              <span>{actionLoading ? "Dispatching..." : "Dispatch Assignment"}</span>
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: REVIEW & APPROVE PRODUCT SPECIFICATION */}
      {/* ========================================================================= */}
      {selectedModelForReview && (
        <Dialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          title="Product Specification Review & Sign-Off"
          description={`${selectedModelForReview.brand.name} • ${selectedModelForReview.officialProductName} (${selectedModelForReview.modelCode})`}
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-[#172B4D] block mb-1">Approval Decision</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewDecision("APPROVED")}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    reviewDecision === "APPROVED"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200"
                      : "bg-white border-[#DCE8F5] text-[#65758B]"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewDecision("PENDING_REVIEW")}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    reviewDecision === "PENDING_REVIEW"
                      ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-200"
                      : "bg-white border-[#DCE8F5] text-[#65758B]"
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Hold Pending</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewDecision("REJECTED")}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    reviewDecision === "REJECTED"
                      ? "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-200"
                      : "bg-white border-[#DCE8F5] text-[#65758B]"
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Reject</span>
                </button>
              </div>
            </div>

            {/* Specification Checkmarks */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#172B4D] block">
                Technical Specification Certification Checkmarks
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#DCE8F5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedShape}
                    onChange={(e) => setVerifiedShape(e.target.checked)}
                    className="rounded text-[#4285F4]"
                  />
                  <span>Shape: {selectedModelForReview.frameShape}</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#DCE8F5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedMaterial}
                    onChange={(e) => setVerifiedMaterial(e.target.checked)}
                    className="rounded text-[#4285F4]"
                  />
                  <span>Material: {selectedModelForReview.frameMaterial || "Acetate/Metal"}</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#DCE8F5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedColor}
                    onChange={(e) => setVerifiedColor(e.target.checked)}
                    className="rounded text-[#4285F4]"
                  />
                  <span>Lens Color: {selectedModelForReview.lensColor || "G-15 / Grey"}</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#DCE8F5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedLensMat}
                    onChange={(e) => setVerifiedLensMat(e.target.checked)}
                    className="rounded text-[#4285F4]"
                  />
                  <span>Lens Mat: {selectedModelForReview.lensMaterial || "Crystal"}</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#DCE8F5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedUv}
                    onChange={(e) => setVerifiedUv(e.target.checked)}
                    className="rounded text-[#4285F4]"
                  />
                  <span>UV Protection Verified</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#DCE8F5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedPol}
                    onChange={(e) => setVerifiedPol(e.target.checked)}
                    className="rounded text-[#4285F4]"
                  />
                  <span>Polarization Verified</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                Owner Dispensing & Educational Feedback Notes
              </label>
              <Textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Verified with manufacturer datasheet. Approved for staff optical training."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={actionLoading}
                onClick={handleSubmitReview}
              >
                <span>{actionLoading ? "Saving..." : "Save Approval Decision"}</span>
              </Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REGISTER NEW BRAND */}
      {/* ========================================================================= */}
      <Dialog
        open={isBrandDialogOpen}
        onOpenChange={setIsBrandDialogOpen}
        title="Register Eyewear Brand"
        description="Add a new brand manufacturer to the optical dispensing portfolio."
      >
        <form onSubmit={handleAddBrand} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Brand Name</label>
            <Input
              required
              value={brandName}
              onChange={(e) => {
                setBrandName(e.target.value);
                setBrandSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
              }}
              placeholder="e.g. Persol"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Brand Slug</label>
            <Input
              required
              value={brandSlug}
              onChange={(e) => setBrandSlug(e.target.value)}
              placeholder="e.g. persol"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">Country of Origin</label>
              <Input
                value={brandOrigin}
                onChange={(e) => setBrandOrigin(e.target.value)}
                placeholder="e.g. Italy"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B4D] mb-1">Parent Group</label>
              <Input
                value={brandParent}
                onChange={(e) => setBrandParent(e.target.value)}
                placeholder="e.g. EssilorLuxottica"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Heritage & Optical Profile</label>
            <Textarea
              rows={2}
              value={brandHeritage}
              onChange={(e) => setBrandHeritage(e.target.value)}
              placeholder="Historical background, key signature hallmarks, patented hinges..."
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsBrandDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={actionLoading}>
              <span>{actionLoading ? "Saving..." : "Register Brand"}</span>
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: ADD CATEGORY */}
      {/* ========================================================================= */}
      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        title="Create Optical Curriculum Category"
        description="Add a top-level category to the Optical Learning Library."
      >
        <form onSubmit={handleAddCategory} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Category Name</label>
            <Input
              required
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                setCategorySlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
              }}
              placeholder="e.g. Pediatric & Specialty Dispensing"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Slug</label>
            <Input
              required
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              placeholder="pediatric-specialty-dispensing"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Description</label>
            <Textarea
              rows={2}
              required
              value={categoryDesc}
              onChange={(e) => setCategoryDesc(e.target.value)}
              placeholder="Overview of visual milestones, safety polycarbonate standards, and strap frames..."
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={actionLoading}>
              <span>Create Category</span>
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 6: ADD QUIZ QUESTION */}
      {/* ========================================================================= */}
      <Dialog
        open={isQuizDialogOpen}
        onOpenChange={setIsQuizDialogOpen}
        title="Add Knowledge Check Quiz Question"
        description="Attach a multiple choice optical question to an educational lesson."
      >
        <form onSubmit={handleAddQuizQuestion} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Target Lesson Module</label>
            <select
              required
              value={quizLessonId}
              onChange={(e) => setQuizLessonId(e.target.value)}
              className="w-full text-xs rounded-xl border border-[#DCE8F5] p-2.5 bg-white text-[#172B4D] outline-hidden focus:border-[#4285F4]"
            >
              <option value="">Select a lesson...</option>
              {allLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Question Text</label>
            <Input
              required
              value={quizQuestionText}
              onChange={(e) => setQuizQuestionText(e.target.value)}
              placeholder="e.g. Which Abbe value is associated with polycarbonate lenses?"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#172B4D]">Options (Select the correct answer button)</label>
            {[
              { val: quizOpt0, setVal: setQuizOpt0, idx: 0 },
              { val: quizOpt1, setVal: setQuizOpt1, idx: 1 },
              { val: quizOpt2, setVal: setQuizOpt2, idx: 2 },
              { val: quizOpt3, setVal: setQuizOpt3, idx: 3 },
            ].map(({ val, setVal, idx }) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="quizCorrectOption"
                  checked={quizCorrectIdx === idx}
                  onChange={() => setQuizCorrectIdx(idx)}
                  className="text-[#4285F4]"
                />
                <Input
                  required
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="text-xs"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172B4D] mb-1">Educational Optical Explanation</label>
            <Textarea
              rows={2}
              required
              value={quizExplanation}
              onChange={(e) => setQuizExplanation(e.target.value)}
              placeholder="Detailed explanation displayed to opticians upon completing the question..."
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsQuizDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={actionLoading}>
              <span>Save Quiz Question</span>
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </AppShell>
  );
}
