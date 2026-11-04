import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { parseRequirements } from "@/lib/challenges";
import { z } from "zod";

const createChallengeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.string().optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
  pointsReward: z.number().int().min(10).max(2000).default(200),
  requirements: z.object({
    requiredLessons: z.number().int().min(0).default(0),
    requiredQuizzes: z.number().int().min(0).default(0),
    requiredSimulations: z.number().int().min(0).default(0),
    minOptiCoachScore: z.number().int().min(50).max(100).default(70),
    specificLessonId: z.string().optional(),
    specificScenarioId: z.string().optional(),
  }),
});

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (currentUser.role || "").toUpperCase();
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Access restricted to practice owners." },
        { status: 403 }
      );
    }

    const challenges = await prisma.weeklyChallenge.findMany({
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        progress: {
          select: {
            id: true,
            status: true,
            isCompleted: true,
            pointsAwarded: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const activeStaffCount = await prisma.user.count({
      where: {
        OR: [{ role: "staff" }, { role: "STAFF" }],
        status: "ACTIVE",
      },
    });

    const now = new Date();

    const formatted = challenges.map((ch) => {
      const completedCount = ch.progress.filter((p) => p.isCompleted).length;
      const inProgressCount = ch.progress.filter((p) => !p.isCompleted && p.status === "IN_PROGRESS").length;
      const isPastDeadline = now > ch.endDate;
      const completionRate =
        activeStaffCount > 0 ? Math.round((completedCount / activeStaffCount) * 100) : 0;

      return {
        id: ch.id,
        title: ch.title,
        description: ch.description,
        startDate: ch.startDate.toISOString(),
        endDate: ch.endDate.toISOString(),
        pointsReward: ch.pointsReward,
        isActive: ch.isActive,
        isPastDeadline,
        requirements: parseRequirements(ch.requirements),
        creator: ch.creator,
        createdAt: ch.createdAt.toISOString(),
        metrics: {
          totalStaff: activeStaffCount,
          completedCount,
          inProgressCount,
          completionRate,
        },
      };
    });

    return NextResponse.json({
      challenges: formatted,
      totalCount: formatted.length,
      activeStaffCount,
    });
  } catch (error) {
    console.error("Owner challenges fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load owner challenges" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (currentUser.role || "").toUpperCase();
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Access restricted to practice owners." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = createChallengeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "Challenge deadline (endDate) must be after start date." },
        { status: 400 }
      );
    }

    // Require at least one completion requirement
    const totalReqs =
      (data.requirements.requiredLessons || 0) +
      (data.requirements.requiredQuizzes || 0) +
      (data.requirements.requiredSimulations || 0);

    if (totalReqs === 0) {
      return NextResponse.json(
        { error: "A weekly challenge must include at least one completion requirement." },
        { status: 400 }
      );
    }

    const challenge = await prisma.weeklyChallenge.create({
      data: {
        creatorId: currentUser.id,
        title: data.title,
        description: data.description,
        startDate,
        endDate,
        pointsReward: data.pointsReward,
        requirements: data.requirements as any,
        isActive: true,
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAuditEvent({
      userId: currentUser.id,
      action: "WEEKLY_CHALLENGE_CREATED",
      ipAddress,
      metadata: {
        challengeId: challenge.id,
        title: challenge.title,
        pointsReward: challenge.pointsReward,
        endDate: challenge.endDate.toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Weekly challenge "${challenge.title}" created successfully.`,
        challenge,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Owner create challenge error:", error);
    return NextResponse.json(
      { error: "Failed to create weekly challenge." },
      { status: 500 }
    );
  }
}
