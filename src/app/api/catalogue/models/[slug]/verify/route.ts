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

    const userRole = user.role?.toUpperCase();
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Practice Owners and Administrators can certify technical specifications" },
        { status: 403 }
      );
    }

    const { slug } = await params;
    const body = await request.json();

    const existingModel = await prisma.sunglassModel.findUnique({
      where: { slug },
    });

    if (!existingModel) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const updated = await prisma.sunglassModel.update({
      where: { slug },
      data: {
        verificationStatus: body.verificationStatus || existingModel.verificationStatus,
        verificationNotes: body.verificationNotes !== undefined ? body.verificationNotes : existingModel.verificationNotes,
        lastVerifiedAt: new Date(),
        verifiedBy: user.name,
        // Individual field verification flags if provided
        frameMaterialVerified: body.frameMaterialVerified ?? existingModel.frameMaterialVerified,
        frameMaterial: body.frameMaterial ?? existingModel.frameMaterial,
        lensMaterialVerified: body.lensMaterialVerified ?? existingModel.lensMaterialVerified,
        lensMaterial: body.lensMaterial ?? existingModel.lensMaterial,
        uvProtectionVerified: body.uvProtectionVerified ?? existingModel.uvProtectionVerified,
        uvProtection: body.uvProtection ?? existingModel.uvProtection,
        polarizationVerified: body.polarizationVerified ?? existingModel.polarizationVerified,
        isPolarized: body.isPolarized ?? existingModel.isPolarized,
        lensTechnologyVerified: body.lensTechnologyVerified ?? existingModel.lensTechnologyVerified,
        lensTechnology: body.lensTechnology ?? existingModel.lensTechnology,
        dimensionsVerified: body.dimensionsVerified ?? existingModel.dimensionsVerified,
        lensHeightMm: body.lensHeightMm ?? existingModel.lensHeightMm,
      },
      include: {
        brand: true,
      },
    });

    return NextResponse.json({
      success: true,
      model: updated,
      message: `Model technical verification updated by ${user.name}`,
    });
  } catch (error) {
    console.error("Error updating model verification:", error);
    return NextResponse.json(
      { error: "Failed to update verification" },
      { status: 500 }
    );
  }
}
