import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      // For unauthenticated users, show the first 3 introductory lessons
      const introLessons = await prisma.lesson.findMany({
        take: 3,
        orderBy: [{ subcategory: { orderIndex: "asc" } }, { orderIndex: "asc" }],
        include: {
          subcategory: {
            include: { category: true },
          },
        },
      });

      return NextResponse.json({
        continueLessons: introLessons.map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          summary: l.summary,
          subcategoryName: l.subcategory.name,
          categoryName: l.subcategory.category.name,
          categorySlug: l.subcategory.category.slug,
          subcategorySlug: l.subcategory.slug,
          isCompleted: false,
          lastAccessedAt: null,
          status: "not-started" as const,
        })),
        isGuest: true,
      });
    }

    // Authenticated user: get lessons ordered by lastAccessedAt desc
    const progresses = await prisma.userLessonProgress.findMany({
      where: { userId: user.id },
      orderBy: { lastAccessedAt: "desc" },
      take: 4,
      include: {
        lesson: {
          include: {
            subcategory: {
              include: { category: true },
            },
            quizAttempts: {
              where: { userId: user.id },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    interface ContinueLessonItem {
      id: string;
      slug: string;
      title: string;
      summary: string;
      subcategoryName: string;
      categoryName: string;
      categorySlug: string;
      subcategorySlug: string;
      isCompleted: boolean;
      lastAccessedAt: Date | null;
      status: "completed" | "in-progress" | "not-started";
      latestQuizScore: { score: number; total: number; passed: boolean } | null;
    }

    const continueLessons: ContinueLessonItem[] = progresses.map((p) => {
      const lesson = p.lesson;
      const latestQuiz = lesson.quizAttempts?.[0];
      return {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        subcategoryName: lesson.subcategory.name,
        categoryName: lesson.subcategory.category.name,
        categorySlug: lesson.subcategory.category.slug,
        subcategorySlug: lesson.subcategory.slug,
        isCompleted: p.isCompleted,
        lastAccessedAt: p.lastAccessedAt,
        status: p.isCompleted ? ("completed" as const) : ("in-progress" as const),
        latestQuizScore: latestQuiz
          ? {
              score: latestQuiz.score,
              total: latestQuiz.totalQuestions,
              passed: latestQuiz.passed,
            }
          : null,
      };
    });

    // If user has fewer than 2 accessed lessons, fill in with unstarted lessons
    if (continueLessons.length < 2) {
      const existingIds = continueLessons.map((c) => c.id);
      const remaining = await prisma.lesson.findMany({
        where: {
          id: { notIn: existingIds },
          isPublished: true,
        },
        take: 3 - continueLessons.length,
        orderBy: [{ subcategory: { orderIndex: "asc" } }, { orderIndex: "asc" }],
        include: {
          subcategory: {
            include: { category: true },
          },
        },
      });

      for (const r of remaining) {
        continueLessons.push({
          id: r.id,
          slug: r.slug,
          title: r.title,
          summary: r.summary,
          subcategoryName: r.subcategory.name,
          categoryName: r.subcategory.category.name,
          categorySlug: r.subcategory.category.slug,
          subcategorySlug: r.subcategory.slug,
          isCompleted: false,
          lastAccessedAt: null,
          status: "not-started" as const,
          latestQuizScore: null,
        });
      }
    }

    return NextResponse.json({
      continueLessons,
      isGuest: false,
    });
  } catch (error) {
    console.warn("Serving fallback continue-learning (PostgreSQL offline or unseeded):", error);
    return NextResponse.json({
      continueLessons: [
        {
          id: "les-aviator-optics",
          slug: "classic-aviator-optics",
          title: "Classic Aviator Silhouette & Teardrop Optical Coverage",
          summary: "Explore the dual-bridge architecture, expanded lower-quadrant field of vision, and vertex considerations of pilot frames.",
          subcategoryName: "Heritage & Aviator Eyewear",
          categoryName: "Branded Sunglasses",
          categorySlug: "branded-sunglasses",
          subcategorySlug: "heritage-aviator",
          isCompleted: false,
          lastAccessedAt: new Date().toISOString(),
          status: "in-progress" as const,
          latestQuizScore: 100,
        },
        {
          id: "les-acetate-science",
          slug: "cellulose-acetate-dispensing",
          title: "Cellulose Acetate Properties, Heat Softening & Bridge Molding",
          summary: "Learn how plant-based cellulose acetate behaves under warm-air heaters and holds customized ear curve adjustments.",
          subcategoryName: "Cellulose Acetate & Performance Polymers",
          categoryName: "Frame Materials",
          categorySlug: "frame-materials",
          subcategorySlug: "optical-polymers",
          isCompleted: false,
          lastAccessedAt: null,
          status: "not-started" as const,
          latestQuizScore: null,
        },
        {
          id: "les-high-index-comparison",
          slug: "high-index-abbe-value-tradeoffs",
          title: "High-Index Lenses vs Abbe Value: Optical Clarity vs Thickness",
          summary: "Navigate the trade-off between lens thinness (high index) and chromatic aberration (Abbe value).",
          subcategoryName: "Lens Material Refractive Indices",
          categoryName: "Prescription Lens Science",
          categorySlug: "prescription-lenses",
          subcategorySlug: "refractive-indices",
          isCompleted: false,
          lastAccessedAt: null,
          status: "not-started" as const,
          latestQuizScore: null,
        },
      ],
      isGuest: true,
    });
  }
}
