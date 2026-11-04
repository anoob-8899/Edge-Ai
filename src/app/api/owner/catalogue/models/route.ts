import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const createModelSchema = z.object({
  brandId: z.string().min(1),
  officialProductName: z.string().min(2).max(150),
  modelCode: z.string().min(2).max(50),
  subName: z.string().max(100).optional().nullable(),
  slug: z.string().min(2).max(150),
  category: z.string().default("Sunglasses"),
  gender: z.string().optional().nullable(),
  frameShape: z.string().min(2),
  frameShapeVerified: z.boolean().default(true),
  frameMaterial: z.string().optional().nullable(),
  frameMaterialVerified: z.boolean().default(false),
  frameFinish: z.string().optional().nullable(),
  frameFinishVerified: z.boolean().default(false),
  lensColor: z.string().optional().nullable(),
  lensColorVerified: z.boolean().default(false),
  lensMaterial: z.string().optional().nullable(),
  lensMaterialVerified: z.boolean().default(false),
  uvProtection: z.string().optional().nullable(),
  uvProtectionVerified: z.boolean().default(false),
  isPolarized: z.boolean().optional().nullable(),
  polarizationVerified: z.boolean().default(false),
  lensTechnology: z.string().optional().nullable(),
  lensTechnologyVerified: z.boolean().default(false),
  lensWidthMm: z.number().optional().nullable(),
  bridgeWidthMm: z.number().optional().nullable(),
  templeLengthMm: z.number().optional().nullable(),
  lensHeightMm: z.number().optional().nullable(),
  dimensionsVerified: z.boolean().default(false),
  sourceUrl: z.string().url().default("https://edgeopticals.com"),
  sourceName: z.string().default("Edge Opticals Reference"),
  approvalStatus: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED"]).default("PENDING_REVIEW"),
  reviewNotes: z.string().max(1000).optional().nullable(),
  opticalLearningNotes: z.string().max(2000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database configuration missing." }, { status: 503 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const userRole = currentUser.role?.toUpperCase();
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Access restricted to Practice Owners." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const approval = searchParams.get("approval");
    const brandId = searchParams.get("brandId");
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (approval) {
      where.approvalStatus = approval;
    }
    if (brandId) {
      where.brandId = brandId;
    }
    if (search) {
      where.OR = [
        { officialProductName: { contains: search, mode: "insensitive" } },
        { modelCode: { contains: search, mode: "insensitive" } },
        { frameShape: { contains: search, mode: "insensitive" } },
        { brand: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const models = await prisma.sunglassModel.findMany({
      where,
      orderBy: [
        { approvalStatus: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      models,
      totalCount: models.length,
      pendingCount: models.filter((m) => m.approvalStatus === "PENDING_REVIEW").length,
      approvedCount: models.filter((m) => m.approvalStatus === "APPROVED").length,
    });
  } catch (error) {
    console.error("Owner models error:", error);
    return NextResponse.json({ error: "Failed to fetch models." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database configuration missing." }, { status: 503 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const userRole = currentUser.role?.toUpperCase();
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Access restricted to Practice Owners." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = createModelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const existingSlug = await prisma.sunglassModel.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "A product model with this slug already exists." },
        { status: 409 }
      );
    }

    // Determine verification status based on flags
    const verifiedCount = [
      parsed.data.frameShapeVerified,
      parsed.data.frameMaterialVerified,
      parsed.data.lensColorVerified,
      parsed.data.lensMaterialVerified,
      parsed.data.uvProtectionVerified,
      parsed.data.polarizationVerified,
      parsed.data.dimensionsVerified,
    ].filter(Boolean).length;

    let verificationStatus: "VERIFIED" | "PARTIALLY_VERIFIED" | "UNVERIFIED" = "UNVERIFIED";
    if (verifiedCount >= 5) {
      verificationStatus = "VERIFIED";
    } else if (verifiedCount > 0) {
      verificationStatus = "PARTIALLY_VERIFIED";
    }

    const model = await prisma.sunglassModel.create({
      data: {
        ...parsed.data,
        verificationStatus,
        lastVerifiedAt: verifiedCount > 0 ? new Date() : null,
        verifiedBy: verifiedCount > 0 ? currentUser.name : null,
      },
      include: {
        brand: true,
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    await logAuditEvent({
      userId: currentUser.id,
      action: "MODEL_CREATED",
      ipAddress,
      userAgent,
      metadata: {
        modelId: model.id,
        modelCode: model.modelCode,
        officialProductName: model.officialProductName,
        brandId: model.brandId,
        approvalStatus: model.approvalStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Product '${model.officialProductName}' added to catalogue.`,
      model,
    }, { status: 201 });
  } catch (error) {
    console.error("Model creation error:", error);
    return NextResponse.json({ error: "Failed to create product model." }, { status: 500 });
  }
}
