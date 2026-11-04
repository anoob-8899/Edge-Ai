import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "yellow"
    | "dark"
    | "outline"
    | "neutral";
  size?: "sm" | "md";
  isMono?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  isMono = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default:
      "bg-[#EEF3F7] text-[#20242B] border border-[#E3E9EF]",
    primary:
      "bg-[#DCEEFF] text-[#13457A] border border-[#9CCBFF]",
    secondary:
      "bg-[#EEF3F7] text-[#737D8B] border border-[#E3E9EF]",
    success:
      "bg-[#DDF4CF] text-[#225414] border border-[#C6E7B0]",
    warning:
      "bg-[#FFF0C2] text-[#7A5300] border border-[#FBE19A]",
    error:
      "bg-[#FCE4E4] text-[#962222] border border-[#F7C5C5]",
    yellow:
      "bg-[#FFD95E] text-[#20242B] font-semibold border border-[#EAC248]",
    dark:
      "bg-[#242629] text-white border border-[#33383F]",
    outline:
      "bg-transparent text-[#737D8B] border border-[#E3E9EF]",
    neutral:
      "bg-white text-[#20242B] border border-[#E3E9EF] shadow-xs",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px] leading-tight",
    md: "px-2.5 py-1 text-xs font-medium leading-none",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors select-none",
        variants[variant],
        sizes[size],
        isMono && "font-mono font-normal tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
