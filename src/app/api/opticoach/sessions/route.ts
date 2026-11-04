import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScenarioById } from "@/lib/opticoach/scenarios";
import { retrieveOpticalKnowledge } from "@/lib/opticoach/rag";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const fallbackSessions = [
      {
        id: "sess-sample-1",
        scenarioId: "scenario-polarization",
        scenarioTitle: "Recommending Polarized Lenses for Daytime Driving",
        scenarioCategory: "Lens Technology & Coatings",
        status: "COMPLETED",
        score: 92,
        durationSeconds: 185,
        feedbackSummary: "Excellent explanation of Brewster's angle and horizontal glare attenuation. Addressed patient concerns about smartphone screens with clarity.",
        createdAt: "2026-11-02T14:30:00Z",
        _count: { messages: 6 },
        user: { id: "usr-demo-staff", name: "Alex Chen (Abhi)", email: "staff@apexoptics.com", role: "STAFF" },
      },
      {
        id: "sess-sample-2",
        scenarioId: "scenario-high-index",
        scenarioTitle: "Overcoming High-Index Lens Thickness Hesitation",
        scenarioCategory: "Prescription Optics",
        status: "COMPLETED",
        score: 88,
        durationSeconds: 210,
        feedbackSummary: "Great focus on Abbe value trade-offs and frame aperture sizing to minimize temporal edge thickness on -5.50D Rx.",
        createdAt: "2026-11-03T16:15:00Z",
        _count: { messages: 8 },
        user: { id: "usr-demo-staff", name: "Alex Chen (Abhi)", email: "staff@apexoptics.com", role: "STAFF" },
      },
    ];

    if (!user) {
      return NextResponse.json({ sessions: fallbackSessions, isGuest: true });
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
      if (isOwnerOrAdmin && searchParams.get("mine") !== "true") {
        // All practice staff sessions
      } else {
        where.userId = user.id;
      }
    }

    if (statusFilter && ["ACTIVE", "COMPLETED", "ABANDONED"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    try {
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

      if (sessions && sessions.length > 0) {
        return NextResponse.json({
          sessions,
          isOwnerOrAdmin,
        });
      }
    } catch (dbErr) {
      console.warn("DB session fetch failed, serving fallback:", dbErr);
    }

    return NextResponse.json({
      sessions: fallbackSessions,
      isOwnerOrAdmin,
    });
  } catch (err: any) {
    console.error("GET /api/opticoach/sessions error:", err);
    return NextResponse.json({ error: "Failed to fetch coaching sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      user = {
        id: "usr-guest-user",
        email: "guest@apexoptics.com",
        name: "Staff Optician (Guest)",
        role: "STAFF",
        clinicId: "apex-optics-01",
        status: "ACTIVE",
      };
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
    let initialGrounding: any = { relevantModels: [], relevantLessons: [] };
    try {
      initialGrounding = await retrieveOpticalKnowledge(
        scenario.initialMessage,
        scenario
      );
    } catch {}

    const initialProductSlugs = (initialGrounding.relevantModels || []).map((m: any) => m.slug);

    // Try creating session in database, or fallback to simulated session
    try {
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
          contextualProducts: initialGrounding.relevantModels || [],
          groundingLessons: initialGrounding.relevantLessons || [],
        },
        { status: 201 }
      );
    } catch (dbErr) {
      console.warn("Prisma session create failed, returning simulated session:", dbErr);
      const simulatedSession = {
        id: `sim-sess-${Date.now()}`,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        scenarioCategory: scenario.category,
        status: "ACTIVE" as const,
        skillsPracticed: JSON.stringify(["Optical Discovery", "Lifestyle Empathy"]),
        contextualProducts: JSON.stringify(initialProductSlugs),
        durationSeconds: 0,
        startedAt: new Date().toISOString(),
        messages: [
          {
            id: `msg-initial-${Date.now()}`,
            role: "customer" as const,
            content: scenario.initialMessage,
            metadata: JSON.stringify({
              speakerName: scenario.patientPersona.name,
              customerMood: "skeptical",
              coachingNotes: "Patient has presented their initial question. Welcome them and initiate discovery.",
            }),
            createdAt: new Date().toISOString(),
          },
        ],
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };

      const { FALLBACK_MODELS } = await import("@/lib/mock-data");
      return NextResponse.json(
        {
          session: simulatedSession,
          contextualProducts: FALLBACK_MODELS.slice(0, 3),
          groundingLessons: [],
        },
        { status: 201 }
      );
    }
  } catch (err: any) {
    console.error("POST /api/opticoach/sessions error:", err);
    return NextResponse.json({ error: "Failed to initialize coaching session" }, { status: 500 });
  }
}
