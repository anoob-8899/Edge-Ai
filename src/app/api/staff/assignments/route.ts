import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Staff assignments fetch error:", error);
    return NextResponse.json({ error: "Failed to load assignments" }, { status: 500 });
  }
}
