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
          ? "bg-[#292929] text-white shadow-xs border border-[#292929]"
          : "bg-white text-[#222222] border border-[#E6E4DD] hover:bg-[#F0EFE9] hover:border-[#DCD9D0]",
        className
      )}
      {...props}
    >
      {icon && <span className={cn(active ? "text-white" : "text-[#737373]")}>{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono",
            active ? "bg-white/20 text-white" : "bg-[#F0EFE9] text-[#737373]"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
