import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json({ brands: enrichedBrands });
  } catch (error) {
    console.error("Error fetching catalogue brands:", error);
    return NextResponse.json(
      { error: "Failed to load brands from optical catalogue" },
      { status: 500 }
    );
  }
}
