import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export const POINT_VALUES = {
  LESSON_COMPLETION: 50,
  QUIZ_PASSED: 100,
  OPTICOACH_COMPLETED: 150,
  ASSIGNMENT_COMPLETED: 75,
  CHALLENGE_COMPLETED: 200,
} as const;

export type PointActivityType =
  | "LESSON_COMPLETION"
  | "QUIZ_PASSED"
  | "OPTICOACH_COMPLETED"
  | "ASSIGNMENT_COMPLETED"
  | "CHALLENGE_COMPLETED";

export interface AwardPointsParams {
  userId: string;
  activityType: PointActivityType;
  referenceId: string;
  points?: number;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AwardPointsResult {
  awarded: boolean;
  points: number;
  newTotalPoints: number;
  ledgerId?: string;
  reason?: "SUCCESS" | "ALREADY_AWARDED" | "USER_NOT_FOUND" | "INVALID_POINTS";
}

/**
 * Validated server-side point awarding logic.
 * Enforces atomic database transaction, prevents duplicate awards for identical completions,
 * writes to immutable PointLedger, and records an auditable trail.
 */
export async function awardPoints({
  userId,
  activityType,
  referenceId,
  points,
  description,
  metadata = {},
  ipAddress,
  userAgent,
}: AwardPointsParams): Promise<AwardPointsResult> {
  const pointsToAward = points !== undefined ? points : POINT_VALUES[activityType] || 0;

  if (pointsToAward <= 0) {
    return {
      awarded: false,
      points: 0,
      newTotalPoints: 0,
      reason: "INVALID_POINTS",
    };
  }

  // 1. Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, totalPoints: true, email: true, name: true },
  });

  if (!user) {
    return {
      awarded: false,
      points: 0,
      newTotalPoints: 0,
      reason: "USER_NOT_FOUND",
    };
  }

  // 2. Pre-check for duplicate award in PointLedger
  const existingAward = await prisma.pointLedger.findUnique({
    where: {
      userId_activityType_referenceId: {
        userId,
        activityType,
        referenceId,
      },
    },
  });

  if (existingAward) {
    return {
      awarded: false,
      points: 0,
      newTotalPoints: user.totalPoints,
      ledgerId: existingAward.id,
      reason: "ALREADY_AWARDED",
    };
  }

  // 3. Perform atomic transaction: write ledger entry + update user total points
  try {
    const result = await prisma.$transaction(async (tx) => {
      const ledger = await tx.pointLedger.create({
        data: {
          userId,
          activityType,
          referenceId,
          points: pointsToAward,
          description,
          metadata: metadata || {},
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: { increment: pointsToAward },
        },
        select: { totalPoints: true },
      });

      return { ledger, updatedUser };
    });

    // 4. Record audit log
    await logAuditEvent({
      userId,
      action: "POINTS_AWARDED",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent,
      metadata: {
        activityType,
        referenceId,
        pointsAwarded: pointsToAward,
        newTotalPoints: result.updatedUser.totalPoints,
        description,
        ...metadata,
      },
    });

    return {
      awarded: true,
      points: pointsToAward,
      newTotalPoints: result.updatedUser.totalPoints,
      ledgerId: result.ledger.id,
      reason: "SUCCESS",
    };
  } catch (err: any) {
    // Check for PostgreSQL unique constraint violation (P2002) in concurrent races
    if (err.code === "P2002" || err.message?.includes("Unique constraint failed")) {
      const freshUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalPoints: true },
      });
      return {
        awarded: false,
        points: 0,
        newTotalPoints: freshUser?.totalPoints || user.totalPoints,
        reason: "ALREADY_AWARDED",
      };
    }
    console.error("Critical error awarding points in transaction:", err);
    throw err;
  }
}

/**
 * Compute Mastery Tier from points balance
 */
export function getMasteryTier(points: number): {
  tierName: string;
  badgeColor: string;
  level: number;
  nextTierThreshold: number | null;
  progressPercent: number;
} {
  if (points >= 1000) {
    return {
      tierName: "Master Optical Specialist",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      level: 4,
      nextTierThreshold: null,
      progressPercent: 100,
    };
  }
  if (points >= 500) {
    return {
      tierName: "Senior Refractionist",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      level: 3,
      nextTierThreshold: 1000,
      progressPercent: Math.round(((points - 500) / 500) * 100),
    };
  }
  if (points >= 200) {
    return {
      tierName: "Certified Optical Dispenser",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      level: 2,
      nextTierThreshold: 500,
      progressPercent: Math.round(((points - 200) / 300) * 100),
    };
  }
  return {
    tierName: "Apprentice Optician",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    level: 1,
    nextTierThreshold: 200,
    progressPercent: Math.round((points / 200) * 100),
  };
}

/**
 * Fetch staff leaderboard with exact verifiable totals from PointLedger
 */
export async function getStaffLeaderboard() {
  const staffUsers = await prisma.user.findMany({
    where: {
      OR: [{ role: "staff" }, { role: "STAFF" }],
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      clinicId: true,
      totalPoints: true,
      createdAt: true,
      pointLedger: {
        select: {
          id: true,
          points: true,
          activityType: true,
          createdAt: true,
        },
      },
      challengeProgress: {
        where: { isCompleted: true },
        select: { id: true },
      },
      progress: {
        where: { isCompleted: true },
        select: { id: true },
      },
      quizAttempts: {
        where: { passed: true },
        select: { id: true },
      },
      optiCoachSessions: {
        where: { status: "COMPLETED" },
        select: { id: true },
      },
    },
  });

  // Calculate stats per user
  const leaderboard = staffUsers.map((user) => {
    // Verify points by summing the ledger directly to ensure 100% audit integrity
    const verifiedPointsFromLedger = user.pointLedger.reduce((acc, entry) => acc + entry.points, 0);
    const tier = getMasteryTier(verifiedPointsFromLedger);

    // Calculate recent points (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentPoints = user.pointLedger
      .filter((entry) => new Date(entry.createdAt) >= sevenDaysAgo)
      .reduce((acc, entry) => acc + entry.points, 0);

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      clinicId: user.clinicId || "Apex Optics Lab",
      totalPoints: verifiedPointsFromLedger,
      recentPoints,
      challengesCompleted: user.challengeProgress.length,
      lessonsCompleted: user.progress.length,
      quizzesPassed: user.quizAttempts.length,
      simulationsCompleted: user.optiCoachSessions.length,
      tier,
    };
  });

  // Sort descending by totalPoints, then challengesCompleted, then name
  leaderboard.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.challengesCompleted !== a.challengesCompleted) {
      return b.challengesCompleted - a.challengesCompleted;
    }
    return a.name.localeCompare(b.name);
  });

  // Add rank
  return leaderboard.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));
}
