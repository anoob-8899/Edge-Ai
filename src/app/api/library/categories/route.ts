import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FALLBACK_CATEGORIES } from "@/lib/mock-data";

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

    const formattedFallback = FALLBACK_CATEGORIES.map((cat) => ({
      ...cat,
      _count: { subcategories: cat.subcategories.length },
      subcategories: (cat.subcategories || []).map((sub) => ({
        ...sub,
        _count: { lessons: (sub.lessons || []).length || 1 },
      })),
    }));

    if (categories && categories.length > 0) {
      return NextResponse.json({ categories });
    }

    return NextResponse.json({ categories: formattedFallback });
  } catch (error) {
    console.warn("Serving fallback categories (PostgreSQL offline or unseeded):", error);
    const formattedFallback = FALLBACK_CATEGORIES.map((cat) => ({
      ...cat,
      _count: { subcategories: cat.subcategories.length },
      subcategories: (cat.subcategories || []).map((sub) => ({
        ...sub,
        _count: { lessons: (sub.lessons || []).length || 1 },
      })),
    }));
    return NextResponse.json({ categories: formattedFallback });
  }
}
