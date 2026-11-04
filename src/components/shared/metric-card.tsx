import * as React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  icon?: React.ReactNode;
  highlight?: boolean; // If true, adds warm yellow accent or banner
  variant?: "default" | "dark" | "yellow";
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  trend,
  icon,
  highlight = false,
  variant = "default",
  className,
}: MetricCardProps) {
  const isDark = variant === "dark";
  const isYellow = variant === "yellow";

  return (
    <div
      className={cn(
        "rounded-[20px] p-5 transition-all duration-200 border",
        isDark
          ? "bg-[#242629] text-white border-[#33383F] shadow-sm"
          : isYellow
          ? "bg-[#FFD95E] text-[#20242B] border-[#F2CD52] shadow-sm"
          : "bg-white text-[#20242B] border-[#E3E9EF] shadow-xs",
        highlight && !isDark && !isYellow && "border-[#FFD95E] ring-1 ring-[#FFD95E]/50",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "text-xs font-medium tracking-tight",
            isDark ? "text-gray-400" : isYellow ? "text-[#20242B]/80 font-semibold" : "text-[#737D8B]"
          )}
        >
          {label}
        </span>
        {icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm",
              isDark
                ? "bg-white/10 text-white"
                : isYellow
                ? "bg-white/40 text-[#20242B]"
                : "bg-[#EEF3F7] text-[#20242B]"
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center",
              trend.positive
                ? "bg-[#DDF4CF] text-[#225414]"
                : "bg-[#FCE4E4] text-[#962222]"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <p
          className={cn(
            "text-xs mt-1.5 leading-normal",
            isDark ? "text-gray-400" : isYellow ? "text-[#20242B]/75" : "text-[#737D8B]"
          )}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}
