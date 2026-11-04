import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireOwner } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    // Find lesson by ID or by slug
    const lesson = await prisma.lesson.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        subcategory: {
          include: {
            category: true,
            lessons: {
              select: {
                id: true,
                slug: true,
                title: true,
                orderIndex: true,
              },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        quizQuestions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    let userProgress = null;
    let quizAttempts: Array<{
      id: string;
      score: number;
      totalQuestions: number;
      passed: boolean;
      createdAt: Date;
    }> = [];

    if (user) {
      // Record or touch progress (lastAccessedAt)
      userProgress = await prisma.userLessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: lesson.id,
          },
        },
        update: {
          lastAccessedAt: new Date(),
        },
        create: {
          userId: user.id,
          lessonId: lesson.id,
          isCompleted: false,
          lastAccessedAt: new Date(),
        },
      });

      quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId: user.id,
          lessonId: lesson.id,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    }

    return NextResponse.json({
      lesson,
      userProgress,
      quizAttempts,
    });
  } catch (error) {
    console.error("Lesson detail fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireOwner();
    } catch {
      return NextResponse.json(
        { error: "Forbidden: Owner authorization required to modify lessons." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const {
      title,
      summary,
      definitions,
      characteristics,
      practicalApplications,
      misconceptions,
      limitations,
      brandModelReferences,
      orderIndex,
      isPublished,
    } = body;

    const updated = await prisma.lesson.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        summary: summary !== undefined ? summary : undefined,
        definitions: definitions !== undefined ? definitions : undefined,
        characteristics: characteristics !== undefined ? characteristics : undefined,
        practicalApplications: practicalApplications !== undefined ? practicalApplications : undefined,
        misconceptions: misconceptions !== undefined ? misconceptions : undefined,
        limitations: limitations !== undefined ? limitations : undefined,
        brandModelReferences: brandModelReferences !== undefined ? brandModelReferences : undefined,
        orderIndex: orderIndex !== undefined ? orderIndex : undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined,
      },
      include: {
        subcategory: {
          include: { category: true },
        },
        quizQuestions: true,
      },
    });

    return NextResponse.json({
      lesson: updated,
      message: "Lesson updated successfully",
    });
  } catch (error) {
    console.error("Lesson update error:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireOwner();
    } catch {
      return NextResponse.json(
        { error: "Forbidden: Owner authorization required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await prisma.lesson.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Lesson deleted" });
  } catch (error) {
    console.error("Lesson deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
