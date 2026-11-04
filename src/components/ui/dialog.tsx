"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "dialog-title" : undefined}
      aria-describedby={description ? "dialog-desc" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#172B4D]/30 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        className={cn(
          "relative w-full max-w-lg rounded-[20px] bg-white/95 backdrop-blur-xl border border-[#DCE8F5] p-6 shadow-xl",
          "transform transition-all animate-in zoom-in-95 duration-200",
          className
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[#65758B] hover:text-[#172B4D] hover:bg-[#F0F7FF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
        >
          <X className="h-4 w-4" />
        </button>

        {(title || description) && (
          <div className="mb-4 pr-6">
            {title && (
              <h2
                id="dialog-title"
                className="text-lg font-semibold text-[#172B4D] tracking-tight"
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                id="dialog-desc"
                className="mt-1 text-sm text-[#65758B] leading-relaxed"
              >
                {description}
              </p>
            )}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
}

export function DialogFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-4 border-t border-[#DCE8F5]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
