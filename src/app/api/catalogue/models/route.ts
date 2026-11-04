import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { shouldFallbackToMock } from "@/lib/demo-mode";

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

    let models: any[] = [];
    let isDbSuccess = false;
    try {
      models = await prisma.sunglassModel.findMany({
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
      isDbSuccess = true;
    } catch (dbErr) {
      if (!shouldFallbackToMock()) {
        console.error("Database connection failure in /api/catalogue/models:", dbErr);
        return NextResponse.json(
          { error: "Database service unavailable. Real optical catalogue cannot be retrieved.", code: "DATABASE_UNAVAILABLE" },
          { status: 503 }
        );
      }
      console.warn("[DEMO MODE] PostgreSQL models query failed, filtering fallback dataset:", dbErr);
      models = [];
    }

    if (!models || models.length === 0) {
      if (!isDbSuccess && !shouldFallbackToMock()) {
        return NextResponse.json(
          { error: "Database service unavailable.", code: "DATABASE_UNAVAILABLE" },
          { status: 503 }
        );
      }

      if (!isDbSuccess) {
        // Filter fallback models only when DB was unreachable in demo mode
        const { FALLBACK_MODELS } = await import("@/lib/mock-data");
        models = FALLBACK_MODELS.filter((m) => {
          if (brandSlug && m.brand.slug !== brandSlug) return false;
          if (shape && !m.frameShape.toLowerCase().includes(shape.toLowerCase())) return false;
          if (material && (!m.frameMaterial || !m.frameMaterial.toLowerCase().includes(material.toLowerCase()))) return false;
          if (polarized === "true" && !m.isPolarized) return false;
          if (polarized === "false" && m.isPolarized) return false;
          if (search) {
            const s = search.toLowerCase();
            const match =
              m.officialProductName.toLowerCase().includes(s) ||
              m.modelCode.toLowerCase().includes(s) ||
              m.frameShape.toLowerCase().includes(s) ||
              m.brand.name.toLowerCase().includes(s) ||
              (m.frameMaterial && m.frameMaterial.toLowerCase().includes(s));
            if (!match) return false;
          }
          return true;
        });
      }
    }

    return NextResponse.json({
      models,
      totalCount: models.length,
      isDemoData: !isDbSuccess,
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
    if (!shouldFallbackToMock()) {
      console.error("Error fetching catalogue models:", error);
      return NextResponse.json(
        { error: "Database service unavailable.", code: "DATABASE_UNAVAILABLE" },
        { status: 503 }
      );
    }
    const { FALLBACK_MODELS } = await import("@/lib/mock-data");
    return NextResponse.json({
      models: FALLBACK_MODELS,
      totalCount: FALLBACK_MODELS.length,
      isDemoData: true,
      appliedFilters: {},
    });
  }
}
