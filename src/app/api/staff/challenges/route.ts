import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRequirements, evaluateChallengeProgress } from "@/lib/challenges";
import { FALLBACK_WEEKLY_CHALLENGES } from "@/lib/mock-data";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        challenges: FALLBACK_WEEKLY_CHALLENGES,
        totalActive: FALLBACK_WEEKLY_CHALLENGES.length,
        isGuest: true,
      });
    }

    try {
      // Proactively refresh evaluation of challenges for the user
      await evaluateChallengeProgress(user.id);

      const challenges = await prisma.weeklyChallenge.findMany({
        where: {
          isActive: true,
        },
        include: {
          progress: {
            where: { userId: user.id },
          },
        },
        orderBy: { endDate: "asc" },
      });

      const now = new Date();

      const formatted = challenges.map((ch) => {
        const userProgress = ch.progress[0];
        const reqs = parseRequirements(ch.requirements);
        const isPastDeadline = now > ch.endDate;

        let status = "IN_PROGRESS";
        if (userProgress?.isCompleted) {
          status = "COMPLETED";
        } else if (isPastDeadline) {
          status = "EXPIRED";
        }

        return {
          id: ch.id,
          title: ch.title,
          description: ch.description,
          startDate: ch.startDate.toISOString(),
          endDate: ch.endDate.toISOString(),
          pointsReward: ch.pointsReward,
          requirements: reqs,
          isPastDeadline,
          userProgress: {
            status,
            isCompleted: userProgress?.isCompleted || false,
            completedAt: userProgress?.completedAt?.toISOString() || null,
            pointsAwarded: userProgress?.pointsAwarded || false,
            progressDetails: userProgress?.currentProgress || {
              lessonsCompleted: 0,
              requiredLessons: reqs.requiredLessons || 0,
              quizzesPassed: 0,
              requiredQuizzes: reqs.requiredQuizzes || 0,
              simulationsCompleted: 0,
              requiredSimulations: reqs.requiredSimulations || 0,
              percentComplete: 0,
            },
          },
        };
      });

      if (formatted.length > 0) {
        return NextResponse.json({
          challenges: formatted,
          totalActive: formatted.filter((c) => !c.isPastDeadline).length,
        });
      }
    } catch (dbErr) {
      console.warn("DB challenges query failed, serving fallback:", dbErr);
    }

    return NextResponse.json({
      challenges: FALLBACK_WEEKLY_CHALLENGES,
      totalActive: FALLBACK_WEEKLY_CHALLENGES.length,
    });
  } catch (error) {
    console.warn("Staff challenges fallback:", error);
    return NextResponse.json({
      challenges: FALLBACK_WEEKLY_CHALLENGES,
      totalActive: FALLBACK_WEEKLY_CHALLENGES.length,
    });
  }
}
