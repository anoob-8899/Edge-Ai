import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  barColor?: "yellow" | "blue" | "dark" | "green";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barColor = "yellow",
  showLabel = false,
  size = "md",
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const fillColors = {
    yellow: "bg-[#FFD95E]",
    blue: "bg-[#9CCBFF]",
    dark: "bg-[#242629]",
    green: "bg-[#8CE071]",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-[#737D8B] mb-1 font-medium">
          <span>Progress</span>
          <span className="font-semibold text-[#20242B]">{percentage}%</span>
        </div>
      )}
      <div className={cn("w-full bg-[#EEF3F7] rounded-full overflow-hidden border border-[#E3E9EF]/60", sizeClasses[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", fillColors[barColor])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
