import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const updateModelSchema = z.object({
  officialProductName: z.string().min(2).max(150).optional(),
  modelCode: z.string().min(2).max(50).optional(),
  subName: z.string().max(100).optional().nullable(),
  frameShape: z.string().min(2).optional(),
  frameShapeVerified: z.boolean().optional(),
  frameMaterial: z.string().optional().nullable(),
  frameMaterialVerified: z.boolean().optional(),
  frameFinish: z.string().optional().nullable(),
  frameFinishVerified: z.boolean().optional(),
  lensColor: z.string().optional().nullable(),
  lensColorVerified: z.boolean().optional(),
  lensMaterial: z.string().optional().nullable(),
  lensMaterialVerified: z.boolean().optional(),
  uvProtection: z.string().optional().nullable(),
  uvProtectionVerified: z.boolean().optional(),
  isPolarized: z.boolean().optional().nullable(),
  polarizationVerified: z.boolean().optional(),
  lensTechnology: z.string().optional().nullable(),
  lensTechnologyVerified: z.boolean().optional(),
  lensWidthMm: z.number().optional().nullable(),
  bridgeWidthMm: z.number().optional().nullable(),
  templeLengthMm: z.number().optional().nullable(),
  lensHeightMm: z.number().optional().nullable(),
  dimensionsVerified: z.boolean().optional(),
  approvalStatus: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED"]).optional(),
  reviewNotes: z.string().max(1000).optional().nullable(),
  opticalLearningNotes: z.string().max(2000).optional().nullable(),
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
        { error: "Forbidden. Access restricted to Practice Owners." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateModelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const existing = await prisma.sunglassModel.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product model not found." }, { status: 404 });
    }

    const isApprovalChange = parsed.data.approvalStatus && parsed.data.approvalStatus !== existing.approvalStatus;

    // Recalculate verification status
    const verifiedShape = parsed.data.frameShapeVerified ?? existing.frameShapeVerified;
    const verifiedMaterial = parsed.data.frameMaterialVerified ?? existing.frameMaterialVerified;
    const verifiedColor = parsed.data.lensColorVerified ?? existing.lensColorVerified;
    const verifiedLensMat = parsed.data.lensMaterialVerified ?? existing.lensMaterialVerified;
    const verifiedUv = parsed.data.uvProtectionVerified ?? existing.uvProtectionVerified;
    const verifiedPol = parsed.data.polarizationVerified ?? existing.polarizationVerified;
    const verifiedDim = parsed.data.dimensionsVerified ?? existing.dimensionsVerified;

    const verifiedCount = [
      verifiedShape,
      verifiedMaterial,
      verifiedColor,
      verifiedLensMat,
      verifiedUv,
      verifiedPol,
      verifiedDim,
    ].filter(Boolean).length;

    let verificationStatus = existing.verificationStatus;
    if (verifiedCount >= 5) {
      verificationStatus = "VERIFIED";
    } else if (verifiedCount > 0) {
      verificationStatus = "PARTIALLY_VERIFIED";
    } else {
      verificationStatus = "UNVERIFIED";
    }

    const updated = await prisma.sunglassModel.update({
      where: { id },
      data: {
        ...parsed.data,
        verificationStatus,
        approvedBy: parsed.data.approvalStatus === "APPROVED" ? currentUser.name : (parsed.data.approvalStatus === "PENDING_REVIEW" ? null : existing.approvedBy),
        approvedAt: parsed.data.approvalStatus === "APPROVED" ? new Date() : (parsed.data.approvalStatus === "PENDING_REVIEW" ? null : existing.approvedAt),
        lastVerifiedAt: new Date(),
        verifiedBy: currentUser.name,
      },
      include: {
        brand: true,
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    await logAuditEvent({
      userId: currentUser.id,
      action: isApprovalChange ? `MODEL_${parsed.data.approvalStatus}` : "MODEL_SPEC_UPDATED",
      ipAddress,
      userAgent,
      metadata: {
        modelId: updated.id,
        modelCode: updated.modelCode,
        officialProductName: updated.officialProductName,
        previousApproval: existing.approvalStatus,
        newApproval: updated.approvalStatus,
        verificationStatus: updated.verificationStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Product '${updated.officialProductName}' updated.`,
      model: updated,
    });
  } catch (error) {
    console.error("Model update error:", error);
    return NextResponse.json({ error: "Failed to update product model." }, { status: 500 });
  }
}

export async function DELETE(
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
        { error: "Forbidden. Access restricted to Practice Owners." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.sunglassModel.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product model not found." }, { status: 404 });
    }

    await prisma.sunglassModel.delete({
      where: { id },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    await logAuditEvent({
      userId: currentUser.id,
      action: "MODEL_DELETED",
      ipAddress,
      userAgent,
      metadata: {
        modelId: id,
        officialProductName: existing.officialProductName,
        modelCode: existing.modelCode,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product model deleted successfully.",
    });
  } catch (error) {
    console.error("Model delete error:", error);
    return NextResponse.json({ error: "Failed to delete product model." }, { status: 500 });
  }
}
