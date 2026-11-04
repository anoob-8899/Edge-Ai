import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

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

    const staff = await prisma.user.findMany({
      where: {
        role: "staff",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        clinicId: true,
        totalPoints: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error("Owner staff list fetch error:", error);
    return NextResponse.json({ error: "Failed to load staff list" }, { status: 500 });
  }
}
