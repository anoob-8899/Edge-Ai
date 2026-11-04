import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    // Strict tenant isolation: staff cannot inspect other staff records
    if (requestedUserId && requestedUserId !== user.id) {
      const userRole = (user.role || "").toUpperCase();
      if (userRole !== "OWNER" && userRole !== "ADMIN") {
        return NextResponse.json(
          { error: "Forbidden: Cross-staff record access is strictly prohibited." },
          { status: 403 }
        );
      }
    }

    const targetUserId = requestedUserId || user.id;

    const records = await prisma.staffPrivateRecord.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Staff records fetch error:", error);
    return NextResponse.json({ error: "Failed to load private records" }, { status: 500 });
  }
}
