import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const updateQuizQuestionSchema = z.object({
  question: z.string().min(5).optional(),
  options: z.union([z.array(z.string().min(1)), z.string().min(2)]).optional(),
  correctOptionIndex: z.number().int().min(0).max(10).optional(),
  explanation: z.string().min(5).optional(),
  orderIndex: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateQuizQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const existing = await prisma.quizQuestion.findUnique({
      where: { id },
      include: { lesson: { select: { title: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quiz question not found." }, { status: 404 });
    }

    let optionsString: string | undefined = undefined;
    if (parsed.data.options !== undefined) {
      optionsString = Array.isArray(parsed.data.options)
        ? JSON.stringify(parsed.data.options)
        : parsed.data.options;
    }

    const updated = await prisma.quizQuestion.update({
      where: { id },
      data: {
        question: parsed.data.question ?? existing.question,
        options: optionsString ?? existing.options,
        correctOptionIndex: parsed.data.correctOptionIndex ?? existing.correctOptionIndex,
        explanation: parsed.data.explanation ?? existing.explanation,
        orderIndex: parsed.data.orderIndex ?? existing.orderIndex,
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    await logAuditEvent({
      userId: currentUser.id,
      action: "QUIZ_QUESTION_UPDATED",
      ipAddress,
      userAgent,
      metadata: {
        quizQuestionId: updated.id,
        lessonTitle: existing.lesson.title,
      },
    });

    return NextResponse.json({
      success: true,
      question: updated,
    });
  } catch (error) {
    console.error("Quiz question update error:", error);
    return NextResponse.json({ error: "Failed to update quiz question." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const existing = await prisma.quizQuestion.findUnique({
      where: { id },
      include: { lesson: { select: { title: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quiz question not found." }, { status: 404 });
    }

    await prisma.quizQuestion.delete({
      where: { id },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    await logAuditEvent({
      userId: currentUser.id,
      action: "QUIZ_QUESTION_DELETED",
      ipAddress,
      userAgent,
      metadata: {
        quizQuestionId: id,
        lessonTitle: existing.lesson.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Quiz question removed.",
    });
  } catch (error) {
    console.error("Quiz question delete error:", error);
    return NextResponse.json({ error: "Failed to delete quiz question." }, { status: 500 });
  }
}
