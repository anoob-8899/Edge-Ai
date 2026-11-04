"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Building2,
  Globe2,
  ExternalLink,
  ShieldCheck,
  Glasses,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ModelCard } from "@/components/catalogue/model-card";
import { EmptyState } from "@/components/ui/empty-state";
import { BrandItem, SunglassModelItem } from "@/lib/types";


export default function BrandDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [brand, setBrand] = React.useState<(BrandItem & { models: SunglassModelItem[] }) | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filterShape, setFilterShape] = React.useState("");

  const fetchBrand = React.useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/catalogue/brands/${slug}`);
      const data = await res.json();
      if (data.brand) {
        setBrand(data.brand);
      }
    } catch (e) {
      console.error("Error loading brand detail:", e);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  React.useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-8 space-y-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-28" />
          <div className="h-48 bg-slate-100 rounded-3xl" />
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="h-64 bg-slate-100 rounded-2xl" />
            <div className="h-64 bg-slate-100 rounded-2xl" />
            <div className="h-64 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!brand) {
    return (
      <AppShell>
        <div className="py-12">
          <EmptyState
            icon={<Building2 className="w-6 h-6" />}
            title="Brand Not Found"
            description="The requested brand dossier does not exist in the learning catalogue."
            action={
              <Link href="/catalogue">
                <Button size="sm">Back to Branded Sunglasses</Button>
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  const filteredModels = (brand.models || []).filter((m) => {
    if (!filterShape) return true;
    return m.frameShape.toLowerCase().includes(filterShape.toLowerCase());
  });

  return (
    <AppShell>
      <div className="space-y-6 pb-16">
        {/* Back Link */}
        <div>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#65758B] hover:text-[#4285F4] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Branded Sunglasses Catalogue</span>
          </Link>
        </div>

        {/* Brand Dossier Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#172B4D] via-[#1E3A8A] to-[#2563EB] text-white p-6 md:p-8 shadow-md">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full border border-white/20">
                Brand Dossier #{brand.orderIndex}
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                Verified Manufacturer Dossier
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-white">
                  {brand.name}
                </h1>
                <div className="flex items-center gap-3 text-xs md:text-sm text-blue-100 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Globe2 className="w-4 h-4 text-[#93C5FD]" />
                    <span>Origin: {brand.countryOfOrigin || "International"}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#93C5FD]" />
                    <span>Parent: {brand.parentCompany || "Independent"}</span>
                  </div>
                </div>
              </div>

              {brand.websiteUrl && (
                <a
                  href={brand.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#172B4D] hover:bg-blue-50 transition-colors shadow-xs"
                >
                  <span>Official Brand Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Brand Heritage Box */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 mt-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
                Optical Heritage & Design Archetype
              </h3>
              <p className="text-xs md:text-sm text-blue-50 leading-relaxed">
                {brand.heritage}
              </p>
            </div>
          </div>
        </div>

        {/* Brand Models Portfolio */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#172B4D]">
                Catalogued Models for {brand.name} ({filteredModels.length})
              </h2>
              <p className="text-xs text-[#65758B]">
                Real models verified from Edge Opticals reference inventory and official manufacturer archives.
              </p>
            </div>

            {/* Shape Filter for this Brand */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[#8796AA]">Shape:</label>
              <select
                value={filterShape}
                onChange={(e) => setFilterShape(e.target.value)}
                className="text-xs h-8 px-2 rounded-lg border border-[#DCE8F5] bg-white text-[#172B4D]"
              >
                <option value="">All Shapes</option>
                <option value="Aviator">Aviator / Pilot</option>
                <option value="Browline">Browline</option>
                <option value="Cat Eye">Cat Eye</option>
                <option value="Shield">Shield</option>
                <option value="Rectangle">Rectangular</option>
                <option value="Round">Round</option>
                <option value="Square">Square</option>
              </select>
            </div>
          </div>

          {filteredModels.length === 0 ? (
            <EmptyState
              icon={<Glasses className="w-6 h-6" />}
              title="No models found for this shape"
              description="Try resetting the frame shape filter."
              action={
                <Button size="sm" variant="outline" onClick={() => setFilterShape("")}>
                  Reset Shape Filter
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredModels.map((model) => (
                <ModelCard key={model.slug} model={{ ...model, brand }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
