import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const createAssignmentSchema = z.object({
  title: z.string().min(3),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  activityType: z.enum(["LESSON", "QUIZ", "OPTICOACH_SCENARIO"]).default("LESSON"),
  lessonId: z.string().optional(),
  scenarioId: z.string().optional(),
  scenarioTitle: z.string().optional(),
  targetType: z.enum(["INDIVIDUAL", "GROUP"]).default("INDIVIDUAL"),
  assignedToId: z.string().optional(),
  targetGroup: z.string().optional(),
});

export async function GET() {
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

    const assignments = await prisma.assignment.findMany({
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        assignedBy: {
          select: { id: true, name: true, email: true },
        },
        lesson: {
          select: { id: true, title: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Owner assignments fetch error:", error);
    return NextResponse.json({ error: "Failed to load assignments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json().catch(() => ({}));
    const parsed = createAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const dueDate = data.dueDate ? new Date(data.dueDate) : null;

    if (data.targetType === "GROUP") {
      const activeStaff = await prisma.user.findMany({
        where: {
          OR: [{ role: "staff" }, { role: "STAFF" }],
          status: "ACTIVE",
        },
      });

      const created = await prisma.$transaction(
        activeStaff.map((staff) =>
          prisma.assignment.create({
            data: {
              assignedById: currentUser.id,
              assignedToId: staff.id,
              targetGroup: data.targetGroup || "ALL_STAFF",
              activityType: data.activityType,
              lessonId: data.lessonId,
              scenarioId: data.scenarioId,
              scenarioTitle: data.scenarioTitle,
              title: data.title,
              notes: data.notes,
              dueDate,
              status: "PENDING",
            },
          })
        )
      );

      const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
      await logAuditEvent({
        userId: currentUser.id,
        action: "GROUP_ASSIGNMENT_DISPATCHED",
        ipAddress,
        metadata: {
          title: data.title,
          staffCount: activeStaff.length,
          activityType: data.activityType,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Dispatched assignment to ${activeStaff.length} staff opticians.`,
        assignments: created,
      });
    } else {
      if (!data.assignedToId) {
        return NextResponse.json(
          { error: "Individual assignment requires assignedToId" },
          { status: 400 }
        );
      }

      const assignment = await prisma.assignment.create({
        data: {
          assignedById: currentUser.id,
          assignedToId: data.assignedToId,
          activityType: data.activityType,
          lessonId: data.lessonId,
          scenarioId: data.scenarioId,
          scenarioTitle: data.scenarioTitle,
          title: data.title,
          notes: data.notes,
          dueDate,
          status: "PENDING",
        },
      });

      const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
      await logAuditEvent({
        userId: currentUser.id,
        action: "ASSIGNMENT_CREATED",
        ipAddress,
        metadata: {
          assignmentId: assignment.id,
          assignedToId: data.assignedToId,
          title: data.title,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Assignment created successfully.",
        assignment,
      });
    }
  } catch (error) {
    console.error("Create assignment error:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
