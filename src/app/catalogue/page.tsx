"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sun,
  Search,
  ShieldCheck,
  Glasses,
  ChevronRight,
  RotateCcw,
  Building2,
  Globe2,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterPill } from "@/components/shared/filter-pill";
import { ModelCard } from "@/components/catalogue/model-card";
import { BrandItem, SunglassModelItem } from "@/lib/types";

export default function BrandedSunglassesCataloguePage() {
  const [activeTab, setActiveTab] = React.useState<"models" | "brands">("models");
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [brands, setBrands] = React.useState<BrandItem[]>([]);
  const [models, setModels] = React.useState<SunglassModelItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedBrand, setSelectedBrand] = React.useState("");
  const [selectedShape, setSelectedShape] = React.useState("");
  const [selectedMaterial, setSelectedMaterial] = React.useState("");
  const [selectedPolarized, setSelectedPolarized] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState("");

  // Fetch brands
  const fetchBrands = React.useCallback(async () => {
    try {
      const res = await fetch("/api/catalogue/brands");
      const data = await res.json();
      if (data.brands) {
        setBrands(data.brands);
      }
    } catch (e) {
      console.error("Error loading brands:", e);
    }
  }, []);

  // Fetch models with filters
  const fetchModels = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedBrand) params.set("brand", selectedBrand);
      if (selectedShape) params.set("shape", selectedShape);
      if (selectedMaterial) params.set("material", selectedMaterial);
      if (selectedPolarized) params.set("polarized", selectedPolarized);
      if (selectedStatus) params.set("status", selectedStatus);

      const res = await fetch(`/api/catalogue/models?${params.toString()}`);
      const data = await res.json();
      if (data.models) {
        setModels(data.models);
      }
    } catch (e) {
      console.error("Error loading models:", e);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedBrand,
    selectedShape,
    selectedMaterial,
    selectedPolarized,
    selectedStatus,
  ]);

  React.useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      fetchModels();
    }, 250);
    return () => clearTimeout(timeout);
  }, [fetchModels]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("");
    setSelectedShape("");
    setSelectedMaterial("");
    setSelectedPolarized("");
    setSelectedStatus("");
    setActiveCategory("all");
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedBrand ||
    selectedShape ||
    selectedMaterial ||
    selectedPolarized ||
    selectedStatus
  );

  // Summary statistics
  const totalVerifiedModels = models.filter((m) => m.verificationStatus === "VERIFIED").length;
  const totalIncompleteModels = models.filter((m) => m.verificationStatus === "PARTIALLY_VERIFIED").length;

  const categories = [
    { id: "all", label: "All Products" },
    { id: "sunglasses", label: "Sunglasses" },
    { id: "optical", label: "Optical Frames" },
    { id: "lenses", label: "Prescription Lenses" },
    { id: "coatings", label: "Lens Coatings" },
    { id: "materials", label: "Frame Materials" },
  ];

  return (
    <AppShell
      title="Product Knowledge Catalogue"
      subtitle="Branded eyewear specifications, optical geometries & lens dispensing technology"
    >
      <div className="space-y-6 pb-16">
        {/* Top Header Card (Unified Ice Glass + Pearl White) */}
        <div className="bg-white border border-[#E3E9EF] rounded-[20px] p-6 md:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFD95E] text-[#20242B]">
              <Sun className="w-3.5 h-3.5" />
              Optical Learning Catalogue
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DDF4CF] text-[#225414]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Manufacturer Verified
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-[#EEF3F7] text-[#737D8B] border border-[#E3E9EF]">
              Strict Zero-Price Curriculum Policy
            </span>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-bold text-2xl md:text-3xl text-[#20242B] tracking-tight">
              Optical Product Knowledge & Dispensing Dossier
            </h1>
            <p className="text-xs md:text-sm text-[#737D8B] mt-1.5 leading-relaxed">
              Investigate official brand archetypes, verified frame geometries, lens technologies,
              and clinical dispensing notes across luxury and performance eyewear brands.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-[16px] bg-[#EEF3F7]/60 border border-[#E3E9EF]">
              <div className="text-[11px] text-[#737D8B] font-medium uppercase tracking-wider">Starting Brands</div>
              <div className="text-xl font-bold text-[#20242B] mt-0.5">{brands.length || 12} Brands</div>
            </div>
            <div className="p-3.5 rounded-[16px] bg-[#EEF3F7]/60 border border-[#E3E9EF]">
              <div className="text-[11px] text-[#737D8B] font-medium uppercase tracking-wider">Catalogued Models</div>
              <div className="text-xl font-bold text-[#20242B] mt-0.5">{models.length} Records</div>
            </div>
            <div className="p-3.5 rounded-[16px] bg-[#DDF4CF]/40 border border-[#C6E7B0]">
              <div className="text-[11px] text-[#225414] font-medium uppercase tracking-wider">Verified Specs</div>
              <div className="text-xl font-bold text-[#225414] mt-0.5">{totalVerifiedModels} Certified</div>
            </div>
            <div className="p-3.5 rounded-[16px] bg-[#FFF0C2]/40 border border-[#FBE19A]">
              <div className="text-[11px] text-[#7A5300] font-medium uppercase tracking-wider">Incomplete Specs</div>
              <div className="text-xl font-bold text-[#7A5300] mt-0.5">{totalIncompleteModels} Missing Notes</div>
            </div>
          </div>
        </div>

        {/* Top Category Pill Filter Bar (Reference 5 Hollis Style) */}
        <div className="flex items-center justify-between border-b border-[#E3E9EF] pb-3 gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <FilterPill
                key={cat.id}
                label={cat.label}
                active={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
              />
            ))}
          </div>

          {/* View Mode Toggle: Models vs Brands */}
          <div className="flex items-center gap-1 p-1 bg-[#EEF3F7] rounded-full border border-[#E3E9EF]">
            <button
              onClick={() => setActiveTab("models")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === "models"
                  ? "bg-[#242629] text-white shadow-xs"
                  : "text-[#737D8B] hover:text-[#20242B]"
              }`}
            >
              <Glasses className="w-3.5 h-3.5" />
              <span>Models ({models.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("brands")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === "brands"
                  ? "bg-[#242629] text-white shadow-xs"
                  : "text-[#737D8B] hover:text-[#20242B]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Brands ({brands.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: BRANDS INDEX VIEW */}
        {activeTab === "brands" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-lg text-[#20242B]">
                The Premier Optical Brand Archetypes
              </h2>
              <p className="text-xs text-[#737D8B]">
                Manufacturer portfolios from EssilorLuxottica, Kering Eyewear, Safilo, De Rigo, and Marchon.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((b) => (
                <div
                  key={b.slug}
                  className="overflow-hidden border border-[#E3E9EF] bg-white hover:border-[#9CCBFF] hover:shadow-xs transition-all rounded-[20px] p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-[#20242B]">
                            {b.name}
                          </span>
                          <span className="font-mono text-[10px] text-[#20242B] bg-[#EEF3F7] px-2 py-0.5 rounded-full border border-[#E3E9EF]">
                            #{b.orderIndex}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#737D8B] mt-1">
                          <Globe2 className="w-3.5 h-3.5" />
                          <span>{b.countryOfOrigin || "International"}</span>
                          <span>•</span>
                          <span className="truncate">{b.parentCompany || "Independent"}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-[#20242B] block">
                          {b.modelCount || 0} Models
                        </span>
                        <span className="text-[10px] font-semibold text-[#225414] block">
                          {b.verifiedCount || 0} Certified
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#737D8B] leading-relaxed line-clamp-3">
                      {b.heritage}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#E3E9EF] flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedBrand(b.slug);
                        setActiveTab("models");
                      }}
                      className="text-xs font-semibold text-[#20242B] hover:text-black flex items-center gap-1"
                    >
                      <span>Filter Models</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <Link
                      href={`/catalogue/brands/${b.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#242629] text-white hover:bg-black transition-all"
                    >
                      <span>Brand Dossier</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT MODELS WITH REFERENCE 5 (HOLLIS) SIDEBAR FILTER LAYOUT */}
        {activeTab === "models" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ========================================================================= */}
            {/* LEFT FILTER SIDEBAR (Reference 5 Hollis Style - 3.5 Columns) */}
            {/* ========================================================================= */}
            <div className="lg:col-span-4 bg-white border border-[#E3E9EF] rounded-[20px] p-5 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E3E9EF]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#20242B]" />
                  <h3 className="font-bold text-sm text-[#20242B]">Filter Catalogue</h3>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-[#962222] font-semibold hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Format / Frame Shape Pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#737D8B] uppercase tracking-wider block">
                  Frame Geometry
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "", label: "All Shapes" },
                    { id: "Aviator", label: "Aviator / Pilot" },
                    { id: "Rectangle", label: "Square / Rectangular" },
                    { id: "Round", label: "Round / Pantos" },
                    { id: "Cat Eye", label: "Cat Eye" },
                    { id: "Browline", label: "Browline" },
                    { id: "Shield", label: "Shield / Wrap" },
                  ].map((s) => (
                    <FilterPill
                      key={s.id}
                      label={s.label}
                      active={selectedShape === s.id}
                      onClick={() => setSelectedShape(s.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Brand Pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#737D8B] uppercase tracking-wider block">
                  Brand Collection
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                  <FilterPill
                    label="All Brands"
                    active={selectedBrand === ""}
                    onClick={() => setSelectedBrand("")}
                  />
                  {brands.map((b) => (
                    <FilterPill
                      key={b.slug}
                      label={b.name}
                      active={selectedBrand === b.slug}
                      onClick={() => setSelectedBrand(b.slug)}
                    />
                  ))}
                </div>
              </div>

              {/* Frame Material Pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#737D8B] uppercase tracking-wider block">
                  Frame Material
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "", label: "All Materials" },
                    { id: "Metal", label: "Metal / Alloy" },
                    { id: "Acetate", label: "Acetate" },
                    { id: "Propionate", label: "Propionate" },
                    { id: "Matter", label: "O Matter™" },
                  ].map((m) => (
                    <FilterPill
                      key={m.id}
                      label={m.label}
                      active={selectedMaterial === m.id}
                      onClick={() => setSelectedMaterial(m.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Polarization Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#737D8B] uppercase tracking-wider block">
                  Optical Polarization
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <FilterPill
                    label="All Optics"
                    active={selectedPolarized === ""}
                    onClick={() => setSelectedPolarized("")}
                  />
                  <FilterPill
                    label="Polarized Only"
                    active={selectedPolarized === "true"}
                    onClick={() => setSelectedPolarized("true")}
                  />
                  <FilterPill
                    label="Non-Polarized"
                    active={selectedPolarized === "false"}
                    onClick={() => setSelectedPolarized("false")}
                  />
                </div>
              </div>

              {/* Specification Verification */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#737D8B] uppercase tracking-wider block">
                  Verification State
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <FilterPill
                    label="All Statuses"
                    active={selectedStatus === ""}
                    onClick={() => setSelectedStatus("")}
                  />
                  <FilterPill
                    label="Fully Certified"
                    active={selectedStatus === "VERIFIED"}
                    onClick={() => setSelectedStatus("VERIFIED")}
                  />
                  <FilterPill
                    label="Missing Notes"
                    active={selectedStatus === "PARTIALLY_VERIFIED"}
                    onClick={() => setSelectedStatus("PARTIALLY_VERIFIED")}
                  />
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* RIGHT MAIN CONTENT AREA: SEARCH & PRODUCT GRID (8.5 Columns) */}
            {/* ========================================================================= */}
            <div className="lg:col-span-8 space-y-4">
              {/* Search Bar matching Reference 5 */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737D8B]" />
                <input
                  type="text"
                  placeholder="Search model code (e.g. RB3025, GG1578S, OO9100), shape, material, lens tech..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 text-xs md:text-sm rounded-full bg-white text-[#20242B] placeholder-[#737D8B] border border-[#E3E9EF] focus:border-[#9CCBFF] focus:outline-none shadow-xs transition-colors"
                />
              </div>

              {/* Result Summary Bar */}
              <div className="flex items-center justify-between text-xs text-[#737D8B] px-1">
                <div>
                  Showing <strong className="text-[#20242B]">{models.length}</strong> optical models
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#225414]">
                    <span className="w-2 h-2 rounded-full bg-[#8CE071]" />
                    {totalVerifiedModels} Certified
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#7A5300]">
                    <span className="w-2 h-2 rounded-full bg-[#FFD95E]" />
                    {totalIncompleteModels} Incomplete
                  </span>
                </div>
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-80 rounded-[20px] bg-white border border-[#E3E9EF] animate-pulse p-5 space-y-4 shadow-xs"
                    >
                      <div className="h-4 bg-[#EEF3F7] rounded w-1/3" />
                      <div className="h-36 bg-[#EEF3F7] rounded-[16px]" />
                      <div className="h-4 bg-[#EEF3F7] rounded w-3/4" />
                      <div className="h-10 bg-[#EEF3F7] rounded-full" />
                    </div>
                  ))}
                </div>
              ) : models.length === 0 ? (
                <EmptyState
                  icon={<Search className="w-6 h-6" />}
                  title="No matching product models found"
                  description="Try adjusting your brand, shape, material, or verification filters."
                  action={
                    <Button variant="outline" size="sm" pill onClick={clearFilters}>
                      Clear Search & Filters
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {models.map((model) => (
                    <ModelCard key={model.slug} model={model} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
