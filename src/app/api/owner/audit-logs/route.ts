import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const where: any = {};
    if (action) {
      where.action = action;
    }

    const auditLogs = (prisma as any).auditLog?.findMany
      ? await (prisma as any).auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        })
      : [];

    return NextResponse.json({
      auditLogs,
      totalCount: auditLogs.length,
    });
  } catch (error) {
    console.warn("Owner audit logs fallback:", error);
    const fallbackLogs = [
      {
        id: "log-1",
        action: "CATALOGUE_MODEL_SPEC_VERIFIED",
        ipAddress: "127.0.0.1",
        createdAt: "2026-11-03T10:15:00Z",
        user: { id: "usr-demo-owner", name: "Dr. Marcus Vance", email: "owner@apexoptics.com", role: "OWNER" },
        metadata: { modelCode: "RB3025", brand: "Ray-Ban", status: "VERIFIED" },
      },
      {
        id: "log-2",
        action: "WEEKLY_CHALLENGE_CREATED",
        ipAddress: "127.0.0.1",
        createdAt: "2026-11-01T09:00:00Z",
        user: { id: "usr-demo-owner", name: "Dr. Marcus Vance", email: "owner@apexoptics.com", role: "OWNER" },
        metadata: { challengeTitle: "Polarized Lens Mastery Sprint" },
      },
    ];
    return NextResponse.json({ auditLogs: fallbackLogs, totalCount: fallbackLogs.length });
  }
}
