import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScenarioById } from "@/lib/opticoach/scenarios";
import { generateStrictSessionAssessment, buildIncompleteSessionAssessment } from "@/lib/opticoach/assessment";
import { GeminiServiceError } from "@/lib/opticoach/gemini";
import { awardPoints } from "@/lib/points";
import { evaluateChallengeProgress } from "@/lib/challenges";

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

    if (id.startsWith("sim-sess-")) {
      const simulatedAssessment = {
        sessionId: id,
        scenarioId: "scenario-polarization",
        scenarioTitle: "Recommending Polarized Lenses for Daytime Driving",
        overallScore: 91,
        competencyScores: [
          { name: "Optical Knowledge & Glare Mechanics", score: 95, feedback: "Clearly explained horizontal glare vs vertical transmission." },
          { name: "Patient Empathy & Active Listening", score: 90, feedback: "Understood daytime driving fatigue and reflections off dashboard." },
          { name: "Objection Handling & Value Articulation", score: 88, feedback: "Overcame pricing questions by focusing on visual comfort." },
          { name: "Professional Communication", score: 92, feedback: "Professional tone, crisp medical explanations." },
        ],
        strengths: ["Strong clinical understanding of Brewster's angle", "Confident recommendation of Ray-Ban and Oakley polarized models"],
        growthAreas: ["Proactively mention HUD windshield display interactions early in consultation"],
        recommendedFollowUpAction: "Review Lens Coatings module lesson on Anti-Reflective coatings.",
      };

      return NextResponse.json({
        assessment: simulatedAssessment,
        pointsAwarded: 50,
        totalPoints: 1700,
        session: {
          id,
          status: "COMPLETED",
          score: 91,
          feedbackSummary: "Great performance in patient glare discovery.",
        },
      });
    }

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

    // Enforce permission: session must belong to user OR user is owner/admin
    const role = (user.role || "").toLowerCase();
    if (session.userId !== user.id && role !== "admin" && role !== "owner") {
      return NextResponse.json(
        { error: "Forbidden: You cannot evaluate another user's session" },
        { status: 403 }
      );
    }

    const scenario = getScenarioById(session.scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Scenario definition not found" }, { status: 404 });
    }

    const staffMessages = session.messages.filter((m: { role: string; content: string }) => m.role === "staff");
    const dialogueHistory = session.messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    let assessment;
    if (staffMessages.length === 0) {
      // Incomplete session: 0 staff turns taken
      assessment = buildIncompleteSessionAssessment({
        scenario,
        staffTurnCount: 0,
      });
    } else {
      // Complete or partial session: evaluate real saved messages with Gemini
      try {
        assessment = await generateStrictSessionAssessment({
          scenario,
          dialogueHistory,
        });
      } catch (reviewErr: any) {
        console.error("Session assessment error:", reviewErr);
        // The conversation messages are strictly PRESERVED in PostgreSQL.
        // Return structured error with retry flag
        const statusCode = reviewErr instanceof GeminiServiceError ? reviewErr.statusCode : 500;
        const errorCode = reviewErr instanceof GeminiServiceError ? reviewErr.code : "ASSESSMENT_FAILED";
        return NextResponse.json(
          {
            error: reviewErr.message || "Failed to generate AI assessment",
            code: errorCode,
            canRetry: true,
            preservedMessageCount: session.messages.length,
          },
          { status: statusCode }
        );
      }
    }

    // Calculate final elapsed duration
    const elapsedSeconds = Math.round(
      (new Date().getTime() - new Date(session.startedAt).getTime()) / 1000
    );

    const updatedSession = await prisma.optiCoachSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        score: assessment.overallScore,
        feedbackSummary: JSON.stringify(assessment),
        completedAt: new Date(),
        durationSeconds: Math.max(session.durationSeconds, elapsedSeconds),
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

    let pointsAwarded = 0;
    let newTotalPoints = undefined;

    // Only award points for genuine consultations where staff actively participated and passed
    if (staffMessages.length > 0 && assessment.overallScore >= 70) {
      const award = await awardPoints({
        userId: session.userId,
        activityType: "OPTICOACH_COMPLETED",
        referenceId: session.id,
        description: `Completed OptiCoach consultation simulation: ${session.scenarioTitle} (Score: ${assessment.overallScore})`,
        metadata: {
          sessionId: session.id,
          scenarioId: session.scenarioId,
          scenarioTitle: session.scenarioTitle,
          score: assessment.overallScore,
          rubricGrade: assessment.rubricGrade,
        },
      });

      if (award.awarded) {
        pointsAwarded = award.points;
        newTotalPoints = award.newTotalPoints;
      }

      // Check and update any active weekly challenges
      await evaluateChallengeProgress(session.userId);
    }

    return NextResponse.json({
      session: updatedSession,
      assessment,
      review: assessment, // Backward compatibility
      pointsAwarded,
      newTotalPoints,
    });
  } catch (err: any) {
    console.error("POST /api/opticoach/sessions/[id]/complete error:", err);
    return NextResponse.json(
      {
        error: "Failed to finalize session review. Conversation is preserved.",
        canRetry: true,
      },
      { status: 500 }
    );
  }
}
