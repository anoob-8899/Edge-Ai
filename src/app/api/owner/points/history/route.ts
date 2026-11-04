import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    }

    const ledger = await prisma.pointLedger.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const totalPointsAwarded = ledger.reduce((acc, entry) => acc + entry.points, 0);

    return NextResponse.json({
      ledger,
      totalCount: ledger.length,
      totalPointsAwarded,
    });
  } catch (error) {
    console.error("Owner points history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch points history ledger" },
      { status: 500 }
    );
  }
}
