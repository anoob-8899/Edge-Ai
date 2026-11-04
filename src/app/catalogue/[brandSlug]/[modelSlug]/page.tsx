"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Glasses,
  Sparkles,
  Calendar,
  User,
  Layers,
  Award,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { VerificationBadge, ApprovalBadge } from "@/components/catalogue/verified-indicator";
import { OwnerReviewDialog } from "@/components/catalogue/owner-review-dialog";
import { SunglassModelItem } from "@/lib/types";


interface SpecAudit {
  verifiedSpecs: Array<{ label: string; value: string | number | boolean }>;
  unverifiedSpecs: Array<{ label: string; reason: string }>;
  verifiedCount: number;
  unverifiedCount: number;
  completenessScore: number;
}

export default function ModelDetailPage() {
  const params = useParams();
  const brandSlug = params?.brandSlug as string;
  const modelSlug = params?.modelSlug as string;

  const [model, setModel] = React.useState<SunglassModelItem | null>(null);
  const [audit, setAudit] = React.useState<SpecAudit | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isReviewOpen, setIsReviewOpen] = React.useState(false);
  const [currentUserRole, setCurrentUserRole] = React.useState<string | null>(null);

  // Check auth user
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setCurrentUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  const fetchModel = React.useCallback(async () => {
    if (!modelSlug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/catalogue/models/${modelSlug}`);
      const data = await res.json();
      if (data.model) {
        setModel(data.model);
        setAudit(data.specificationAudit);
      }
    } catch (e) {
      console.error("Error loading model detail:", e);
    } finally {
      setLoading(false);
    }
  }, [modelSlug]);

  React.useEffect(() => {
    fetchModel();
  }, [fetchModel]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-8 space-y-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="h-96 bg-slate-100 rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  if (!model) {
    return (
      <AppShell>
        <div className="py-12">
          <EmptyState
            icon={<Glasses className="w-6 h-6" />}
            title="Model Not Found"
            description="The requested sunglasses model record could not be found."
            action={
              <Link href="/catalogue">
                <Button size="sm">Back to Catalogue</Button>
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  const parsedVariants: Array<{ size?: string; colorCode?: string; sku?: string }> = model.variants
    ? JSON.parse(model.variants)
    : [];

  return (
    <AppShell>
      <div className="space-y-6 pb-20">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-[#65758B] flex-wrap">
          <Link href="/catalogue" className="hover:text-[#4285F4] transition-colors">
            Branded Sunglasses
          </Link>
          <span>/</span>
          <Link href={`/catalogue/brands/${model.brand.slug}`} className="hover:text-[#4285F4] transition-colors">
            {model.brand.name}
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#172B4D]">{model.modelCode}</span>
        </div>

        {/* Model Hero Header Banner */}
        <div className="rounded-3xl bg-white border border-[#DCE8F5] p-6 md:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Product Image Stage */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full h-80 rounded-2xl bg-gradient-to-b from-[#F8FAFC] to-[#EFF6FF] border border-[#E2E8F0] p-6 flex items-center justify-center overflow-hidden">
                {model.imageUrl ? (
                  <img
                    src={model.imageUrl}
                    alt={`${model.brand.name} ${model.officialProductName}`}
                    className="max-h-full max-w-full object-contain drop-shadow-md"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <Glasses className="w-16 h-16 mx-auto mb-2 text-[#4285F4]" />
                    <span className="text-xs font-medium">Silhouette Record</span>
                  </div>
                )}

                {/* Polarization Callout */}
                {model.polarizationVerified && model.isPolarized && (
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#172B4D] text-white shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      POLARIZED OPTICS
                    </span>
                  </div>
                )}
              </div>

              {/* Verified Image Note */}
              <div className="mt-2 text-[11px] text-[#8796AA] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Licensed manufacturer optical reference representation</span>
              </div>
            </div>

            {/* Right: Product Model Identity & Audit Header */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/catalogue/brands/${model.brand.slug}`}
                    className="font-mono text-xs font-bold text-[#4285F4] bg-[#E8F3FF] px-2.5 py-1 rounded-md border border-[#B8D9FF] hover:bg-[#4285F4] hover:text-white transition-colors"
                  >
                    {model.brand.name}
                  </Link>

                  <span className="font-mono text-xs font-semibold text-[#172B4D] bg-[#F0F7FF] px-2.5 py-1 rounded-md border border-[#DCE8F5]">
                    Code: {model.modelCode}
                  </span>

                  <span className="text-xs text-[#65758B] px-2 py-0.5 rounded bg-slate-100">
                    {model.category}
                  </span>
                </div>

                <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#172B4D]">
                  {model.officialProductName}
                </h1>

                {model.subName && (
                  <p className="text-sm font-semibold text-[#65758B]">
                    {model.subName}
                  </p>
                )}
              </div>

              {/* Status Badges & Quick Action */}
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <VerificationBadge status={model.verificationStatus} />
                  <ApprovalBadge status={model.approvalStatus} />
                  {audit && (
                    <span className="text-xs font-medium text-[#65758B] px-2 py-0.5 rounded bg-white border border-[#E2E8F0]">
                      {audit.completenessScore}% Specs Verified
                    </span>
                  )}
                </div>

                {/* Owner Review Action Button */}
                <Button
                  size="sm"
                  onClick={() => setIsReviewOpen(true)}
                  className="bg-[#4285F4] hover:bg-[#2A56C6] text-white flex items-center gap-1.5 text-xs shadow-2xs"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Owner Sign-off</span>
                </Button>
              </div>

              {/* Missing Specifications Warning (if partially verified) */}
              {model.verificationStatus === "PARTIALLY_VERIFIED" && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Incomplete / Unverified Technical Specifications Alert</span>
                  </div>
                  <p className="leading-relaxed">
                    Per optical training standards, specifications that could not be formally certified
                    from official manufacturer documents are stored as <strong>unverified</strong>. Staff
                    must not infer technical attributes from photographs.
                  </p>
                  {model.verificationNotes && (
                    <p className="pt-1 text-[11px] text-amber-700 italic border-t border-amber-200/60">
                      Audit Note: {model.verificationNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Quick Specification Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FBFF] border border-[#DCE8F5]">
                  <span className="text-[#8796AA] text-[11px] block font-medium">Shape</span>
                  <span className="font-bold text-[#172B4D] truncate block mt-0.5">
                    {model.frameShape}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FBFF] border border-[#DCE8F5]">
                  <span className="text-[#8796AA] text-[11px] block font-medium">Lens Width</span>
                  <span className="font-bold text-[#172B4D] truncate block mt-0.5">
                    {model.lensWidthMm ? `${model.lensWidthMm} mm` : "Unverified"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FBFF] border border-[#DCE8F5]">
                  <span className="text-[#8796AA] text-[11px] block font-medium">Polarization</span>
                  <span className="font-bold text-[#172B4D] truncate block mt-0.5">
                    {model.polarizationVerified
                      ? model.isPolarized
                        ? "Polarized"
                        : "Non-Polarized"
                      : "Unverified"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FBFF] border border-[#DCE8F5]">
                  <span className="text-[#8796AA] text-[11px] block font-medium">UV Protection</span>
                  <span className="font-bold text-[#172B4D] truncate block mt-0.5">
                    {model.uvProtectionVerified ? "100% UV Block" : "Unverified"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specification Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Specifications Table (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="rounded-2xl border-[#DCE8F5] bg-white overflow-hidden">
              <CardHeader className="p-5 border-b border-[#E2E8F0] bg-[#FAFDFE]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                    <Glasses className="w-4 h-4 text-[#4285F4]" />
                    <span>Technical Optical Specifications</span>
                  </CardTitle>
                  <span className="text-[11px] font-mono font-medium text-[#65758B]">
                    ISO 12312-1 Compliance Standard
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="divide-y divide-[#E2E8F0] text-xs">
                  {/* Brand & Product Name */}
                  <div className="p-4 flex items-start justify-between gap-4">
                    <span className="font-medium text-[#65758B] w-40 shrink-0">Brand & Official Name</span>
                    <div className="text-right font-semibold text-[#172B4D] flex-1">
                      {model.brand.name} • {model.officialProductName}
                    </div>
                  </div>

                  {/* Model Code */}
                  <div className="p-4 flex items-start justify-between gap-4">
                    <span className="font-medium text-[#65758B] w-40 shrink-0">Model Code</span>
                    <div className="text-right font-mono font-bold text-[#4285F4]">
                      {model.modelCode} {model.subName ? `(${model.subName})` : ""}
                    </div>
                  </div>

                  {/* Frame Shape */}
                  <div className="p-4 flex items-start justify-between gap-4">
                    <span className="font-medium text-[#65758B] w-40 shrink-0">Frame Shape</span>
                    <div className="text-right flex items-center justify-end gap-1.5 flex-1">
                      <span className="font-semibold text-[#172B4D]">{model.frameShape}</span>
                      {model.frameShapeVerified ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Unverified</span>
                      )}
                    </div>
                  </div>

                  {/* Frame Material */}
                  <div className="p-4 flex items-start justify-between gap-4">
                    <span className="font-medium text-[#65758B] w-40 shrink-0">Frame Material</span>
                    <div className="text-right flex items-center justify-end gap-1.5 flex-1">
                      <span className="font-semibold text-[#172B4D]">
                        {model.frameMaterialVerified && model.frameMaterial
                          ? model.frameMaterial
                          : "Unknown / Not Verified in Manufacturer Sheet"}
                      </span>
                      {model.frameMaterialVerified ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Unverified</span>
                      )}
                    </div>
                  </div>

                  {/* Frame Finish */}
                  <div className="p-4 flex items-start justify-between gap-4">
                    <span className="font-medium text-[#65758B] w-40 shrink-0">Frame Finish & Color</span>
                    <div className="text-right flex items-center justify-end gap-1.5 flex-1">
                      <span className="font-semibold text-[#172B4D]">
                        {model.frameFinishVerified && model.frameFinish
                          ? model.frameFinish
                          : "Not Verified"}
                      </span>
                      {model.frameFinishVerified ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Unverified</span>
                      )}
                    </div>
                  </div>

                  {/* Lens Color & Material */}
                  <div className="p-4 flex items-start justify-between gap-4">
                    <span className="font-medium text-[#65758B] w-40 shrink-0">Lens Tint & Substrate</span>
                    <div className="text-right flex flex-col items-end gap-1 flex-1">
                      <div className="flex items-center gap-1.5 font-semibold text-[#172B4D]">
                        <span>Tint: {model.lensColorVerified ? model.lensColor : "Unverified"}</span>
                        {model.lensColorVerified ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Unverified</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#65758B]">
                        <span>Substrate: {model.lensMaterialVerified ? model.lensMaterial : "Unknown / Not Verified"}</span>
                        {model.lensMaterialVerified ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Unverified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* UV Protection */}
                  <div className="p-4 flex items-start justify-between gap-4">
                    <span className="font-medium text-[#65758B] w-40 shrink-0">UV Protection</span>
                    <div className="text-right flex items-center justify-end gap-1.5 flex-1">
                      <span className="font-semibold text-[#172B4D]">
                        {model.uvProtectionVerified && model.uvProtection
                          ? model.uvProtection
                          : "Unknown / Not Verified"}
                      </span>
                      {model.uvProtectionVerified ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Unverified</span>
                      )}
                    </div>
                  </div>

                  {/* Polarization */}
                  <div className="p-4 flex items-start justify-between gap-4">
                    <span className="font-medium text-[#65758B] w-40 shrink-0">Polarization Status</span>
                    <div className="text-right flex items-center justify-end gap-1.5 flex-1">
                      <span className="font-semibold text-[#172B4D]">
                        {model.polarizationVerified && model.isPolarized !== null
                          ? model.isPolarized
                            ? "Verified Polarized"
                            : "Verified Non-Polarized"
                          : "Unknown / Not Verified in Source"}
                      </span>
                      {model.polarizationVerified ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Unverified</span>
                      )}
                    </div>
                  </div>

                  {/* Lens Technology */}
                  <div className="p-4 flex items-start justify-between gap-4">
                    <span className="font-medium text-[#65758B] w-40 shrink-0">Lens Technologies</span>
                    <div className="text-right flex items-center justify-end gap-1.5 flex-1">
                      <span className="font-semibold text-[#172B4D]">
                        {model.lensTechnologyVerified && model.lensTechnology
                          ? model.lensTechnology
                          : "Not Verified"}
                      </span>
                      {model.lensTechnologyVerified ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Unverified</span>
                      )}
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="p-4 flex items-start justify-between gap-4">
                    <span className="font-medium text-[#65758B] w-40 shrink-0">Dimensions (3-Box)</span>
                    <div className="text-right flex items-center justify-end gap-1.5 flex-1">
                      <span className="font-mono font-semibold text-[#172B4D]">
                        {model.dimensionsVerified && model.lensWidthMm
                          ? `A: ${model.lensWidthMm}mm | DBL: ${model.bridgeWidthMm}mm | Temple: ${model.templeLengthMm}mm${
                              model.lensHeightMm ? ` | B: ${model.lensHeightMm}mm` : ""
                            }`
                          : "Incomplete Dimensions"}
                      </span>
                      {model.dimensionsVerified ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Incomplete</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Verified Variants */}
            {parsedVariants.length > 0 && (
              <Card className="rounded-2xl border-[#DCE8F5] bg-white p-5 space-y-3">
                <h3 className="font-heading font-bold text-sm text-[#172B4D] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#4285F4]" />
                  <span>Available Certified Model Variants ({parsedVariants.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {parsedVariants.map((v, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-[#172B4D] block">{v.colorCode || "Standard"}</span>
                        <span className="text-[11px] text-[#65758B]">{v.size || "Standard Fit"}</span>
                      </div>
                      {v.sku && (
                        <span className="font-mono text-[10px] text-[#4285F4] bg-white px-2 py-0.5 rounded border border-[#DCE8F5]">
                          {v.sku}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Educational Optical Dispensing Guidance */}
            {model.opticalLearningNotes && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#1E40AF]">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <span>Optical Dispensing & Patient Fitting Guidance</span>
                </div>
                <p className="text-[#1E3A8A] leading-relaxed">
                  {model.opticalLearningNotes}
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar: Verification Provenance & Review Status (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Source Reference & Verification Audit Box */}
            <Card className="rounded-2xl border-[#DCE8F5] bg-white p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-[#172B4D] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verification & Source Reference</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#8796AA] block font-medium">Catalogue Reference URL</span>
                  <a
                    href={model.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#4285F4] hover:underline flex items-center gap-1 mt-0.5 break-all"
                  >
                    <span>{model.sourceUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <div>
                  <span className="text-[#8796AA] block font-medium">Source Authority</span>
                  <span className="font-semibold text-[#172B4D] block mt-0.5">
                    {model.sourceName}
                  </span>
                </div>

                <div>
                  <span className="text-[#8796AA] block font-medium">Last Verified Timestamp</span>
                  <div className="flex items-center gap-1.5 text-[#172B4D] mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8796AA]" />
                    <span>
                      {model.lastVerifiedAt
                        ? new Date(model.lastVerifiedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Pending Verification"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[#8796AA] block font-medium">Certifying Optician / Verifier</span>
                  <div className="flex items-center gap-1.5 text-[#172B4D] mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#8796AA]" />
                    <span>{model.verifiedBy || "Automated Optical Ingestion"}</span>
                  </div>
                </div>

                {model.verificationNotes && (
                  <div className="pt-2 border-t border-[#E2E8F0]">
                    <span className="text-[#8796AA] block font-medium">Verification Protocol Notes</span>
                    <p className="text-[11px] text-[#4A5568] mt-0.5 italic leading-relaxed">
                      {model.verificationNotes}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Owner Approval Status Box */}
            <Card className="rounded-2xl border-[#DCE8F5] bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[#172B4D] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#4285F4]" />
                  <span>Owner Sign-off Status</span>
                </h3>
                <ApprovalBadge status={model.approvalStatus} size="sm" />
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center justify-between text-[#65758B]">
                    <span>Decision:</span>
                    <span className="font-bold text-[#172B4D]">{model.approvalStatus}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#65758B]">
                    <span>Reviewer:</span>
                    <span className="font-semibold text-[#172B4D]">{model.approvedBy || "Unsigned"}</span>
                  </div>
                  {model.approvedAt && (
                    <div className="flex items-center justify-between text-[#65758B]">
                      <span>Date:</span>
                      <span>{new Date(model.approvedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {model.reviewNotes && (
                  <div>
                    <span className="text-[#8796AA] block font-medium">Owner Review Comments</span>
                    <p className="text-[11px] text-[#172B4D] mt-1 p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/60 leading-relaxed">
                      &quot;{model.reviewNotes}&quot;
                    </p>
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={() => setIsReviewOpen(true)}
                  className="w-full bg-[#172B4D] hover:bg-[#2A56C6] text-white text-xs font-semibold"
                >
                  Change Approval / Add Review Note
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Owner Review Dialog Modal */}
        <OwnerReviewDialog
          model={model}
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onSuccess={(updated) => setModel(updated)}
          currentUserRole={currentUserRole}
        />
      </div>
    </AppShell>
  );
}
