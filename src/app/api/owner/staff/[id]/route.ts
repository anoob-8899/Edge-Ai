import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";
import type { Role } from "@prisma/client";

const updateStaffSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "INVITED"]).optional(),
  name: z.string().min(2).max(100).optional(),
  clinicId: z.string().max(50).optional(),
  role: z.enum(["staff", "owner", "admin", "STAFF", "OWNER", "ADMIN"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Forbidden. Access restricted to Practice Owners and Administrators." },
        { status: 403 }
      );
    }

    const { id: staffId } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const targetStaff = await prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!targetStaff) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }

    // Prevent modifying other owners unless super-admin
    if (targetStaff.role === "owner" && targetStaff.id !== currentUser.id) {
      return NextResponse.json(
        { error: "Cannot modify other practice owner accounts." },
        { status: 403 }
      );
    }

    const roleValue = parsed.data.role
      ? (parsed.data.role.toLowerCase() as Role)
      : undefined;

    const updatedStaff = await prisma.user.update({
      where: { id: staffId },
      data: {
        name: parsed.data.name ?? targetStaff.name,
        ...(roleValue ? { role: roleValue } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    await logAuditEvent({
      userId: currentUser.id,
      action: "STAFF_UPDATED",
      ipAddress,
      userAgent,
      metadata: {
        staffId: targetStaff.id,
        staffEmail: targetStaff.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Staff optician profile updated successfully.`,
      staff: {
        ...updatedStaff,
        status: "ACTIVE",
        clinicId: null,
      },
    });
  } catch (error) {
    console.error("Staff update error:", error);
    return NextResponse.json({ error: "Failed to update staff optician account." }, { status: 500 });
  }
}
