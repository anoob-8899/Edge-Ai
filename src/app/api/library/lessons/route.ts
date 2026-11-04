import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireOwner } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || "";
    const subcategoryId = searchParams.get("subcategoryId") || "";
    const status = searchParams.get("status") || "all";

    const user = await getCurrentUser();

    // Build Prisma where filter
    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (subcategoryId) {
      where.subcategoryId = subcategoryId;
    } else if (categoryId) {
      where.subcategory = { categoryId };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { definitions: { contains: search, mode: "insensitive" } },
        { characteristics: { contains: search, mode: "insensitive" } },
        { practicalApplications: { contains: search, mode: "insensitive" } },
        { misconceptions: { contains: search, mode: "insensitive" } },
        { limitations: { contains: search, mode: "insensitive" } },
        { brandModelReferences: { contains: search, mode: "insensitive" } },
      ];
    }

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: [{ subcategory: { orderIndex: "asc" } }, { orderIndex: "asc" }],
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        _count: {
          select: { quizQuestions: true },
        },
        userProgress: user
          ? {
              where: { userId: user.id },
            }
          : false,
        quizAttempts: user
          ? {
              where: { userId: user.id },
              orderBy: { createdAt: "desc" },
              take: 1,
            }
          : false,
      },
    });

    // Format lessons with computed progress status
    const formatted = lessons.map((l) => {
      const progress = l.userProgress?.[0];
      const latestQuiz = l.quizAttempts?.[0];
      let computedStatus: "completed" | "in-progress" | "not-started" = "not-started";

      if (progress?.isCompleted) {
        computedStatus = "completed";
      } else if (progress || latestQuiz) {
        computedStatus = "in-progress";
      }

      return {
        id: l.id,
        slug: l.slug,
        title: l.title,
        summary: l.summary,
        orderIndex: l.orderIndex,
        subcategoryId: l.subcategoryId,
        subcategory: {
          id: l.subcategory.id,
          slug: l.subcategory.slug,
          name: l.subcategory.name,
          category: {
            id: l.subcategory.category.id,
            slug: l.subcategory.category.slug,
            name: l.subcategory.category.name,
            icon: l.subcategory.category.icon,
          },
        },
        quizQuestionCount: l._count.quizQuestions,
        progress: progress
          ? {
              isCompleted: progress.isCompleted,
              completedAt: progress.completedAt,
              lastAccessedAt: progress.lastAccessedAt,
            }
          : null,
        latestQuizScore: latestQuiz
          ? {
              score: latestQuiz.score,
              total: latestQuiz.totalQuestions,
              passed: latestQuiz.passed,
            }
          : null,
        status: computedStatus,
      };
    });

    // Apply status filter in-memory if requested
    const filtered =
      status === "all"
        ? formatted
        : formatted.filter((item) => item.status === status);

    return NextResponse.json({
      lessons: filtered,
      totalCount: filtered.length,
    });
  } catch (error) {
    console.warn("Serving fallback lessons (PostgreSQL offline or unseeded):", error);
    const { FALLBACK_CATEGORIES } = await import("@/lib/mock-data");
    const fallbackLessons: any[] = [];
    for (const cat of FALLBACK_CATEGORIES) {
      for (const sub of cat.subcategories) {
        for (const les of sub.lessons) {
          fallbackLessons.push({
            id: les.id,
            slug: les.slug,
            title: les.title,
            summary: les.summary,
            definitions: les.definitions,
            characteristics: les.characteristics,
            practicalApplications: les.practicalApplications,
            misconceptions: les.misconceptions,
            limitations: les.limitations,
            brandModelReferences: les.brandModelReferences,
            orderIndex: les.orderIndex,
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            subcategory: {
              id: sub.id,
              slug: sub.slug,
              name: sub.name,
              category: {
                id: cat.id,
                slug: cat.slug,
                name: cat.name,
                icon: cat.icon,
              },
            },
            quizCount: les.quizzes.length,
            userProgress: null,
            latestQuizScore: null,
            status: "not-started",
          });
        }
      }
    }
    return NextResponse.json({
      lessons: fallbackLessons,
      totalCount: fallbackLessons.length,
    });
  }
}

export async function POST(req: Request) {
  try {
    // Enforce owner authorization
    try {
      await requireOwner();
    } catch {
      return NextResponse.json(
        { error: "Forbidden: Owner authorization required to create lessons." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      slug,
      summary,
      subcategoryId,
      definitions,
      characteristics,
      practicalApplications,
      misconceptions,
      limitations,
      brandModelReferences,
      orderIndex,
      quizQuestions,
    } = body;

    if (!title || !slug || !subcategoryId || !summary) {
      return NextResponse.json(
        { error: "Title, slug, summary, and subcategory are required." },
        { status: 400 }
      );
    }

    // Verify subcategory exists
    const subcategory = await prisma.subcategory.findUnique({
      where: { id: subcategoryId },
    });
    if (!subcategory) {
      return NextResponse.json(
        { error: "Specified subcategory does not exist." },
        { status: 404 }
      );
    }

    interface QuizQuestionInput {
      question: string;
      options: string[] | string;
      correctOptionIndex?: number;
      explanation?: string;
      orderIndex?: number;
    }

    const newLesson = await prisma.lesson.create({
      data: {
        title,
        slug,
        summary,
        subcategoryId,
        definitions: definitions || "",
        characteristics: characteristics || "",
        practicalApplications: practicalApplications || "",
        misconceptions: misconceptions || "",
        limitations: limitations || "",
        brandModelReferences: brandModelReferences || null,
        orderIndex: orderIndex ?? 0,
        isPublished: true,
        quizQuestions: Array.isArray(quizQuestions) && quizQuestions.length > 0
          ? {
              create: (quizQuestions as QuizQuestionInput[]).map((q, idx: number) => ({
                question: q.question,
                options: typeof q.options === "string" ? q.options : JSON.stringify(q.options),
                correctOptionIndex: q.correctOptionIndex ?? 0,
                explanation: q.explanation || "",
                orderIndex: q.orderIndex ?? idx + 1,
              })),
            }
          : undefined,
      },
      include: {
        subcategory: {
          include: { category: true },
        },
        quizQuestions: true,
      },
    });

    return NextResponse.json({
      lesson: newLesson,
      message: "Lesson created successfully",
    });
  } catch (error: unknown) {
    console.error("Lesson creation error:", error);
    const err = error as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A lesson with this slug already exists in this subcategory." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
