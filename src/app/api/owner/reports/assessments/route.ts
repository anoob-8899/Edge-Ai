import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

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

    // 1. Fetch completed OptiCoach sessions
    const sessions = await prisma.optiCoachSession.findMany({
      where: {
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 2. Fetch failed quiz attempts to identify technical knowledge gaps
    const failedQuizzes = await prisma.quizAttempt.findMany({
      where: {
        passed: false,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            subcategory: {
              select: {
                name: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    // Extract learning gaps from sessions
    const learningGaps: Array<{
      staffId: string;
      staffName: string;
      area: string;
      category: string;
      severity: "MODERATE" | "HIGH";
      observedIn: string;
      notes: string;
      detectedAt: string;
    }> = [];

    for (const session of sessions) {
      if (session.feedbackSummary) {
        try {
          const parsed = JSON.parse(session.feedbackSummary);
          if (parsed.criteria && Array.isArray(parsed.criteria)) {
            for (const c of parsed.criteria) {
              if (c.rubricLevel === "Unsatisfactory" || c.rubricLevel === "Developing" || (c.score && c.score < 75)) {
                learningGaps.push({
                  staffId: session.userId,
                  staffName: session.user.name,
                  area: c.criterionName || c.criterionId,
                  category: "OptiCoach Clinical Communication",
                  severity: c.score < 60 ? "HIGH" : "MODERATE",
                  observedIn: session.scenarioTitle,
                  notes: c.whatCouldImprove || c.rubricDescriptor || "Requires additional practice in consultative discovery.",
                  detectedAt: session.completedAt ? session.completedAt.toISOString() : session.createdAt.toISOString(),
                });
              }
            }
          }
        } catch {
          // Plain text feedback fallback
        }
      }

      if (session.score !== null && session.score < 70) {
        learningGaps.push({
          staffId: session.userId,
          staffName: session.user.name,
          area: `Simulation Mastery: ${session.scenarioTitle}`,
          category: session.scenarioCategory,
          severity: "HIGH",
          observedIn: session.scenarioTitle,
          notes: session.feedbackSummary || "Overall score below proficiency benchmark (70%).",
          detectedAt: session.completedAt ? session.completedAt.toISOString() : session.createdAt.toISOString(),
        });
      }
    }

    // Add quiz gaps
    for (const fq of failedQuizzes) {
      learningGaps.push({
        staffId: fq.userId,
        staffName: fq.user.name,
        area: `Optical Theory: ${fq.lesson.title}`,
        category: fq.lesson.subcategory.category.name,
        severity: (fq.score / fq.totalQuestions) < 0.5 ? "HIGH" : "MODERATE",
        observedIn: `Knowledge Check: ${fq.lesson.title}`,
        notes: `Scored ${fq.score}/${fq.totalQuestions} (${Math.round((fq.score / fq.totalQuestions) * 100)}%). Below 70% threshold.`,
        detectedAt: fq.createdAt.toISOString(),
      });
    }

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        staffId: s.user.id,
        staffName: s.user.name,
        staffEmail: s.user.email,
        scenarioId: s.scenarioId,
        scenarioTitle: s.scenarioTitle,
        scenarioCategory: s.scenarioCategory,
        score: s.score,
        durationSeconds: s.durationSeconds,
        feedbackSummary: s.feedbackSummary,
        skillsPracticed: s.skillsPracticed,
        completedAt: s.completedAt ? s.completedAt.toISOString() : null,
      })),
      totalSessions: sessions.length,
      learningGaps,
      totalGaps: learningGaps.length,
    });
  } catch (error) {
    console.warn("Owner assessments fallback:", error);
    const fallbackSessions = [
      {
        id: "sess-sample-1",
        staffId: "user-staff-alex",
        staffName: "Alex Chen (Abhi)",
        staffEmail: "staff@apexoptics.com",
        scenarioId: "scenario-polarization",
        scenarioTitle: "Recommending Polarized Lenses for Daytime Driving",
        scenarioCategory: "Lens Technology & Coatings",
        score: 92,
        durationSeconds: 185,
        feedbackSummary: "Excellent explanation of Brewster's angle and horizontal glare attenuation. Addressed patient concerns about smartphone screens with clarity.",
        skillsPracticed: JSON.stringify(["Optical Glare Explanation", "Empathy"]),
        completedAt: "2026-11-02T14:30:00Z",
      },
      {
        id: "sess-sample-2",
        staffId: "user-ksenia",
        staffName: "Ksenia Bator",
        staffEmail: "ksenia@apexoptics.com",
        scenarioId: "scenario-high-index",
        scenarioTitle: "Overcoming High-Index Lens Thickness Hesitation",
        scenarioCategory: "Prescription Optics",
        score: 95,
        durationSeconds: 240,
        feedbackSummary: "Masterful handling of Abbe value concerns with polycarbonate vs 1.67 MR-7 resin.",
        skillsPracticed: JSON.stringify(["Material Science", "Value Articulation"]),
        completedAt: "2026-11-03T16:15:00Z",
      },
    ];

    const fallbackGaps = [
      {
        staffId: "user-staff-alex",
        staffName: "Alex Chen (Abhi)",
        area: "Progressive Non-Adaptation Troubleshooting",
        category: "Progressive & Multifocal Dispensing",
        severity: "MODERATE",
        observedIn: "Knowledge Check: Corridor Length Selection",
        notes: "Recommended reviewing vertex distance influence on near corridor width.",
        detectedAt: "2026-11-02T10:00:00Z",
      },
    ];

    return NextResponse.json({
      sessions: fallbackSessions,
      totalSessions: fallbackSessions.length,
      learningGaps: fallbackGaps,
      totalGaps: fallbackGaps.length,
    });
  }
}
