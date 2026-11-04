import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export async function GET() {
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

    // Fetch all staff accounts
    const staffMembers = await prisma.user.findMany({
      where: {
        OR: [{ role: "staff" }, { role: "STAFF" }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        clinicId: true,
        totalPoints: true,
        createdAt: true,
        pointLedger: {
          select: { points: true },
        },
        challengeProgress: {
          where: { isCompleted: true },
          select: { id: true },
        },
        assignmentsReceived: {
          select: { id: true, status: true, dueDate: true },
        },
        progress: {
          select: {
            id: true,
            isCompleted: true,
            completedAt: true,
            lastAccessedAt: true,
            lesson: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        quizAttempts: {
          select: {
            id: true,
            score: true,
            totalQuestions: true,
            passed: true,
            createdAt: true,
            lesson: {
              select: {
                title: true,
              },
            },
          },
        },
        optiCoachSessions: {
          select: {
            id: true,
            scenarioTitle: true,
            status: true,
            score: true,
            durationSeconds: true,
            completedAt: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const totalSystemLessons = await prisma.lesson.count({ where: { isPublished: true } });

    const staffReports = staffMembers.map((staff) => {
      const completedLessons = staff.progress.filter((p) => p.isCompleted);
      const inProgressLessons = staff.progress.filter((p) => !p.isCompleted);

      const totalQuizAttempts = staff.quizAttempts.length;
      const passedQuizzes = staff.quizAttempts.filter((q) => q.passed).length;
      const avgQuizScore =
        totalQuizAttempts > 0
          ? Math.round(
              staff.quizAttempts.reduce((acc, q) => acc + (q.score / (q.totalQuestions || 1)) * 100, 0) /
                totalQuizAttempts
            )
          : null;

      const completedOptiCoach = staff.optiCoachSessions.filter((s) => s.status === "COMPLETED");
      const scoresWithValues = completedOptiCoach
        .map((s) => s.score)
        .filter((sc): sc is number => sc !== null && sc !== undefined);
      const avgOptiCoachScore =
        scoresWithValues.length > 0
          ? Math.round(scoresWithValues.reduce((acc, sc) => acc + sc, 0) / scoresWithValues.length)
          : null;

      // Determine most recent activity timestamp
      const activityTimestamps = [
        ...staff.progress.map((p) => new Date(p.lastAccessedAt).getTime()),
        ...staff.quizAttempts.map((q) => new Date(q.createdAt).getTime()),
        ...staff.optiCoachSessions.map((s) => (s.completedAt ? new Date(s.completedAt).getTime() : 0)),
      ].filter(Boolean);

      const lastActiveAt =
        activityTimestamps.length > 0
          ? new Date(Math.max(...activityTimestamps)).toISOString()
          : null;

      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        status: "ACTIVE",
        clinicId: null,
        joinedAt: staff.createdAt.toISOString(),
        lastActiveAt,
        lessons: {
          completed: completedLessons.length,
          inProgress: inProgressLessons.length,
          totalAvailable: totalSystemLessons,
          completionPercentage: totalSystemLessons > 0 ? Math.round((completedLessons.length / totalSystemLessons) * 100) : 0,
        },
        quizzes: {
          totalAttempts: totalQuizAttempts,
          passedCount: passedQuizzes,
          averageScorePercent: avgQuizScore,
        },
        optiCoach: {
          completedCount: completedOptiCoach.length,
          averageScore: avgOptiCoachScore,
        },
        points: {
          total: staff.pointLedger.reduce((acc, entry) => acc + entry.points, 0),
          challengesCompleted: staff.challengeProgress.length,
        },
        assignments: {
          total: staff.assignmentsReceived.length,
          completed: staff.assignmentsReceived.filter((a) => a.status === "COMPLETED").length,
          pending: staff.assignmentsReceived.filter((a) => a.status === "PENDING" || a.status === "IN_PROGRESS").length,
          overdue: staff.assignmentsReceived.filter(
            (a) => a.status === "OVERDUE" || (a.dueDate && new Date(a.dueDate) < new Date() && a.status !== "COMPLETED")
          ).length,
          completionRate:
            staff.assignmentsReceived.length > 0
              ? Math.round(
                  (staff.assignmentsReceived.filter((a) => a.status === "COMPLETED").length /
                    staff.assignmentsReceived.length) *
                    100
                )
              : 0,
        },
      };
    });

    return NextResponse.json({
      reports: staffReports,
      totalStaff: staffMembers.length,
      activeStaff: staffMembers.length,
    });
  } catch (error) {
    console.error("Staff progress reports error:", error);
    return NextResponse.json({ error: "Failed to generate staff progress reports." }, { status: 500 });
  }
}
