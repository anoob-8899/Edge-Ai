import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { evaluateChallengeProgress } from "@/lib/challenges";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Permission check: only assigned staff or owner can mark complete
    const userRole = (user.role || "").toUpperCase();
    if (assignment.assignedToId !== user.id && userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: You cannot complete another staff member's assignment." },
        { status: 403 }
      );
    }

    if (assignment.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "Assignment was already completed.",
        assignment,
      });
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Award assignment points
    const awardResult = await awardPoints({
      userId: assignment.assignedToId,
      activityType: "ASSIGNMENT_COMPLETED",
      referenceId: assignment.id,
      description: `Completed assigned training: ${assignment.title}`,
      metadata: {
        assignmentId: assignment.id,
        activityType: assignment.activityType,
        title: assignment.title,
      },
    });

    // Trigger challenge progress evaluation
    await evaluateChallengeProgress(assignment.assignedToId);

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAuditEvent({
      userId: user.id,
      action: "ASSIGNMENT_COMPLETED",
      ipAddress,
      metadata: {
        assignmentId: assignment.id,
        title: assignment.title,
        pointsAwarded: awardResult.points,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Assignment marked as completed.",
      assignment: updated,
      pointsAwarded: awardResult.points,
      newTotalPoints: awardResult.newTotalPoints,
    });
  } catch (error) {
    console.error("Assignment complete error:", error);
    return NextResponse.json({ error: "Failed to complete assignment" }, { status: 500 });
  }
}
