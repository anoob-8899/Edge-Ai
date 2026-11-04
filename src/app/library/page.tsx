"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  ArrowRight,
  Sun,
  Shapes,
  Wrench,
  SunMedium,
  Ruler,
  UserCheck,
  Glasses,
  HelpCircle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LessonEditorDialog,
  SubcategoryOption,
} from "@/components/library/lesson-editor-dialog";

// Map category icons to lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun,
  Shapes,
  Wrench,
  SunMedium,
  Ruler,
  UserCheck,
  Sparkles,
  Glasses,
  BookOpen,
};

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  subcategories: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    _count: { lessons: number };
  }>;
}

interface LessonItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
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
      icon: string;
    };
  };
  quizQuestionCount: number;
  status: "completed" | "in-progress" | "not-started";
  latestQuizScore: { score: number; total: number; passed: boolean } | null;
}

interface ContinueLessonItem {
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
  latestQuizScore?: { score: number; total: number; passed: boolean } | null;
}

export default function LearningLibraryPage() {
  const [currentUser, setCurrentUser] = React.useState<{
    id: string;
    email: string;
    name: string;
    role: "staff" | "owner" | "admin";
  } | null>(null);

  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [lessons, setLessons] = React.useState<LessonItem[]>([]);
  const [continueLessons, setContinueLessons] = React.useState<ContinueLessonItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");

  // Owner dialog
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);

  // Load auth state
  const loadUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setCurrentUser(data.user);
    } catch {
      setCurrentUser(null);
    }
  };

  // Load categories and continue learning
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [catRes, continueRes] = await Promise.all([
        fetch("/api/library/categories"),
        fetch("/api/library/continue-learning"),
      ]);

      if (!catRes.ok) throw new Error("Failed to load categories");
      const catData = await catRes.json();
      setCategories(catData.categories || []);

      if (continueRes.ok) {
        const contData = await continueRes.json();
        setContinueLessons(contData.continueLessons || []);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to load learning library data");
    } finally {
      setLoading(false);
    }
  };

  // Load lessons whenever filters or search query change
  const fetchLessons = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedCategory !== "all") params.set("categoryId", selectedCategory);
      if (selectedStatus !== "all") params.set("status", selectedStatus);

      const res = await fetch(`/api/library/lessons?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to search lessons");
      const data = await res.json();
      setLessons(data.lessons || []);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [searchQuery, selectedCategory, selectedStatus]);

  React.useEffect(() => {
    loadUser();
    loadInitialData();
  }, []);

  React.useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Flatten subcategories for the owner editor dialog
  const subcategoryOptions: SubcategoryOption[] = React.useMemo(() => {
    const list: SubcategoryOption[] = [];
    categories.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        list.push({
          id: sub.id,
          name: sub.name,
          categoryName: cat.name,
        });
      });
    });
    return list;
  }, [categories]);

  const isOwner = currentUser?.role === "owner" || currentUser?.role === "admin";

  return (
    <AppShell
      title="Optical Learning Library"
      subtitle="Structured dispensing curriculum, product science & persistent knowledge quizzes"
    >
      <div className="space-y-8">
        {/* Top Hero Banner */}
        <div className="rounded-[22px] p-6 md:p-8 bg-gradient-to-r from-white/95 via-[#F0F7FF]/90 to-[#E8F3FF]/80 border border-[#DCE8F5] shadow-card relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary" size="sm">
                  Optical Knowledge Base
                </Badge>
                <Badge variant="secondary" size="sm" isMono>
                  7 CATEGORIES • VERIFIED CURRICULUM
                </Badge>
                {currentUser && (
                  <Badge variant={isOwner ? "primary" : "neutral"} size="sm">
                    {currentUser.name} ({currentUser.role.toUpperCase()})
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-[#172B4D] tracking-tight">
                Optical Dispensing & Lens Science Library
              </h1>
              <p className="text-sm text-[#65758B] leading-relaxed">
                Master lens materials, refractive indices, frame architectures, and customer lifestyle discovery.
                Educational concepts are backed by PostgreSQL persistence and self-paced knowledge checks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {isOwner ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsEditorOpen(true)}
                  className="shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Lesson</span>
                </Button>
              ) : (
                <Link href="/sign-in">
                  <Button variant="outline" size="sm">
                    <span>Switch Role / Sign In</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Highest-Priority Spotlight: Branded Sunglasses Learning Catalogue (Distinctive Dark Panel) */}
        <div className="rounded-[20px] p-6 bg-[#242629] text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#33383F]">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFD95E] text-[#20242B]">
                <Sun className="w-3 h-3" />
                Featured Dispensing Module
              </span>
              <span className="text-[11px] font-mono text-gray-300">
                12 Starting Brands • Verified Specs
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Branded Sunglasses & Optical Frames Catalogue
            </h2>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
              Explore Ray-Ban, Gucci, Prada, Oakley, Tom Ford, Carrera, Police, and Vogue with verified frame shapes, lens technologies, and clinical dispensing notes.
            </p>
          </div>
          <Link href="/catalogue" className="shrink-0">
            <Button variant="yellow" size="md" pill className="font-bold text-xs shadow-xs">
              <span>Open Product Catalogue</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>


        {/* Continue Learning Section */}
        {continueLessons.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#4285F4]" />
                <h2 className="text-base font-bold text-[#172B4D]">
                  Continue Learning
                </h2>
              </div>
              <span className="text-xs text-[#8796AA]">
                Saved progress in PostgreSQL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {continueLessons.map((item) => (
                <Link
                  key={item.id}
                  href={`/library/${item.categorySlug}/${item.subcategorySlug}/${item.slug}`}
                  className="group block"
                >
                  <Card
                    variant="glass"
                    hoverable
                    className="h-full border-[#DCE8F5] transition-all group-hover:border-[#B8D9FF]"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between text-xs text-[#8796AA] mb-1">
                        <span className="truncate">{item.categoryName}</span>
                        {item.status === "completed" ? (
                          <Badge variant="success" size="sm">
                            Completed
                          </Badge>
                        ) : item.status === "in-progress" ? (
                          <Badge variant="primary" size="sm">
                            In Progress
                          </Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">
                            Not Started
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm font-bold text-[#172B4D] group-hover:text-[#4285F4] transition-colors line-clamp-1">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 flex items-center justify-between text-xs text-[#65758B]">
                      <span className="truncate">{item.subcategoryName}</span>
                      <span className="text-[#4285F4] font-semibold flex items-center gap-1 shrink-0 ml-2">
                        <span>{item.status === "completed" ? "Review" : "Resume"}</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Category Navigation Pills / Carousel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#172B4D]">
              Curriculum Categories ({categories.length})
            </h2>
            {selectedCategory !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="text-xs text-[#4285F4] hover:underline"
              >
                Clear category filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`p-3 rounded-2xl text-left border transition-all ${
                selectedCategory === "all"
                  ? "bg-[#E8F3FF] border-[#4285F4] shadow-xs text-[#172B4D]"
                  : "bg-white/80 border-[#DCE8F5] text-[#65758B] hover:border-[#B8D9FF] hover:bg-[#F0F7FF]"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-[#DCE8F5] flex items-center justify-center text-[#4285F4] mb-2 shadow-xs">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="text-xs font-bold truncate">All Categories</div>
              <div className="text-[10px] text-[#8796AA] font-mono mt-0.5">
                Full Library
              </div>
            </button>

            {categories.map((cat) => {
              const IconComp = iconMap[cat.icon] || Glasses;
              const isSelected = selectedCategory === cat.id;
              const totalLessons = cat.subcategories.reduce(
                (sum, s) => sum + s._count.lessons,
                0
              );

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? "bg-[#E8F3FF] border-[#4285F4] shadow-xs text-[#172B4D]"
                      : "bg-white/80 border-[#DCE8F5] text-[#65758B] hover:border-[#B8D9FF] hover:bg-[#F0F7FF]"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#DCE8F5] flex items-center justify-center text-[#4285F4] mb-2 shadow-xs">
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div className="text-xs font-bold truncate" title={cat.name}>
                    {cat.name}
                  </div>
                  <div className="text-[10px] text-[#8796AA] font-mono mt-0.5">
                    {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-[#DCE8F5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="w-full md:max-w-md relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search approved optical lessons, terms, frame types..."
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Status & Subcategory Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F0F7FF] border border-[#DCE8F5]">
              {(
                [
                  { label: "All Status", value: "all" },
                  { label: "Completed", value: "completed" },
                  { label: "In Progress", value: "in-progress" },
                  { label: "Not Started", value: "not-started" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSelectedStatus(tab.value)}
                  className={`py-1.5 px-3 rounded-[9px] text-xs font-semibold transition-all ${
                    selectedStatus === tab.value
                      ? "bg-white text-[#4285F4] shadow-xs border border-[#B8D9FF]"
                      : "text-[#65758B] hover:text-[#172B4D]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
              title="Reset filters"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Lessons Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-white/60 border border-[#DCE8F5] animate-pulse p-6 space-y-4"
              >
                <div className="h-4 bg-[#E8F3FF] rounded w-1/3" />
                <div className="h-6 bg-[#E8F3FF] rounded w-3/4" />
                <div className="h-12 bg-[#F0F7FF] rounded w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="Failed to Load Library"
            description={error}
            action={
              <Button variant="outline" size="sm" onClick={loadInitialData}>
                Retry
              </Button>
            }
          />
        ) : lessons.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No Optical Lessons Found"
            description={
              searchQuery
                ? `No lessons matched "${searchQuery}". Try different search terms or clear filters.`
                : "No approved lessons match the selected category and status filters."
            }
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                }}
              >
                Clear Filters
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#8796AA]">
              <span>
                Showing {lessons.length} educational{" "}
                {lessons.length === 1 ? "lesson" : "lessons"}
              </span>
              <span>Updated from PostgreSQL</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {lessons.map((lesson) => {
                const CategoryIcon =
                  iconMap[lesson.subcategory.category.icon] || Glasses;

                return (
                  <Link
                    key={lesson.id}
                    href={`/library/${lesson.subcategory.category.slug}/${lesson.subcategory.slug}/${lesson.slug}`}
                    className="group block"
                  >
                    <Card
                      variant="glass"
                      hoverable
                      className="h-full flex flex-col justify-between border-[#DCE8F5] transition-all group-hover:border-[#B8D9FF] group-hover:shadow-card"
                    >
                      <CardHeader className="p-5 pb-3 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-[#8796AA] truncate">
                            <CategoryIcon className="h-3.5 w-3.5 text-[#4285F4] shrink-0" />
                            <span className="truncate">
                              {lesson.subcategory.category.name}
                            </span>
                          </div>

                          {lesson.status === "completed" ? (
                            <Badge variant="success" size="sm">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          ) : lesson.status === "in-progress" ? (
                            <Badge variant="primary" size="sm">
                              In Progress
                            </Badge>
                          ) : (
                            <Badge variant="secondary" size="sm">
                              Not Started
                            </Badge>
                          )}
                        </div>

                        <div>
                          <Badge variant="neutral" size="sm" className="mb-1.5">
                            {lesson.subcategory.name}
                          </Badge>
                          <CardTitle className="text-base font-bold text-[#172B4D] group-hover:text-[#4285F4] transition-colors line-clamp-2">
                            {lesson.title}
                          </CardTitle>
                        </div>

                        <CardDescription className="line-clamp-2 text-xs text-[#65758B]">
                          {lesson.summary}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="p-5 pt-0">
                        <div className="pt-3 border-t border-[#DCE8F5]/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-[#8796AA]">
                            <HelpCircle className="h-3.5 w-3.5 text-[#4285F4]" />
                            <span>
                              {lesson.quizQuestionCount}{" "}
                              {lesson.quizQuestionCount === 1
                                ? "Quiz Question"
                                : "Quiz Questions"}
                            </span>
                          </div>

                          <span className="font-semibold text-[#4285F4] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            <span>Study Lesson</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Owner Lesson Creation Dialog */}
      <LessonEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        subcategories={subcategoryOptions}
        onSaved={() => {
          fetchLessons();
          loadInitialData();
        }}
      />
    </AppShell>
  );
}
