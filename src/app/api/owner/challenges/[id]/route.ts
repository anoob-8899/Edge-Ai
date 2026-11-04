import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getChallengeReport } from "@/lib/challenges";
import { z } from "zod";

const updateChallengeSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date").optional(),
  isActive: z.boolean().optional(),
  pointsReward: z.number().int().min(10).max(2000).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (currentUser.role || "").toUpperCase();
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Access restricted to practice owners." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const report = await getChallengeReport(id);

    if (!report) {
      return NextResponse.json({ error: "Weekly challenge not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Owner challenge report fetch error:", error);
    return NextResponse.json(
      { error: "Failed to generate challenge completion report" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (currentUser.role || "").toUpperCase();
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Access restricted to practice owners." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parseResult = updateChallengeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const existingChallenge = await prisma.weeklyChallenge.findUnique({
      where: { id },
    });

    if (!existingChallenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (parseResult.data.title !== undefined) updateData.title = parseResult.data.title;
    if (parseResult.data.description !== undefined) updateData.description = parseResult.data.description;
    if (parseResult.data.endDate !== undefined) updateData.endDate = new Date(parseResult.data.endDate);
    if (parseResult.data.isActive !== undefined) updateData.isActive = parseResult.data.isActive;
    if (parseResult.data.pointsReward !== undefined) updateData.pointsReward = parseResult.data.pointsReward;

    const updated = await prisma.weeklyChallenge.update({
      where: { id },
      data: updateData,
    });

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAuditEvent({
      userId: currentUser.id,
      action: "WEEKLY_CHALLENGE_UPDATED",
      ipAddress,
      metadata: {
        challengeId: id,
        changes: updateData,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Weekly challenge updated successfully.",
      challenge: updated,
    });
  } catch (error) {
    console.error("Owner update challenge error:", error);
    return NextResponse.json(
      { error: "Failed to update weekly challenge" },
      { status: 500 }
    );
  }
}
