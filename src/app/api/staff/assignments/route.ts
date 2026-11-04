import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { FALLBACK_ASSIGNMENTS } from "@/lib/mock-data";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ assignments: FALLBACK_ASSIGNMENTS, isGuest: true });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ assignments: FALLBACK_ASSIGNMENTS });
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        assignedToId: user.id,
      },
      include: {
        assignedBy: {
          select: { name: true, email: true },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            subcategory: {
              select: {
                slug: true,
                category: {
                  select: { slug: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ assignments: FALLBACK_ASSIGNMENTS });
    }

    return NextResponse.json({ assignments });
  } catch (error) {
    console.warn("Serving fallback assignments:", error);
    return NextResponse.json({ assignments: FALLBACK_ASSIGNMENTS });
  }
}
