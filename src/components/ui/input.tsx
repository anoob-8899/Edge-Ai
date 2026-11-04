import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  pill?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, hint, icon, pill = false, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#737D8B]">
              {icon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "w-full h-10 px-3.5 text-sm text-[#20242B] placeholder-[#737D8B] bg-white",
              pill ? "rounded-full" : "rounded-full md:rounded-[14px]",
              "border border-[#E3E9EF] transition-all duration-200",
              "hover:border-[#9CCBFF]",
              "focus:outline-none focus:border-[#9CCBFF] focus:ring-2 focus:ring-[#9CCBFF]/40",
              "disabled:bg-[#EEF3F7] disabled:text-[#737D8B] disabled:cursor-not-allowed",
              icon && "pl-10",
              error && "border-[#FCE4E4] focus:border-[#FCE4E4] focus:ring-[#FCE4E4]",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-[#962222] font-medium">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-[#737D8B]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
