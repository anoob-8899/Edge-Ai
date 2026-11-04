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
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
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
  const [isDemoData, setIsDemoData] = React.useState(false);

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
      if (data.isDemoData !== undefined) {
        setIsDemoData(Boolean(data.isDemoData));
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

  const categories = [
    { id: "all", label: "All Eyewear" },
    { id: "sunglasses", label: "Sunglasses" },
    { id: "optical", label: "Optical Frames" },
    { id: "polarized", label: "Polarized Lenses" },
    { id: "titanium", label: "Titanium Tech" },
    { id: "acetate", label: "Handcrafted Acetate" },
  ];

  // Distinct values for sidebar filters
  const shapes = ["Aviator", "Square", "Round", "Wayfarer", "Rectangle", "Pilot", "Geometric"];
  const materials = ["Acetate", "Metal", "Titanium", "Propionate", "O Matter"];

  return (
    <AppShell
      title="Optical Product Knowledge Catalogue"
      subtitle="Branded eyewear specifications, verified geometries & lens dispensing technology"
    >
      <div className="space-y-6">
        {/* Top Category Pill Navigation (Reference 5 Hollis Style: Floating Tabs) */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-[#E6E4DD]/60">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <FilterPill
                key={cat.id}
                label={cat.label}
                active={activeCategory === cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  if (cat.id === "polarized") setSelectedPolarized("true");
                  else if (cat.id === "titanium") setSelectedMaterial("Titanium");
                  else if (cat.id === "acetate") setSelectedMaterial("Acetate");
                  else {
                    setSelectedPolarized("");
                    setSelectedMaterial("");
                  }
                }}
              />
            ))}
          </div>

          {/* Mode Switch: Models vs Brands */}
          <div className="flex items-center bg-white border border-[#E6E4DD] rounded-full p-1 shadow-xs">
            <button
              onClick={() => setActiveTab("models")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === "models" ? "bg-[#292929] text-white" : "text-[#737373] hover:text-[#222222]"
              }`}
            >
              Models ({models.length})
            </button>
            <button
              onClick={() => setActiveTab("brands")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === "brands" ? "bg-[#292929] text-white" : "text-[#737373] hover:text-[#222222]"
              }`}
            >
              Brands ({brands.length})
            </button>
          </div>
        </div>

        {/* HERO SECTION (Reference 5 Composition: Breadcrumbs + Large Editorial Title + Featured Product Showcase Banner) */}
        <div className="bg-white rounded-[32px] border border-[#E6E4DD] p-6 md:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-3 max-w-xl relative z-10">
            <div className="text-xs font-medium text-[#737373] flex items-center gap-1.5">
              <span>Catalogue</span>
              <ChevronRight className="h-3 w-3 text-[#737373]" />
              <span className="text-[#222222] font-semibold">Branded Optical & Sunglasses</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#222222]">
              Eyewear Library
            </h1>

            <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
              Explore authentic luxury frame archetypes, certified hinge engineering, lens polarization coatings,
              and clinical dispensing guidelines across premier global eyewear brands.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF5D5] text-[#255217]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Technical Specs
              </span>
              <span className="text-xs text-[#737373]">
                Strict Zero-Price Educational Standards
              </span>
            </div>
          </div>

          {/* Right Featured Showcase Card (Faithful to Reference 5 Hollis Hero Card) */}
          <div className="relative z-10 lg:w-[420px] bg-[#F0EFE9]/70 border border-[#E6E4DD] rounded-[24px] p-5 shadow-xs flex items-center gap-4 group">
            <div className="w-24 h-24 rounded-2xl bg-white border border-[#E6E4DD] flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-2xs">
              <Glasses className="w-12 h-12 text-[#222222] group-hover:scale-110 transition-transform" />
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FFD95E] text-[#222222]">
                Featured Archetype
              </span>
              <h3 className="font-bold text-sm text-[#222222] truncate">
                Ray-Ban Aviator Classic
              </h3>
              <p className="text-xs text-[#737373] truncate">
                Polarized G-15 • Monel Metal
              </p>
              <div className="pt-1">
                <Link
                  href="/catalogue/ray-ban/rb3025-aviator"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#222222] hover:underline"
                >
                  <span>Inspect Spec Dossier</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* BRANDS TAB VIEW */}
        {activeTab === "brands" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {brands.map((b) => (
                <div
                  key={b.slug}
                  className="border border-[#E6E4DD] bg-white hover:border-[#FFD95E] hover:shadow-sm transition-all rounded-[24px] p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F0EFE9] text-[#222222]">
                        {b.parentCompany || "EssilorLuxottica"}
                      </span>
                      <span className="text-xs font-mono text-[#737373]">
                        {b.modelCount || 0} Models
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-[#222222]">{b.name}</h3>
                      <p className="text-xs text-[#737373] mt-1 line-clamp-2 leading-relaxed">
                        {b.heritage || "Premier optical heritage and precision frame styling."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#E6E4DD]/60 flex items-center justify-between text-xs">
                    <span className="text-[#737373] font-medium">{b.countryOfOrigin || "Italy"}</span>
                    <Link
                      href={`/catalogue/brands/${b.slug}`}
                      className="font-bold text-[#222222] hover:text-[#737373] flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODELS TAB VIEW: 2-COLUMN CATALOGUE WORKSPACE (Reference 5 Layout) */}
        {activeTab === "models" && (
          <div className="space-y-4">
            {isDemoData && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FFF8E1] border border-[#FFE082] text-xs text-[#7A5300]">
                <span className="w-2 h-2 rounded-full bg-[#EAB308] shrink-0" />
                <span className="font-semibold">Demonstration Optical Catalogue:</span>
                <span>Showing 22 certified reference frames with optical dimensions and lens notes. Zero retail pricing displayed.</span>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ========================================================================= */}
            {/* LEFT FILTER SIDEBAR (Reference 5) */}
            {/* ========================================================================= */}
            <aside className="lg:col-span-3 bg-white border border-[#E6E4DD] rounded-[28px] p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E6E4DD]/60 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#222222]" />
                  <h3 className="font-bold text-sm text-[#222222]">Filters</h3>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-[#991B1B] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#737373] uppercase tracking-wider block">
                  Search Eyewear
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373]" />
                  <input
                    type="text"
                    placeholder="Search model, code, specs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 text-xs rounded-full bg-[#F0EFE9] text-[#222222] placeholder-[#737373] border-none focus:outline-none focus:ring-1 focus:ring-[#292929]"
                  />
                </div>
              </div>

              {/* Brand Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#737373] uppercase tracking-wider block">
                  Brand Archetype
                </label>
                <div className="relative">
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-8 py-2 bg-[#F0EFE9] text-xs font-medium text-[#222222] rounded-full border border-transparent focus:outline-none focus:border-[#292929] cursor-pointer"
                  >
                    <option value="">All Brands</option>
                    {brands.map((b) => (
                      <option key={b.slug} value={b.slug}>{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373] pointer-events-none" />
                </div>
              </div>

              {/* Frame Shape Filters (Reference 5 Rounded Filter Tags with Counts) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#737373] uppercase tracking-wider block">
                  Frame Shape
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {shapes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedShape(selectedShape === s ? "" : s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedShape === s
                          ? "bg-[#292929] text-white"
                          : "bg-[#F0EFE9] text-[#222222] hover:bg-[#E6E4DD]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Material Filters */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#737373] uppercase tracking-wider block">
                  Frame Material
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {materials.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMaterial(selectedMaterial === m ? "" : m)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedMaterial === m
                          ? "bg-[#292929] text-white"
                          : "bg-[#F0EFE9] text-[#222222] hover:bg-[#E6E4DD]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Polarization Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#737373] uppercase tracking-wider block">
                  Lens Polarization
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPolarized(selectedPolarized === "true" ? "" : "true")}
                    className={`flex-1 py-1.5 rounded-full text-xs font-semibold text-center transition-all ${
                      selectedPolarized === "true"
                        ? "bg-[#292929] text-white"
                        : "bg-[#F0EFE9] text-[#222222] hover:bg-[#E6E4DD]"
                    }`}
                  >
                    Polarized Only
                  </button>
                  <button
                    onClick={() => setSelectedPolarized("")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold text-center transition-all ${
                      !selectedPolarized
                        ? "bg-[#292929] text-white"
                        : "bg-[#F0EFE9] text-[#222222]"
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>
            </aside>

            {/* ========================================================================= */}
            {/* RIGHT PRODUCT GRID (Reference 5 4-Column Grid) */}
            {/* ========================================================================= */}
            <section className="lg:col-span-9 space-y-4">
              {/* Grid Top Meta Row (Reference 5: "24 products" + Sort by Featured v) */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#737373] uppercase tracking-wider">
                  {models.length} {models.length === 1 ? "Product" : "Products"} Catalogued
                </span>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E6E4DD] text-xs font-semibold text-[#222222] shadow-xs">
                  <span>Sort by: Featured</span>
                  <ChevronDown className="h-3 w-3 text-[#737373]" />
                </div>
              </div>

              {/* 4-Column Product Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-[24px] border border-[#E6E4DD] p-4 h-72 animate-pulse space-y-3"
                    >
                      <div className="h-44 bg-[#F0EFE9] rounded-2xl w-full" />
                      <div className="h-4 bg-[#F0EFE9] rounded w-3/4" />
                      <div className="h-3 bg-[#F0EFE9] rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : models.length === 0 ? (
                <div className="bg-white rounded-[32px] border border-[#E6E4DD] p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#F0EFE9] flex items-center justify-center text-[#737373] mx-auto">
                    <Glasses className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-base text-[#222222]">No Optical Models Found</h3>
                  <p className="text-xs text-[#737373] max-w-sm mx-auto">
                    No eyewear models match your active filter selection. Try clearing filters to view all records.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 rounded-full bg-[#292929] text-white text-xs font-semibold"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {models.map((m) => (
                    <ModelCard key={m.id} model={m} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  </AppShell>
);
}
