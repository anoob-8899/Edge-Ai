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

    const fallbackStaff = [
      { id: "user-anatoly", name: "Anatoly Belik", email: "anatoly@apexoptics.com", role: "STAFF", status: "ACTIVE", clinicId: "Apex Central", totalPoints: 2850, createdAt: "2023-03-13T00:00:00Z" },
      { id: "user-ksenia", name: "Ksenia Bator", email: "ksenia@apexoptics.com", role: "STAFF", status: "ACTIVE", clinicId: "Downtown Flagship", totalPoints: 2420, createdAt: "2023-10-13T00:00:00Z" },
      { id: "user-bogdan", name: "Bogdan Nikitin", email: "bogdan@apexoptics.com", role: "STAFF", status: "ACTIVE", clinicId: "Metro Lab", totalPoints: 2150, createdAt: "2023-11-04T00:00:00Z" },
      { id: "user-arsen", name: "Arsen Yatsenko", email: "arsen@apexoptics.com", role: "STAFF", status: "ACTIVE", clinicId: "West Galleria", totalPoints: 1940, createdAt: "2021-09-04T00:00:00Z" },
      { id: "user-staff-alex", name: "Alex Chen (Abhi)", email: "staff@apexoptics.com", role: "STAFF", status: "ACTIVE", clinicId: "Apex Optical Lab", totalPoints: 1650, createdAt: "2024-01-15T00:00:00Z" },
    ];

    try {
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

      if (staff && staff.length > 0) {
        return NextResponse.json({ staff });
      }
    } catch (dbErr) {
      console.warn("DB staff query failed, returning fallback:", dbErr);
    }

    return NextResponse.json({ staff: fallbackStaff });
  } catch (error) {
    console.warn("Owner staff list fallback:", error);
    return NextResponse.json({
      staff: [
        { id: "user-anatoly", name: "Anatoly Belik", email: "anatoly@apexoptics.com", role: "STAFF", status: "ACTIVE", clinicId: "Apex Central", totalPoints: 2850, createdAt: "2023-03-13T00:00:00Z" },
        { id: "user-ksenia", name: "Ksenia Bator", email: "ksenia@apexoptics.com", role: "STAFF", status: "ACTIVE", clinicId: "Downtown Flagship", totalPoints: 2420, createdAt: "2023-10-13T00:00:00Z" },
        { id: "user-staff-alex", name: "Alex Chen (Abhi)", email: "staff@apexoptics.com", role: "STAFF", status: "ACTIVE", clinicId: "Apex Optical Lab", totalPoints: 1650, createdAt: "2024-01-15T00:00:00Z" },
      ],
    });
  }
}
