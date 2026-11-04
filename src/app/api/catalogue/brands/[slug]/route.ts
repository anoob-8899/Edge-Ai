import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const brand = await prisma.brand.findUnique({
      where: { slug },
      include: {
        models: {
          orderBy: { officialProductName: "asc" },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found in catalogue" }, { status: 404 });
    }

    const verifiedCount = brand.models.filter((m: { verificationStatus: string }) => m.verificationStatus === "VERIFIED").length;
    const partiallyVerifiedCount = brand.models.filter((m: { verificationStatus: string }) => m.verificationStatus === "PARTIALLY_VERIFIED").length;
    const pendingCount = brand.models.filter((m: { approvalStatus: string }) => m.approvalStatus === "PENDING_REVIEW").length;
    const approvedCount = brand.models.filter((m: { approvalStatus: string }) => m.approvalStatus === "APPROVED").length;

    return NextResponse.json({
      brand: {
        ...brand,
        modelCount: brand.models.length,
        verifiedCount,
        partiallyVerifiedCount,
        pendingCount,
        approvedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching brand detail:", error);
    return NextResponse.json(
      { error: "Failed to load brand detail" },
      { status: 500 }
    );
  }
}
