import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "yellow"
    | "dark"
    | "glass";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  pill?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      pill = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD95E] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none";

    const variantStyles = {
      primary:
        "bg-[#292929] text-white hover:bg-[#3d3d3d] active:bg-[#1a1a1a] shadow-xs",
      secondary:
        "bg-[#F0EFE9] text-[#222222] hover:bg-[#E6E4DD] active:bg-[#DCD9D0] border border-[#E6E4DD]",
      outline:
        "bg-white hover:bg-[#F0EFE9] text-[#222222] border border-[#E6E4DD] shadow-xs",
      ghost:
        "text-[#222222] hover:bg-[#F0EFE9] active:bg-[#E6E4DD]",
      danger:
        "bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] hover:bg-[#FCA5A5]/30",
      yellow:
        "bg-[#FFD95E] text-[#222222] font-semibold hover:bg-[#F2CD52] active:bg-[#E5BE45] shadow-xs",
      dark:
        "bg-[#292929] text-white hover:bg-[#3d3d3d] active:bg-[#1a1a1a] shadow-xs",
      glass:
        "bg-white/80 backdrop-blur-md text-[#222222] border border-[#E6E4DD] hover:bg-white shadow-xs",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
      icon: "h-10 w-10 p-0 text-sm",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          pill ? "rounded-full" : "rounded-full md:rounded-[14px]",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
