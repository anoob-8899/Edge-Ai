import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const createBrandSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  parentCompany: z.string().max(100).optional().nullable(),
  countryOfOrigin: z.string().max(100).optional().nullable(),
  heritage: z.string().max(2000).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
});

export async function GET() {
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

    const brands = await prisma.brand.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        _count: {
          select: { models: true },
        },
        models: {
          select: {
            approvalStatus: true,
            verificationStatus: true,
          },
        },
      },
    });

    const formatted = brands.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      parentCompany: b.parentCompany,
      countryOfOrigin: b.countryOfOrigin,
      heritage: b.heritage,
      logoUrl: b.logoUrl,
      websiteUrl: b.websiteUrl,
      orderIndex: b.orderIndex,
      totalModels: b._count.models,
      approvedCount: b.models.filter((m) => m.approvalStatus === "APPROVED").length,
      pendingCount: b.models.filter((m) => m.approvalStatus === "PENDING_REVIEW").length,
      unverifiedCount: b.models.filter((m) => m.verificationStatus === "UNVERIFIED").length,
    }));

    return NextResponse.json({ brands: formatted });
  } catch (error) {
    console.error("Owner brands error:", error);
    return NextResponse.json({ error: "Failed to fetch brands." }, { status: 500 });
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
    const parsed = createBrandSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const { name, slug, parentCompany, countryOfOrigin, heritage, logoUrl, websiteUrl } = parsed.data;

    const existingSlug = await prisma.brand.findFirst({
      where: { OR: [{ slug }, { name }] },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "A brand with this name or slug already exists." },
        { status: 409 }
      );
    }

    const maxOrder = await prisma.brand.aggregate({ _max: { orderIndex: true } });
    const nextOrder = (maxOrder._max.orderIndex || 0) + 1;

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        parentCompany: parentCompany || null,
        countryOfOrigin: countryOfOrigin || null,
        heritage: heritage || null,
        logoUrl: logoUrl || null,
        websiteUrl: websiteUrl || null,
        orderIndex: nextOrder,
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    await logAuditEvent({
      userId: currentUser.id,
      action: "BRAND_CREATED",
      ipAddress,
      userAgent,
      metadata: {
        brandId: brand.id,
        name: brand.name,
        slug: brand.slug,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Brand '${brand.name}' registered successfully.`,
      brand,
    }, { status: 201 });
  } catch (error) {
    console.error("Brand creation error:", error);
    return NextResponse.json({ error: "Failed to create brand." }, { status: 500 });
  }
}
