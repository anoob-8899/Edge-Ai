import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const createQuizQuestionSchema = z.object({
  lessonId: z.string().min(1),
  question: z.string().min(5),
  options: z.union([z.array(z.string().min(1)), z.string().min(2)]),
  correctOptionIndex: z.number().int().min(0).max(10),
  explanation: z.string().min(5),
  orderIndex: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database configuration missing." }, { status: 503 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const userRole = currentUser.role?.toUpperCase();
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Access restricted to Practice Owners." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");

    const where: any = {};
    if (lessonId) {
      where.lessonId = lessonId;
    }

    const questions = await prisma.quizQuestion.findMany({
      where,
      orderBy: [
        { lesson: { orderIndex: "asc" } },
        { orderIndex: "asc" },
      ],
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            subcategory: {
              select: {
                name: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      questions,
      totalCount: questions.length,
    });
  } catch (error) {
    console.error("Owner quizzes error:", error);
    return NextResponse.json({ error: "Failed to fetch quiz questions." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database configuration missing." }, { status: 503 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const userRole = currentUser.role?.toUpperCase();
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Access restricted to Practice Owners." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = createQuizQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const { lessonId, question, options, correctOptionIndex, explanation, orderIndex } = parsed.data;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    const optionsString = Array.isArray(options) ? JSON.stringify(options) : options;

    const maxOrder = await prisma.quizQuestion.aggregate({
      where: { lessonId },
      _max: { orderIndex: true },
    });
    const nextOrder = orderIndex !== undefined ? orderIndex : (maxOrder._max.orderIndex || 0) + 1;

    const quizQuestion = await prisma.quizQuestion.create({
      data: {
        lessonId,
        question,
        options: optionsString,
        correctOptionIndex,
        explanation,
        orderIndex: nextOrder,
      },
      include: {
        lesson: {
          select: { title: true },
        },
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    await logAuditEvent({
      userId: currentUser.id,
      action: "QUIZ_QUESTION_CREATED",
      ipAddress,
      userAgent,
      metadata: {
        quizQuestionId: quizQuestion.id,
        lessonId,
        lessonTitle: lesson.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Quiz question created for '${lesson.title}'.`,
      question: quizQuestion,
    }, { status: 201 });
  } catch (error) {
    console.error("Quiz question creation error:", error);
    return NextResponse.json({ error: "Failed to create quiz question." }, { status: 500 });
  }
}
