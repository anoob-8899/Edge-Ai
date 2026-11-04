import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScenarioById } from "@/lib/opticoach/scenarios";
import { retrieveOpticalKnowledge } from "@/lib/opticoach/rag";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const targetUserId = searchParams.get("userId");
    const statusFilter = searchParams.get("status");
    const role = (user.role || "").toLowerCase();
    const isOwnerOrAdmin = role === "owner" || role === "admin";

    const where: any = {};

    if (targetUserId) {
      if (targetUserId !== user.id && !isOwnerOrAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Staff members can only review their own training sessions" },
          { status: 403 }
        );
      }
      where.userId = targetUserId;
    } else {
      // If no specific userId is requested:
      // Owners/Admins see all practice sessions by default unless mine=true
      if (isOwnerOrAdmin && searchParams.get("mine") !== "true") {
        // All practice staff sessions
      } else {
        where.userId = user.id;
      }
    }

    if (statusFilter && ["ACTIVE", "COMPLETED", "ABANDONED"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const sessions = await prisma.optiCoachSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({
      sessions,
      isOwnerOrAdmin,
    });
  } catch (err: any) {
    console.error("GET /api/opticoach/sessions error:", err);
    return NextResponse.json({ error: "Failed to fetch coaching sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { scenarioId } = body;

    if (!scenarioId || typeof scenarioId !== "string") {
      return NextResponse.json({ error: "Valid scenarioId is required" }, { status: 400 });
    }

    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: `Scenario '${scenarioId}' not found` }, { status: 404 });
    }

    // Retrieve initial optical grounding and contextual product cards
    const initialGrounding = await retrieveOpticalKnowledge(
      scenario.initialMessage,
      scenario
    );

    const initialProductSlugs = initialGrounding.relevantModels.map((m) => m.slug);

    // Create session in database
    const session = await prisma.optiCoachSession.create({
      data: {
        userId: user.id,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        scenarioCategory: scenario.category,
        status: "ACTIVE",
        skillsPracticed: JSON.stringify([]),
        contextualProducts: JSON.stringify(initialProductSlugs),
        messages: {
          create: {
            role: "customer",
            content: scenario.initialMessage,
            metadata: JSON.stringify({
              speakerName: scenario.patientPersona.name,
              customerMood: "skeptical",
              coachingNotes: "Patient has presented their initial question. Welcome them and initiate discovery.",
            }),
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(
      {
        session,
        scenario,
        contextualProducts: initialGrounding.relevantModels,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/opticoach/sessions error:", err);
    return NextResponse.json({ error: "Failed to initialize coaching session" }, { status: 500 });
  }
}
