"use client";

import * as React from "react";
import Link from "next/link";
import {
  Glasses,
  Plus,
  ArrowRight,
  ShieldCheck,
  Award,
} from "lucide-react";
import { VerificationBadge } from "./verified-indicator";
import { SunglassModelItem } from "@/lib/types";

interface ModelCardProps {
  model: SunglassModelItem;
}

export function ModelCard({ model }: ModelCardProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden border border-[#E6E4DD] bg-white transition-all duration-200 hover:shadow-md hover:border-[#FFD95E] rounded-[24px] p-4">
      <div>
        {/* Product Image Stage (Reference 5: Clean Neutral Container with Centered Product) */}
        <div className="relative h-44 w-full rounded-2xl bg-[#F0EFE9]/60 border border-[#E6E4DD]/60 flex items-center justify-center p-4 overflow-hidden transition-transform group-hover:scale-[1.02]">
          {model.imageUrl && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={model.imageUrl}
              alt={`${model.brand.name} ${model.officialProductName}`}
              className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[#737373] gap-1.5">
              <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-[#222222]">
                <Glasses className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-[#737373]">Optical Silhouette</span>
            </div>
          )}

          {/* Verification Badge top right */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                model.verificationStatus === "VERIFIED"
                  ? "bg-[#EAF5D5] text-[#255217]"
                  : "bg-[#FEF3C7] text-[#92400E]"
              }`}
            >
              {model.verificationStatus === "VERIFIED" ? "● Verified" : "● In Review"}
            </span>
          </div>

          {/* Polarized Tag bottom left */}
          {model.isPolarized && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#292929] text-white shadow-xs">
                POLARIZED
              </span>
            </div>
          )}
        </div>

        {/* Product Meta */}
        <div className="pt-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#737373]">
            <span className="font-semibold text-[#222222]">{model.brand.name}</span>
            <span>•</span>
            <span>{model.modelCode}</span>
          </div>

          <Link
            href={`/catalogue/${model.brand.slug}/${model.slug}`}
            className="block text-[#222222] hover:text-[#737373] transition-colors"
          >
            <h3 className="font-bold text-sm line-clamp-1 leading-snug">
              {model.officialProductName}
            </h3>
          </Link>

          <p className="text-xs text-[#737373] line-clamp-1">
            {model.frameShape || "Classic"} • {model.frameMaterial || "Acetate"}
          </p>
        </div>
      </div>

      {/* Bottom Row: Spec badge & Circular Black Action Button (Reference 5) */}
      <div className="pt-4 mt-2 border-t border-[#E6E4DD]/60 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#222222] truncate max-w-[140px]">
          {model.lensTechnology || "UV400 Protected"}
        </span>

        <Link
          href={`/catalogue/${model.brand.slug}/${model.slug}`}
          title="Inspect Technical Specs"
          className="w-8 h-8 rounded-full bg-[#292929] hover:bg-[#3d3d3d] text-white flex items-center justify-center transition-transform hover:scale-105 shrink-0 shadow-xs"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
