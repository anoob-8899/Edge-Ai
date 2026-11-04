import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  badgeText?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  badgeText = "Awaiting Activity",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-[14px]",
        "border border-dashed border-[#DCE8F5] bg-white/40 backdrop-blur-xs",
        className
      )}
      {...props}
    >
      <div className="relative mb-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E8F3FF] text-[#4285F4] border border-[#B8D9FF]/70 shadow-xs">
          {icon}
        </div>
        <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#B8D9FF]" />
        </span>
      </div>

      <div className="inline-block px-2.5 py-0.5 mb-2 rounded-full bg-[#F0F7FF] border border-[#DCE8F5] text-[11px] font-mono font-medium text-[#65758B]">
        {badgeText}
      </div>

      <h4 className="text-base font-semibold text-[#172B4D] mb-1.5">{title}</h4>
      <p className="max-w-md text-xs md:text-sm text-[#65758B] leading-relaxed mb-6">
        {description}
      </p>

      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
