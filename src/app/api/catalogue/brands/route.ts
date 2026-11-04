import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FALLBACK_BRANDS } from "@/lib/mock-data";
import { shouldFallbackToMock } from "@/lib/demo-mode";

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        models: {
          select: {
            id: true,
            verificationStatus: true,
            approvalStatus: true,
          },
        },
      },
    });

    if (brands && brands.length > 0) {
      const enrichedBrands = brands.map((b: any) => {
        const modelCount = b.models.length;
        const verifiedCount = b.models.filter((m: any) => m.verificationStatus === "VERIFIED").length;
        const partiallyVerifiedCount = b.models.filter((m: any) => m.verificationStatus === "PARTIALLY_VERIFIED").length;
        const pendingCount = b.models.filter((m: any) => m.approvalStatus === "PENDING_REVIEW").length;
        const approvedCount = b.models.filter((m: any) => m.approvalStatus === "APPROVED").length;

        const { models: _unusedModels, ...brandData } = b;
        return {
          ...brandData,
          modelCount,
          verifiedCount,
          partiallyVerifiedCount,
          pendingCount,
          approvedCount,
        };
      });

      return NextResponse.json({ brands: enrichedBrands, isDemoData: false });
    }

    if (!shouldFallbackToMock()) {
      return NextResponse.json({ brands: [], isDemoData: false });
    }

    return NextResponse.json({ brands: FALLBACK_BRANDS, isDemoData: true });
  } catch (error) {
    if (!shouldFallbackToMock()) {
      console.error("Database connection failure in /api/catalogue/brands:", error);
      return NextResponse.json(
        { error: "Database service unavailable. Real catalogue records cannot be retrieved.", code: "DATABASE_UNAVAILABLE" },
        { status: 503 }
      );
    }
    console.warn("[DEMO MODE] Serving fallback brands (PostgreSQL offline or unseeded):", error);
    return NextResponse.json({ brands: FALLBACK_BRANDS, isDemoData: true });
  }
}
