import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { logAuditEvent } from "@/lib/audit";

export interface ChallengeRequirements {
  requiredLessons?: number;
  requiredQuizzes?: number;
  requiredSimulations?: number;
  minOptiCoachScore?: number;
  specificLessonId?: string;
  specificScenarioId?: string;
}

export interface ProgressSummary {
  lessonsCompleted: number;
  requiredLessons: number;
  quizzesPassed: number;
  requiredQuizzes: number;
  simulationsCompleted: number;
  requiredSimulations: number;
  minOptiCoachScore: number;
  percentComplete: number;
}

/**
 * Parses challenge requirements safely
 */
export function parseRequirements(raw: any): ChallengeRequirements {
  if (!raw || typeof raw !== "object") {
    return {
      requiredLessons: 1,
      requiredQuizzes: 1,
      requiredSimulations: 0,
      minOptiCoachScore: 70,
    };
  }

  return {
    requiredLessons: Number(raw.requiredLessons) || 0,
    requiredQuizzes: Number(raw.requiredQuizzes) || 0,
    requiredSimulations: Number(raw.requiredSimulations) || 0,
    minOptiCoachScore: Number(raw.minOptiCoachScore) || 70,
    specificLessonId: raw.specificLessonId ? String(raw.specificLessonId) : undefined,
    specificScenarioId: raw.specificScenarioId ? String(raw.specificScenarioId) : undefined,
  };
}

/**
 * Evaluates a staff member's progress against all active weekly challenges.
 * When all requirements for a challenge are satisfied before the deadline,
 * automatically and idempotently awards the challenge bonus points.
 */
export async function evaluateChallengeProgress(userId: string) {
  const now = new Date();

  // Find all active challenges
  const activeChallenges = await prisma.weeklyChallenge.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
    },
  });

  const results = [];

  for (const challenge of activeChallenges) {
    const isPastDeadline = now > challenge.endDate;
    const reqs = parseRequirements(challenge.requirements);

    // Get or create ChallengeProgress record
    let progress = await prisma.challengeProgress.findUnique({
      where: {
        challengeId_userId: {
          challengeId: challenge.id,
          userId,
        },
      },
    });

    if (!progress) {
      progress = await prisma.challengeProgress.create({
        data: {
          challengeId: challenge.id,
          userId,
          status: isPastDeadline ? "EXPIRED" : "IN_PROGRESS",
          currentProgress: {},
        },
      });
    }

    // If already completed, skip re-awarding
    if (progress.isCompleted) {
      results.push({
        challengeId: challenge.id,
        title: challenge.title,
        status: "COMPLETED",
        isCompleted: true,
        alreadyCompleted: true,
      });
      continue;
    }

    // If expired and not completed, mark as EXPIRED
    if (isPastDeadline) {
      if (progress.status !== "EXPIRED") {
        await prisma.challengeProgress.update({
          where: { id: progress.id },
          data: { status: "EXPIRED" },
        });
      }
      results.push({
        challengeId: challenge.id,
        title: challenge.title,
        status: "EXPIRED",
        isCompleted: false,
        alreadyCompleted: false,
      });
      continue;
    }

    // Calculate real achievements during the challenge window [startDate, endDate]
    const windowStart = challenge.startDate;
    const windowEnd = challenge.endDate;

    // 1. Lessons completed in window
    const lessonWhere: any = {
      userId,
      isCompleted: true,
      completedAt: {
        gte: windowStart,
        lte: windowEnd,
      },
    };
    if (reqs.specificLessonId) {
      lessonWhere.lessonId = reqs.specificLessonId;
    }
    const lessonsCompleted = await prisma.userLessonProgress.count({
      where: lessonWhere,
    });

    // 2. Quizzes passed in window
    const quizWhere: any = {
      userId,
      passed: true,
      createdAt: {
        gte: windowStart,
        lte: windowEnd,
      },
    };
    if (reqs.specificLessonId) {
      quizWhere.lessonId = reqs.specificLessonId;
    }
    const quizzesPassed = await prisma.quizAttempt.count({
      where: quizWhere,
    });

    // 3. OptiCoach simulations completed in window with passing score
    const simWhere: any = {
      userId,
      status: "COMPLETED",
      score: { gte: reqs.minOptiCoachScore || 70 },
      completedAt: {
        gte: windowStart,
        lte: windowEnd,
      },
    };
    if (reqs.specificScenarioId) {
      simWhere.scenarioId = reqs.specificScenarioId;
    }
    const simulationsCompleted = await prisma.optiCoachSession.count({
      where: simWhere,
    });

    // Calculate completion criteria
    const reqLessons = reqs.requiredLessons || 0;
    const reqQuizzes = reqs.requiredQuizzes || 0;
    const reqSims = reqs.requiredSimulations || 0;

    const lessonsMet = lessonsCompleted >= reqLessons;
    const quizzesMet = quizzesPassed >= reqQuizzes;
    const simsMet = simulationsCompleted >= reqSims;

    const allRequirementsMet = lessonsMet && quizzesMet && simsMet;

    // Calculate percentage
    let totalRequirementsCount = 0;
    let totalRequirementsMet = 0;
    if (reqLessons > 0) {
      totalRequirementsCount += reqLessons;
      totalRequirementsMet += Math.min(lessonsCompleted, reqLessons);
    }
    if (reqQuizzes > 0) {
      totalRequirementsCount += reqQuizzes;
      totalRequirementsMet += Math.min(quizzesPassed, reqQuizzes);
    }
    if (reqSims > 0) {
      totalRequirementsCount += reqSims;
      totalRequirementsMet += Math.min(simulationsCompleted, reqSims);
    }

    const percentComplete =
      totalRequirementsCount > 0
        ? Math.min(100, Math.round((totalRequirementsMet / totalRequirementsCount) * 100))
        : 100;

    const progressSummary: ProgressSummary = {
      lessonsCompleted,
      requiredLessons: reqLessons,
      quizzesPassed,
      requiredQuizzes: reqQuizzes,
      simulationsCompleted,
      requiredSimulations: reqSims,
      minOptiCoachScore: reqs.minOptiCoachScore || 70,
      percentComplete,
    };

    if (allRequirementsMet && !progress.isCompleted) {
      // Award challenge completion!
      const completionTime = new Date();

      await prisma.$transaction(async (tx) => {
        await tx.challengeProgress.update({
          where: { id: progress.id },
          data: {
            status: "COMPLETED",
            isCompleted: true,
            completedAt: completionTime,
            pointsAwarded: true,
            currentProgress: progressSummary as any,
          },
        });
      });

      // Award bonus points via validated server logic
      const awardResult = await awardPoints({
        userId,
        activityType: "CHALLENGE_COMPLETED",
        referenceId: challenge.id,
        points: challenge.pointsReward,
        description: `Completed Weekly Challenge: ${challenge.title}`,
        metadata: {
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          progress: progressSummary,
          completedAt: completionTime.toISOString(),
        },
      });

      results.push({
        challengeId: challenge.id,
        title: challenge.title,
        status: "COMPLETED",
        isCompleted: true,
        pointsAwarded: awardResult.points,
        newTotalPoints: awardResult.newTotalPoints,
        progress: progressSummary,
      });
    } else {
      // Update progress record with latest numbers
      await prisma.challengeProgress.update({
        where: { id: progress.id },
        data: {
          currentProgress: progressSummary as any,
          status: "IN_PROGRESS",
        },
      });

      results.push({
        challengeId: challenge.id,
        title: challenge.title,
        status: "IN_PROGRESS",
        isCompleted: false,
        progress: progressSummary,
      });
    }
  }

  return results;
}

/**
 * Generate full owner report for challenge completion
 */
export async function getChallengeReport(challengeId: string) {
  const challenge = await prisma.weeklyChallenge.findUnique({
    where: { id: challengeId },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!challenge) {
    return null;
  }

  const reqs = parseRequirements(challenge.requirements);

  const activeStaff = await prisma.user.findMany({
    where: {
      OR: [{ role: "staff" }, { role: "STAFF" }],
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      clinicId: true,
      challengeProgress: {
        where: { challengeId },
      },
    },
    orderBy: { name: "asc" },
  });

  const staffReport = activeStaff.map((staff) => {
    const prog = staff.challengeProgress[0];
    const curr = (prog?.currentProgress as any) || {};

    return {
      staffId: staff.id,
      name: staff.name,
      email: staff.email,
      clinicId: staff.clinicId,
      status: prog?.status || (new Date() > challenge.endDate ? "EXPIRED" : "NOT_STARTED"),
      isCompleted: prog?.isCompleted || false,
      completedAt: prog?.completedAt ? prog.completedAt.toISOString() : null,
      pointsAwarded: prog?.pointsAwarded ? challenge.pointsReward : 0,
      lessonsCompleted: curr.lessonsCompleted || 0,
      quizzesPassed: curr.quizzesPassed || 0,
      simulationsCompleted: curr.simulationsCompleted || 0,
      percentComplete: curr.percentComplete || 0,
    };
  });

  const completedCount = staffReport.filter((s) => s.isCompleted).length;
  const inProgressCount = staffReport.filter((s) => !s.isCompleted && s.status === "IN_PROGRESS").length;
  const expiredCount = staffReport.filter((s) => !s.isCompleted && (s.status === "EXPIRED" || s.status === "NOT_STARTED")).length;
  const totalStaff = activeStaff.length;
  const completionRate = totalStaff > 0 ? Math.round((completedCount / totalStaff) * 100) : 0;

  return {
    challenge: {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      pointsReward: challenge.pointsReward,
      isActive: challenge.isActive,
      isExpired: new Date() > challenge.endDate,
      requirements: reqs,
      creator: challenge.creator,
    },
    metrics: {
      totalStaff,
      completedCount,
      inProgressCount,
      expiredCount,
      completionRate,
    },
    staffReport,
  };
}
