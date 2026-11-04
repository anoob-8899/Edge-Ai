import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { awardPoints } from "@/lib/points";
import { evaluateChallengeProgress } from "@/lib/challenges";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to submit quiz" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { answers } = body; // Map: { [questionId: string]: number }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Invalid quiz answers payload" },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        quizQuestions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const questions = lesson.quizQuestions;
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No quiz questions available for this lesson" },
        { status: 400 }
      );
    }

    let score = 0;
    const feedback: Array<{
      questionId: string;
      selectedOptionIndex: number;
      correctOptionIndex: number;
      isCorrect: boolean;
      explanation: string;
    }> = [];

    for (const q of questions) {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctOptionIndex;
      if (isCorrect) {
        score++;
      }
      feedback.push({
        questionId: q.id,
        selectedOptionIndex: selected,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation,
      });
    }

    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= 70; // 70% threshold

    // Save attempt in PostgreSQL
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        lessonId: lesson.id,
        score,
        totalQuestions,
        passed,
        answers: JSON.stringify(answers),
      },
    });

    let pointsAwarded = 0;
    let newTotalPoints = undefined;

    // If passed, also automatically update/record lesson completion and award verified points
    if (passed) {
      await prisma.userLessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: lesson.id,
          },
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
          lastAccessedAt: new Date(),
        },
        create: {
          userId: user.id,
          lessonId: lesson.id,
          isCompleted: true,
          completedAt: new Date(),
          lastAccessedAt: new Date(),
        },
      });

      // Award quiz pass points (referenceId is lesson.id to prevent multiple awards for retakes)
      const award = await awardPoints({
        userId: user.id,
        activityType: "QUIZ_PASSED",
        referenceId: lesson.id,
        description: `Passed optical knowledge quiz for ${lesson.title} (${percentage}%)`,
        metadata: {
          lessonId: lesson.id,
          lessonSlug: lesson.slug,
          score,
          totalQuestions,
          percentage,
          attemptId: attempt.id,
        },
      });

      if (award.awarded) {
        pointsAwarded = award.points;
        newTotalPoints = award.newTotalPoints;
      }

      // Check and update any active weekly challenges
      await evaluateChallengeProgress(user.id);
    }

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      totalQuestions,
      percentage,
      passed,
      pointsAwarded,
      newTotalPoints,
      feedback,
      message: passed
        ? "Congratulations! You passed the optical knowledge check."
        : "Review the optical explanations and try again to master this concept.",
    });
  } catch (error) {
    console.error("Quiz submission error:", error);
    return NextResponse.json(
      { error: "Failed to process quiz submission" },
      { status: 500 }
    );
  }
}
