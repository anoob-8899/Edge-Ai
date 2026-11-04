import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FALLBACK_CATEGORIES } from "@/lib/mock-data";
import { shouldFallbackToMock } from "@/lib/demo-mode";

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

    if (categories && categories.length > 0) {
      return NextResponse.json({ categories, isDemoData: false });
    }

    if (!shouldFallbackToMock()) {
      return NextResponse.json({ categories: [], isDemoData: false });
    }

    const formattedFallback = FALLBACK_CATEGORIES.map((cat) => ({
      ...cat,
      _count: { subcategories: cat.subcategories.length },
      subcategories: (cat.subcategories || []).map((sub) => ({
        ...sub,
        _count: { lessons: (sub.lessons || []).length || 1 },
      })),
    }));

    return NextResponse.json({ categories: formattedFallback, isDemoData: true });
  } catch (error) {
    if (!shouldFallbackToMock()) {
      console.error("Database connection failure in /api/library/categories:", error);
      return NextResponse.json(
        { error: "Database service unavailable.", code: "DATABASE_UNAVAILABLE" },
        { status: 503 }
      );
    }
    console.warn("[DEMO MODE] Serving fallback categories:", error);
    const formattedFallback = FALLBACK_CATEGORIES.map((cat) => ({
      ...cat,
      _count: { subcategories: cat.subcategories.length },
      subcategories: (cat.subcategories || []).map((sub) => ({
        ...sub,
        _count: { lessons: (sub.lessons || []).length || 1 },
      })),
    }));
    return NextResponse.json({ categories: formattedFallback, isDemoData: true });
  }
}
