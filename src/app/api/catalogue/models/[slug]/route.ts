import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const model = await prisma.sunglassModel.findUnique({
      where: { slug },
      include: {
        brand: true,
      },
    });

    if (!model) {
      return NextResponse.json({ error: "Model not found in catalogue" }, { status: 404 });
    }

    // Build verified vs unverified specification breakdown
    const verifiedSpecs: Array<{ label: string; value: string | number | boolean }> = [];
    const unverifiedSpecs: Array<{ label: string; reason: string }> = [];

    if (model.frameShapeVerified && model.frameShape) {
      verifiedSpecs.push({ label: "Frame Shape", value: model.frameShape });
    } else {
      unverifiedSpecs.push({ label: "Frame Shape", reason: "Shape geometry not formally certified" });
    }

    if (model.frameMaterialVerified && model.frameMaterial) {
      verifiedSpecs.push({ label: "Frame Material", value: model.frameMaterial });
    } else {
      unverifiedSpecs.push({ label: "Frame Material", reason: "Raw material composition not verified in supplier record" });
    }

    if (model.frameFinishVerified && model.frameFinish) {
      verifiedSpecs.push({ label: "Frame Finish", value: model.frameFinish });
    } else {
      unverifiedSpecs.push({ label: "Frame Finish", reason: "Specific color/finish code unconfirmed" });
    }

    if (model.lensColorVerified && model.lensColor) {
      verifiedSpecs.push({ label: "Lens Color", value: model.lensColor });
    } else {
      unverifiedSpecs.push({ label: "Lens Color", reason: "Lens tint unverified" });
    }

    if (model.lensMaterialVerified && model.lensMaterial && model.lensMaterial !== "Unknown / Not Verified") {
      verifiedSpecs.push({ label: "Lens Material", value: model.lensMaterial });
    } else {
      unverifiedSpecs.push({ label: "Lens Material", reason: "Optical substrate (glass, CR-39, polycarbonate, nylon) unverified" });
    }

    if (model.uvProtectionVerified && model.uvProtection) {
      verifiedSpecs.push({ label: "UV Protection", value: model.uvProtection });
    } else {
      unverifiedSpecs.push({ label: "UV Protection", reason: "UV spectrum absorption category not certified" });
    }

    if (model.polarizationVerified && model.isPolarized !== null) {
      verifiedSpecs.push({ label: "Polarization", value: model.isPolarized ? "Yes (Polarized)" : "No (Non-Polarized)" });
    } else {
      unverifiedSpecs.push({ label: "Polarization", reason: "Polarization status unverified in technical documentation" });
    }

    if (model.lensTechnologyVerified && model.lensTechnology && !model.lensTechnology.includes("Not Verified")) {
      verifiedSpecs.push({ label: "Lens Technology", value: model.lensTechnology });
    } else {
      unverifiedSpecs.push({ label: "Lens Technology", reason: "Proprietary optical treatments/coatings unverified" });
    }

    if (model.dimensionsVerified && model.lensWidthMm && model.bridgeWidthMm && model.templeLengthMm) {
      verifiedSpecs.push({
        label: "Dimensions",
        value: `${model.lensWidthMm} - ${model.bridgeWidthMm} - ${model.templeLengthMm} mm${
          model.lensHeightMm ? ` (Height: ${model.lensHeightMm} mm)` : ""
        }`,
      });
    } else {
      unverifiedSpecs.push({ label: "Dimensions", reason: "Full 3-box or B-measurement height incomplete" });
    }

    return NextResponse.json({
      model,
      specificationAudit: {
        verifiedSpecs,
        unverifiedSpecs,
        verifiedCount: verifiedSpecs.length,
        unverifiedCount: unverifiedSpecs.length,
        completenessScore: Math.round((verifiedSpecs.length / (verifiedSpecs.length + unverifiedSpecs.length)) * 100),
      },
    });
  } catch (error) {
    console.error("Error fetching model detail:", error);
    return NextResponse.json(
      { error: "Failed to load model detail" },
      { status: 500 }
    );
  }
}
