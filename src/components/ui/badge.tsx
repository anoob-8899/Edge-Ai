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
      "bg-[#F0EFE9] text-[#222222] border border-[#E6E4DD]",
    primary:
      "bg-[#292929] text-white border border-[#292929]",
    secondary:
      "bg-[#F0EFE9] text-[#737373] border border-[#E6E4DD]",
    success:
      "bg-[#EAF5D5] text-[#255217] border border-[#D5E8B5]",
    warning:
      "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]",
    error:
      "bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]",
    yellow:
      "bg-[#FFD95E] text-[#222222] font-semibold border border-[#F2CD52]",
    dark:
      "bg-[#292929] text-white border border-[#3D3D3D]",
    outline:
      "bg-transparent text-[#737373] border border-[#E6E4DD]",
    neutral:
      "bg-white text-[#222222] border border-[#E6E4DD] shadow-xs",
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
