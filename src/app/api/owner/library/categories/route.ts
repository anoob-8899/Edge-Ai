import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().min(5).max(500),
  icon: z.string().default("Glasses"),
  orderIndex: z.number().int().optional(),
});

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database configuration missing." }, { status: 503 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        subcategories: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                slug: true,
                orderIndex: true,
                isPublished: true,
                _count: {
                  select: { quizQuestions: true },
                },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Owner categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories." }, { status: 500 });
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
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const { name, slug, description, icon, orderIndex } = parsed.data;

    const existingSlug = await prisma.category.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: "Category slug already exists." }, { status: 409 });
    }

    const maxOrder = await prisma.category.aggregate({ _max: { orderIndex: true } });
    const nextOrder = orderIndex !== undefined ? orderIndex : (maxOrder._max.orderIndex || 0) + 1;

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        orderIndex: nextOrder,
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    await logAuditEvent({
      userId: currentUser.id,
      action: "CATEGORY_CREATED",
      ipAddress,
      userAgent,
      metadata: {
        categoryId: category.id,
        name: category.name,
        slug: category.slug,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Category '${category.name}' created.`,
      category,
    }, { status: 201 });
  } catch (error) {
    console.error("Category creation error:", error);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
