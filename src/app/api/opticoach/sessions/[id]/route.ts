import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScenarioById } from "@/lib/opticoach/scenarios";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const session = await prisma.optiCoachSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Enforce permission: session must belong to user (or admin/owner)
    const role = (user.role || "").toLowerCase();
    if (session.userId !== user.id && role !== "admin" && role !== "owner") {
      return NextResponse.json({ error: "Forbidden: You cannot access another user's session" }, { status: 403 });
    }

    const scenario = getScenarioById(session.scenarioId);

    // Hydrate contextual products if stored
    let contextualProducts: any[] = [];
    if (session.contextualProducts) {
      try {
        const slugs: string[] = JSON.parse(session.contextualProducts);
        if (slugs.length > 0) {
          const models = await prisma.sunglassModel.findMany({
            where: { slug: { in: slugs } },
            include: {
              brand: {
                select: { name: true },
              },
            },
          });
          contextualProducts = models.map((m) => ({
            id: m.id,
            slug: m.slug,
            brandName: m.brand.name,
            officialProductName: m.officialProductName,
            modelCode: m.modelCode,
            frameShape: m.frameShape,
            frameMaterial: m.frameMaterial,
            frameMaterialVerified: m.frameMaterialVerified,
            lensColor: m.lensColor,
            lensMaterial: m.lensMaterial,
            lensMaterialVerified: m.lensMaterialVerified,
            isPolarized: m.isPolarized,
            polarizationVerified: m.polarizationVerified,
            uvProtection: m.uvProtection,
            uvProtectionVerified: m.uvProtectionVerified,
            lensTechnology: m.lensTechnology,
            lensWidthMm: m.lensWidthMm,
            bridgeWidthMm: m.bridgeWidthMm,
            templeLengthMm: m.templeLengthMm,
            dimensionsVerified: m.dimensionsVerified,
            verificationStatus: m.verificationStatus,
            imageUrl: m.imageUrl,
            sourceName: m.sourceName,
          }));
        }
      } catch (e) {
        console.error("Failed to parse contextualProducts JSON:", e);
      }
    }

    let assessment = null;
    if (session.feedbackSummary) {
      try {
        assessment = JSON.parse(session.feedbackSummary);
      } catch (e) {
        console.error("Failed to parse session feedbackSummary JSON:", e);
      }
    }

    return NextResponse.json({
      session,
      scenario,
      contextualProducts,
      assessment,
    });
  } catch (err: any) {
    console.error("GET /api/opticoach/sessions/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
