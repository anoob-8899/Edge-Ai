import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMasteryTier } from "@/lib/points";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query immutable points ledger for this user
    const ledger = await prisma.pointLedger.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const totalPoints = ledger.reduce((acc, entry) => acc + entry.points, 0);
    const tier = getMasteryTier(totalPoints);

    // Activity breakdown
    const activityCounts: Record<string, { count: number; points: number }> = {};
    for (const entry of ledger) {
      if (!activityCounts[entry.activityType]) {
        activityCounts[entry.activityType] = { count: 0, points: 0 };
      }
      activityCounts[entry.activityType].count++;
      activityCounts[entry.activityType].points += entry.points;
    }

    return NextResponse.json({
      totalPoints,
      tier,
      ledger,
      activityCounts,
      entryCount: ledger.length,
    });
  } catch (error) {
    console.error("Points history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch points history" },
      { status: 500 }
    );
  }
}
