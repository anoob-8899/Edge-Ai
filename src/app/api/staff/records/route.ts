import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        records: [
          {
            id: "rec-1",
            title: "Dispensing Optician Level 2 Certification",
            notes: "Certified in progressive lens fitting, lensometry neutralization, and high-index selection.",
            confidentialSalaryOrBonusTier: "Senior Dispenser Level II Tier (Verified)",
            createdAt: "2026-10-15T09:00:00Z",
          },
        ],
        isGuest: true,
      });
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
    console.warn("Staff records fetch fallback:", error);
    return NextResponse.json({
      records: [
        {
          id: "rec-1",
          title: "Dispensing Optician Level 2 Certification",
          notes: "Certified in progressive lens fitting, lensometry neutralization, and high-index selection.",
          confidentialSalaryOrBonusTier: "Senior Dispenser Level II Tier (Verified)",
          createdAt: "2026-10-15T09:00:00Z",
        },
      ],
    });
  }
}
