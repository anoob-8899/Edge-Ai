import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, hint, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            "w-full rounded-[11px] bg-white/90 p-3 text-sm text-[#172B4D] placeholder-[#8796AA]",
            "border border-[#DCE8F5] transition-all duration-200 resize-none",
            "hover:border-[#B8D9FF] hover:bg-white",
            "focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 focus:bg-white",
            "disabled:bg-[#F0F7FF] disabled:text-[#8796AA] disabled:cursor-not-allowed",
            error && "border-[#C83F4F] focus:border-[#C83F4F] focus:ring-[#C83F4F]/20",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-[#C83F4F] font-medium">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-[#65758B]">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
