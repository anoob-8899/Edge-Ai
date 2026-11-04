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
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9CCBFF] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none";

    const variantStyles = {
      primary:
        "bg-[#20242B] text-white hover:bg-[#33383F] active:bg-[#15171B] shadow-xs",
      secondary:
        "bg-[#EEF3F7] text-[#20242B] hover:bg-[#E2EAF1] active:bg-[#D5E1EC] border border-[#E3E9EF]",
      outline:
        "bg-white hover:bg-[#EEF3F7] text-[#20242B] border border-[#E3E9EF] shadow-xs",
      ghost:
        "text-[#20242B] hover:bg-[#EEF3F7] active:bg-[#E2EAF1]",
      danger:
        "bg-[#FCE4E4] text-[#962222] border border-[#F5C2C2] hover:bg-[#F9D0D0]",
      yellow:
        "bg-[#FFD95E] text-[#20242B] font-semibold hover:bg-[#F2CD52] active:bg-[#E8C244] shadow-sm",
      dark:
        "bg-[#242629] text-white hover:bg-[#1a1c1e] active:bg-[#121315] shadow-sm",
      glass:
        "bg-white/80 backdrop-blur-md text-[#20242B] border border-[#E3E9EF] hover:bg-white shadow-xs",
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
