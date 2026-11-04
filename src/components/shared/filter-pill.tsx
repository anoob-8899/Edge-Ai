import * as React from "react";
import { cn } from "@/lib/utils";

interface FilterPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  label: React.ReactNode;
  count?: number | string;
  icon?: React.ReactNode;
}

export function FilterPill({
  active = false,
  label,
  count,
  icon,
  className,
  ...props
}: FilterPillProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 select-none",
        active
          ? "bg-[#242629] text-white shadow-xs border border-[#242629]"
          : "bg-white text-[#20242B] border border-[#E3E9EF] hover:bg-[#EEF3F7] hover:border-[#9CCBFF]",
        className
      )}
      {...props}
    >
      {icon && <span className={cn(active ? "text-white" : "text-[#737D8B]")}>{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono",
            active ? "bg-white/20 text-white" : "bg-[#EEF3F7] text-[#737D8B]"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
