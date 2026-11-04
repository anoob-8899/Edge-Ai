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
        { error: "Authentication required to track progress" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { isCompleted } = body;

    // Find lesson to confirm it exists and obtain proper ID
    const lesson = await prisma.lesson.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const completed = isCompleted !== undefined ? Boolean(isCompleted) : true;

    const progress = await prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lesson.id,
        },
      },
      update: {
        isCompleted: completed,
        completedAt: completed ? new Date() : null,
        lastAccessedAt: new Date(),
      },
      create: {
        userId: user.id,
        lessonId: lesson.id,
        isCompleted: completed,
        completedAt: completed ? new Date() : null,
        lastAccessedAt: new Date(),
      },
    });

    let pointsAwarded = 0;
    let newTotalPoints = undefined;

    if (completed) {
      const award = await awardPoints({
        userId: user.id,
        activityType: "LESSON_COMPLETION",
        referenceId: lesson.id,
        description: `Completed optical lesson: ${lesson.title}`,
        metadata: { lessonId: lesson.id, lessonSlug: lesson.slug, title: lesson.title },
      });
      if (award.awarded) {
        pointsAwarded = award.points;
        newTotalPoints = award.newTotalPoints;
      }
      // Check and update any active weekly challenges
      await evaluateChallengeProgress(user.id);
    }

    return NextResponse.json({
      progress,
      pointsAwarded,
      newTotalPoints,
      message: completed ? "Lesson marked as completed" : "Lesson marked as in-progress",
    });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json(
      { error: "Failed to update lesson progress" },
      { status: 500 }
    );
  }
}
