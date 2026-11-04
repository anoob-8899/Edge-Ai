"use client";

import * as React from "react";
import Link from "next/link";
import {
  ExternalLink,
  ChevronRight,
  Glasses,
  BookOpen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificationBadge, ApprovalBadge } from "./verified-indicator";
import { SunglassModelItem } from "@/lib/types";

interface ModelCardProps {
  model: SunglassModelItem;
}

export function ModelCard({ model }: ModelCardProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden border border-[#E3E9EF] bg-white transition-all duration-200 hover:shadow-md hover:border-[#9CCBFF] rounded-[20px]">
      <div>
        {/* Top Badges Row */}
        <div className="p-4 pb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#20242B] px-2.5 py-0.5 rounded-full bg-[#EEF3F7] border border-[#E3E9EF]">
              {model.brand.name}
            </span>
            <span className="text-[11px] font-mono font-semibold text-[#737D8B] px-2 py-0.5 rounded-full bg-white border border-[#E3E9EF]">
              {model.modelCode}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <VerificationBadge status={model.verificationStatus} size="sm" />
          </div>
        </div>

        {/* Product Image Stage (Reference 5 Neutral Soft Container) */}
        <div className="relative mx-4 mt-2 mb-3 h-44 rounded-[16px] bg-[#EEF3F7] border border-[#E3E9EF]/60 flex items-center justify-center p-4 overflow-hidden group-hover:scale-[1.01] transition-transform">
          {model.imageUrl && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={model.imageUrl}
              alt={`${model.brand.name} ${model.officialProductName}`}
              className="max-h-full max-w-full object-contain drop-shadow-sm"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[#737D8B] gap-1.5">
              <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-[#20242B]">
                <Glasses className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-[#737D8B]">Optical Silhouette</span>
            </div>
          )}

          {/* Polarization Tag if verified */}
          {model.polarizationVerified && model.isPolarized && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#242629] text-white shadow-xs">
                POLARIZED
              </span>
            </div>
          )}

          {/* Category Tag */}
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[10px] font-semibold text-[#20242B] px-2 py-0.5 rounded-full bg-white/90 border border-[#E3E9EF]">
              {model.category}
            </span>
          </div>
        </div>

        {/* Product Details Header */}
        <div className="px-5 pb-3">
          <Link
            href={`/catalogue/${model.brand.slug}/${model.slug}`}
            className="block group-hover:text-[#20242B] transition-colors"
          >
            <h3 className="font-bold text-sm md:text-base text-[#20242B] line-clamp-1">
              {model.officialProductName}
            </h3>
            {model.subName && (
              <p className="text-xs text-[#737D8B] font-medium line-clamp-1 mt-0.5">
                {model.subName}
              </p>
            )}
          </Link>

          {/* Optical Specifications Grid */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-[#EEF3F7]/50 p-2.5 rounded-[12px] border border-[#E3E9EF]">
            <div>
              <span className="text-[#737D8B] block font-medium">Shape</span>
              <span className="font-semibold text-[#20242B] truncate block">
                {model.frameShape}
              </span>
            </div>
            <div>
              <span className="text-[#737D8B] block font-medium">Material</span>
              <span className="font-semibold text-[#20242B] truncate block">
                {model.frameMaterial}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0">
        <Link
          href={`/catalogue/${model.brand.slug}/${model.slug}`}
          className="block"
        >
          <Button
            variant="outline"
            size="sm"
            pill
            className="w-full text-xs font-semibold justify-between group-hover:bg-[#242629] group-hover:text-white group-hover:border-[#242629] transition-colors"
          >
            <span>Learn Dispensing Specs</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
