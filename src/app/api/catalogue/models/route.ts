import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const brandSlug = searchParams.get("brand")?.trim();
    const shape = searchParams.get("shape")?.trim();
    const material = searchParams.get("material")?.trim();
    const polarized = searchParams.get("polarized")?.trim();
    const status = searchParams.get("status")?.trim();
    const approval = searchParams.get("approval")?.trim();

    const where: Prisma.SunglassModelWhereInput = {};

    if (search) {
      where.OR = [
        { officialProductName: { contains: search, mode: "insensitive" } },
        { modelCode: { contains: search, mode: "insensitive" } },
        { subName: { contains: search, mode: "insensitive" } },
        { frameShape: { contains: search, mode: "insensitive" } },
        { frameMaterial: { contains: search, mode: "insensitive" } },
        { lensColor: { contains: search, mode: "insensitive" } },
        { lensTechnology: { contains: search, mode: "insensitive" } },
        { brand: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (brandSlug) {
      where.brand = { slug: brandSlug };
    }

    if (shape) {
      where.frameShape = { contains: shape, mode: "insensitive" };
    }

    if (material) {
      where.frameMaterial = { contains: material, mode: "insensitive" };
    }

    if (polarized === "true") {
      where.isPolarized = true;
    } else if (polarized === "false") {
      where.isPolarized = false;
    } else if (polarized === "unverified") {
      where.polarizationVerified = false;
    }

    if (status && ["VERIFIED", "PARTIALLY_VERIFIED", "UNVERIFIED"].includes(status)) {
      where.verificationStatus = status as Prisma.EnumVerificationStatusFilter;
    }

    if (approval && ["PENDING_REVIEW", "APPROVED", "REJECTED"].includes(approval)) {
      where.approvalStatus = approval as Prisma.EnumApprovalStatusFilter;
    }

    const models = await prisma.sunglassModel.findMany({
      where,
      orderBy: [
        { brand: { orderIndex: "asc" } },
        { officialProductName: "asc" },
      ],
      include: {
        brand: {
          select: {
            id: true,
            slug: true,
            name: true,
            parentCompany: true,
            countryOfOrigin: true,
          },
        },
      },
    });

    return NextResponse.json({
      models,
      totalCount: models.length,
      appliedFilters: {
        search: search || null,
        brand: brandSlug || null,
        shape: shape || null,
        material: material || null,
        polarized: polarized || null,
        status: status || null,
        approval: approval || null,
      },
    });
  } catch (error) {
    console.error("Error fetching catalogue models:", error);
    return NextResponse.json(
      { error: "Failed to search sunglasses catalogue" },
      { status: 500 }
    );
  }
}
