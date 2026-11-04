"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit,
  Sparkles,
  Info,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  KnowledgeQuiz,
  QuestionData,
  QuizAttemptData,
} from "@/components/library/knowledge-quiz";
import {
  LessonEditorDialog,
  SubcategoryOption,
} from "@/components/library/lesson-editor-dialog";

interface DetailedLesson {
  id: string;
  slug: string;
  title: string;
  summary: string;
  definitions: string;
  characteristics: string;
  practicalApplications: string;
  misconceptions: string;
  limitations: string;
  brandModelReferences?: string | null;
  orderIndex: number;
  subcategoryId: string;
  subcategory: {
    id: string;
    slug: string;
    name: string;
    category: {
      id: string;
      slug: string;
      name: string;
    };
    lessons: Array<{
      id: string;
      slug: string;
      title: string;
      orderIndex: number;
    }>;
  };
  quizQuestions: QuestionData[];
}

interface UserProgressData {
  id?: string;
  isCompleted: boolean;
  completedAt?: string | null;
  lastAccessedAt?: string;
}

interface CurrentUserSession {
  id: string;
  name: string;
  role: "staff" | "owner" | "admin";
}

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();

  const categorySlug = params?.categorySlug as string;
  const subcategorySlug = params?.subcategorySlug as string;
  const lessonSlug = params?.lessonSlug as string;

  const [lesson, setLesson] = React.useState<DetailedLesson | null>(null);
  const [userProgress, setUserProgress] = React.useState<UserProgressData | null>(null);
  const [quizAttempts, setQuizAttempts] = React.useState<QuizAttemptData[]>([]);
  const [currentUser, setCurrentUser] = React.useState<CurrentUserSession | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isUpdatingProgress, setIsUpdatingProgress] = React.useState(false);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [subcategories, setSubcategories] = React.useState<SubcategoryOption[]>([]);

  // Load user
  const loadUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setCurrentUser(data.user);
    } catch {
      setCurrentUser(null);
    }
  };

  // Load lesson
  const loadLesson = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/library/lessons/${lessonSlug}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Optical lesson not found");
        }
        throw new Error("Failed to load lesson content");
      }

      const data = await res.json();
      setLesson(data.lesson);
      setUserProgress(data.userProgress);
      setQuizAttempts(data.quizAttempts || []);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [lessonSlug]);

  // Load subcategories for editor
  const loadSubcategories = async () => {
    try {
      const res = await fetch("/api/library/categories");
      if (res.ok) {
        const data = await res.json();
        const list: SubcategoryOption[] = [];
        interface CategoryWithSubs {
          name: string;
          subcategories?: Array<{ id: string; name: string }>;
        }
        data.categories?.forEach((cat: CategoryWithSubs) => {
          cat.subcategories?.forEach((sub) => {
            list.push({
              id: sub.id,
              name: sub.name,
              categoryName: cat.name,
            });
          });
        });
        setSubcategories(list);
      }
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    loadUser();
    loadLesson();
    loadSubcategories();
  }, [loadLesson]);

  // Toggle completion status
  const handleToggleCompletion = async () => {
    if (!lesson) return;
    setIsUpdatingProgress(true);

    try {
      const newStatus = !userProgress?.isCompleted;
      const res = await fetch(`/api/library/lessons/${lesson.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update progress");
      }

      const data = await res.json();
      setUserProgress(data.progress);
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message || "Failed to update completion");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Loading Lesson...">
        <div className="space-y-6 max-w-4xl mx-auto py-8">
          <div className="h-8 bg-[#E8F3FF] rounded-xl w-1/3 animate-pulse" />
          <div className="h-40 bg-white/70 rounded-2xl border border-[#DCE8F5] animate-pulse p-6" />
          <div className="h-64 bg-white/70 rounded-2xl border border-[#DCE8F5] animate-pulse p-6" />
        </div>
      </AppShell>
    );
  }

  if (error || !lesson) {
    return (
      <AppShell title="Lesson Not Found">
        <div className="max-w-xl mx-auto py-12">
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="Lesson Unavailable"
            description={error || "The requested optical lesson could not be loaded."}
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/library")}
              >
                Return to Library
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  const isOwner = currentUser?.role === "owner" || currentUser?.role === "admin";
  const siblingLessons = lesson.subcategory?.lessons || [];
  const currentIndex = siblingLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? siblingLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < siblingLessons.length - 1
      ? siblingLessons[currentIndex + 1]
      : null;

  return (
    <AppShell
      title={lesson.title}
      subtitle={`${lesson.subcategory.category.name} • ${lesson.subcategory.name}`}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#8796AA]">
          <Link
            href="/library"
            className="hover:text-[#4285F4] transition-colors flex items-center gap-1 font-medium"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Learning Library</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-[#DCE8F5]" />
          <span className="text-[#65758B]">
            {lesson.subcategory.category.name}
          </span>
          <ChevronRight className="h-3 w-3 text-[#DCE8F5]" />
          <span className="text-[#65758B]">{lesson.subcategory.name}</span>
          <ChevronRight className="h-3 w-3 text-[#DCE8F5]" />
          <span className="font-semibold text-[#172B4D] truncate max-w-xs">
            {lesson.title}
          </span>
        </div>

        {/* Lesson Header Banner */}
        <div className="rounded-[22px] p-6 md:p-8 bg-gradient-to-r from-white via-[#F8FBFF] to-[#E8F3FF]/70 border border-[#DCE8F5] shadow-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm">
                {lesson.subcategory.category.name}
              </Badge>
              <Badge variant="secondary" size="sm">
                {lesson.subcategory.name}
              </Badge>
              {userProgress?.isCompleted ? (
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  In Progress
                </Badge>
              )}
            </div>

            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditorOpen(true)}
                className="shrink-0"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                <span>Edit Lesson (Owner)</span>
              </Button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#172B4D] tracking-tight">
            {lesson.title}
          </h1>

          <p className="text-sm sm:text-base text-[#65758B] leading-relaxed">
            {lesson.summary}
          </p>

          {/* Persistent Completion Status Bar */}
          <div className="pt-3 border-t border-[#DCE8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#8796AA]">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[#4285F4]" />
              <span>
                {userProgress?.completedAt
                  ? `Completed on ${new Date(
                      userProgress.completedAt
                    ).toLocaleDateString()}`
                  : "Learning progress automatically tracked in PostgreSQL"}
              </span>
            </div>

            <Button
              variant={userProgress?.isCompleted ? "outline" : "primary"}
              size="sm"
              onClick={handleToggleCompletion}
              disabled={isUpdatingProgress}
              className="shrink-0"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isUpdatingProgress
                  ? "Saving..."
                  : userProgress?.isCompleted
                  ? "Mark as Incomplete"
                  : "Mark Lesson Completed"}
              </span>
            </Button>
          </div>
        </div>

        {/* Structured Educational Content Sections */}
        <div className="space-y-6">
          {/* 1. Definitions Section */}
          {lesson.definitions && (
            <Card variant="glass" className="border-[#DCE8F5]">
              <CardHeader className="pb-3 border-b border-[#DCE8F5]/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E8F3FF] text-[#4285F4] flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <CardTitle className="text-base font-bold text-[#172B4D]">
                    Core Definitions & Optical Terminology
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 text-sm text-[#172B4D] leading-relaxed whitespace-pre-line space-y-3">
                {lesson.definitions}
              </CardContent>
            </Card>
          )}

          {/* 2. Characteristics Section */}
          {lesson.characteristics && (
            <Card variant="glass" className="border-[#DCE8F5]">
              <CardHeader className="pb-3 border-b border-[#DCE8F5]/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E8F3FF] text-[#4285F4] flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <CardTitle className="text-base font-bold text-[#172B4D]">
                    Characteristics, Mechanics & Specifications
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 text-sm text-[#172B4D] leading-relaxed whitespace-pre-line space-y-3">
                {lesson.characteristics}
              </CardContent>
            </Card>
          )}

          {/* 3. Practical Customer Applications */}
          {lesson.practicalApplications && (
            <Card variant="glass" className="border-[#B8D9FF] bg-gradient-to-br from-white via-[#F8FBFF] to-[#E8F3FF]/40">
              <CardHeader className="pb-3 border-b border-[#DCE8F5]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#4285F4] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    3
                  </div>
                  <CardTitle className="text-base font-bold text-[#172B4D]">
                    Practical Customer Applications & Dispensing Guidance
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 text-sm text-[#172B4D] leading-relaxed whitespace-pre-line space-y-3">
                {lesson.practicalApplications}
              </CardContent>
            </Card>
          )}

          {/* 4. Common Misconceptions & 5. Limitations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lesson.misconceptions && (
              <Card variant="glass" className="border-amber-200 bg-amber-50/30">
                <CardHeader className="pb-3 border-b border-amber-100">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-[#A96A08]" />
                    <CardTitle className="text-sm font-bold text-[#172B4D]">
                      Common Misconceptions
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5 text-xs sm:text-sm text-[#172B4D] leading-relaxed whitespace-pre-line">
                  {lesson.misconceptions}
                </CardContent>
              </Card>
            )}

            {lesson.limitations && (
              <Card variant="glass" className="border-red-200 bg-red-50/30">
                <CardHeader className="pb-3 border-b border-red-100">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-[#C83F4F]" />
                    <CardTitle className="text-sm font-bold text-[#172B4D]">
                      Technical Limitations & Contraindications
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5 text-xs sm:text-sm text-[#172B4D] leading-relaxed whitespace-pre-line">
                  {lesson.limitations}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 6. Brand / Model References (Clearly separated) */}
          {lesson.brandModelReferences && (
            <Card variant="glass" className="border-[#DCE8F5] bg-[#F0F7FF]/50">
              <CardHeader className="pb-3 border-b border-[#DCE8F5]/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#4285F4]" />
                    <CardTitle className="text-sm font-bold text-[#172B4D]">
                      Brand & Model References (Educational Design Archetypes)
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" size="sm" isMono>
                    REFERENCE ONLY
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Representative industry archetypes demonstrating these optical principles. General educational facts are kept distinct from manufacturer proprietary specifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 text-xs sm:text-sm text-[#172B4D] leading-relaxed whitespace-pre-line">
                {lesson.brandModelReferences}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Knowledge-Check Quiz Interactive Component */}
        <div className="pt-4">
          <KnowledgeQuiz
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            questions={lesson.quizQuestions || []}
            initialAttempts={quizAttempts}
            onQuizPassed={() => {
              setUserProgress((prev) => ({
                id: prev?.id,
                isCompleted: true,
                completedAt: new Date().toISOString(),
                lastAccessedAt: prev?.lastAccessedAt || new Date().toISOString(),
              }));
            }}
          />
        </div>

        {/* Subcategory Next / Previous Navigation */}
        <div className="p-4 rounded-2xl bg-white/80 border border-[#DCE8F5] shadow-xs flex items-center justify-between gap-4">
          {prevLesson ? (
            <Link
              href={`/library/${categorySlug}/${subcategorySlug}/${prevLesson.slug}`}
              className="flex items-center gap-2 text-xs font-semibold text-[#65758B] hover:text-[#4285F4] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <div className="text-left">
                <div className="text-[10px] text-[#8796AA]">Previous Lesson</div>
                <div className="truncate max-w-[150px] sm:max-w-xs">{prevLesson.title}</div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          <Link href="/library">
            <Button variant="outline" size="sm">
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              <span>Library Index</span>
            </Button>
          </Link>

          {nextLesson ? (
            <Link
              href={`/library/${categorySlug}/${subcategorySlug}/${nextLesson.slug}`}
              className="flex items-center gap-2 text-xs font-semibold text-[#65758B] hover:text-[#4285F4] transition-colors text-right"
            >
              <div className="text-right">
                <div className="text-[10px] text-[#8796AA]">Next Lesson</div>
                <div className="truncate max-w-[150px] sm:max-w-xs">{nextLesson.title}</div>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Owner Lesson Editor Dialog */}
      <LessonEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        initialLesson={lesson}
        subcategories={subcategories}
        onSaved={loadLesson}
      />
    </AppShell>
  );
}
