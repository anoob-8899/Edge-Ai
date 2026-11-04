import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        subcategories: {
          orderBy: { orderIndex: "asc" },
          include: {
            _count: {
              select: { lessons: true },
            },
          },
        },
        _count: {
          select: { subcategories: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
