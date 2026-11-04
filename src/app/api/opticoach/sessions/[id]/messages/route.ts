import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScenarioById } from "@/lib/opticoach/scenarios";
import { retrieveOpticalKnowledge } from "@/lib/opticoach/rag";
import { generateCustomerSimulationTurn, GeminiServiceError } from "@/lib/opticoach/gemini";

export async function POST(
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
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.userId !== user.id && user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden: You cannot submit messages to this session" }, { status: 403 });
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json({ error: "Session is no longer active" }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    const scenario = getScenarioById(session.scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Scenario definition not found" }, { status: 404 });
    }

    // 1. Save Optician Staff message into DB
    const staffMessage = await prisma.optiCoachMessage.create({
      data: {
        sessionId: session.id,
        role: "staff",
        content: content.trim(),
      },
    });

    // 2. Perform RAG Retrieval from Learning Library & Catalogue
    const groundingData = await retrieveOpticalKnowledge(content, scenario);

    // 3. Prepare dialogue history for Gemini
    const dialogueHistory = [
      ...session.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "staff", content: content.trim() },
    ];

    // 4. Generate customer simulation response with Gemini
    let simulationResult;
    try {
      simulationResult = await generateCustomerSimulationTurn({
        scenario,
        dialogueHistory,
        latestStaffMessage: content.trim(),
        groundingText: groundingData.groundingText,
      });
    } catch (simError: any) {
      if (simError instanceof GeminiServiceError) {
        return NextResponse.json(
          {
            error: simError.message,
            code: simError.code,
          },
          { status: simError.statusCode }
        );
      }
      throw simError;
    }

    // 5. Save simulated Customer message into DB
    const customerMessage = await prisma.optiCoachMessage.create({
      data: {
        sessionId: session.id,
        role: "customer",
        content: simulationResult.customerReply,
        metadata: JSON.stringify({
          speakerName: scenario.patientPersona.name,
          customerMood: simulationResult.customerMood,
          coachingNotes: simulationResult.coachingNotes,
          skillsDemonstrated: simulationResult.skillsDemonstrated,
          referencedProductSlugs: simulationResult.referencedProductSlugs,
        }),
      },
    });

    // 6. Update session metadata (skills and products)
    let currentSkills: string[] = [];
    try {
      currentSkills = session.skillsPracticed ? JSON.parse(session.skillsPracticed) : [];
    } catch (e) {
      currentSkills = [];
    }
    const updatedSkills = Array.from(new Set([...currentSkills, ...simulationResult.skillsDemonstrated]));

    let currentProductSlugs: string[] = [];
    try {
      currentProductSlugs = session.contextualProducts ? JSON.parse(session.contextualProducts) : [];
    } catch (e) {
      currentProductSlugs = [];
    }

    const newProductSlugs = [
      ...groundingData.relevantModels.map((m) => m.slug),
      ...simulationResult.referencedProductSlugs,
    ];
    const updatedProductSlugs = Array.from(new Set([...currentProductSlugs, ...newProductSlugs]));

    // Calculate elapsed duration in seconds
    const elapsedSeconds = Math.round((new Date().getTime() - new Date(session.startedAt).getTime()) / 1000);

    const updatedSession = await prisma.optiCoachSession.update({
      where: { id: session.id },
      data: {
        skillsPracticed: JSON.stringify(updatedSkills),
        contextualProducts: JSON.stringify(updatedProductSlugs),
        durationSeconds: Math.max(session.durationSeconds, elapsedSeconds),
      },
    });

    return NextResponse.json({
      staffMessage,
      customerMessage,
      customerMood: simulationResult.customerMood,
      coachingNotes: simulationResult.coachingNotes,
      skillsDemonstrated: simulationResult.skillsDemonstrated,
      skillsPracticed: updatedSkills,
      contextualProducts: groundingData.relevantModels,
      session: updatedSession,
    });
  } catch (err: any) {
    console.error("POST /api/opticoach/sessions/[id]/messages error:", err);
    return NextResponse.json({ error: "Failed to process simulation turn" }, { status: 500 });
  }
}
