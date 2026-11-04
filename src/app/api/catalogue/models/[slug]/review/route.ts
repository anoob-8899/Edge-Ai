import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Role check: Only Owner or Admin can review and approve catalogue records
    const userRole = user.role?.toUpperCase();
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Practice Owners and Administrators can approve catalogue records" },
        { status: 403 }
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const { approvalStatus, reviewNotes } = body;

    if (!approvalStatus || !["APPROVED", "REJECTED", "PENDING_REVIEW"].includes(approvalStatus)) {
      return NextResponse.json(
        { error: "Invalid approvalStatus. Must be APPROVED, REJECTED, or PENDING_REVIEW." },
        { status: 400 }
      );
    }

    const existingModel = await prisma.sunglassModel.findUnique({
      where: { slug },
    });

    if (!existingModel) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const updated = await prisma.sunglassModel.update({
      where: { slug },
      data: {
        approvalStatus,
        reviewNotes: reviewNotes !== undefined ? reviewNotes : existingModel.reviewNotes,
        approvedBy: approvalStatus === "APPROVED" ? user.name : existingModel.approvedBy,
        approvedAt: approvalStatus === "APPROVED" ? new Date() : existingModel.approvedAt,
      },
      include: {
        brand: true,
      },
    });

    return NextResponse.json({
      success: true,
      model: updated,
      message: `Model '${updated.officialProductName}' approval status set to ${approvalStatus}`,
    });
  } catch (error) {
    console.error("Error in owner review workflow:", error);
    return NextResponse.json(
      { error: "Failed to update review status" },
      { status: 500 }
    );
  }
}
