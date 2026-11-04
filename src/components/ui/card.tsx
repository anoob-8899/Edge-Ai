import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "subtle" | "dark" | "outline";
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hoverable = false, ...props }, ref) => {
    const variants = {
      default:
        "bg-white border border-[#E3E9EF] shadow-[0_4px_20px_-2px_rgba(32,36,43,0.03)]",
      glass:
        "bg-white/90 backdrop-blur-md border border-[#E3E9EF] shadow-[0_4px_20px_-2px_rgba(32,36,43,0.04)]",
      subtle:
        "bg-[#EEF3F7] border border-[#E3E9EF]/90 shadow-none",
      dark:
        "bg-[#242629] text-white border border-[#33383F] shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
      outline:
        "bg-transparent border border-[#E3E9EF] shadow-none",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[20px] transition-all duration-200",
          variants[variant],
          hoverable &&
            "hover:border-[#9CCBFF] hover:shadow-[0_8px_26px_-4px_rgba(32,36,43,0.08)] hover:-translate-y-0.5",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5 md:p-6 pb-3", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base md:text-lg font-semibold text-[#20242B] tracking-tight leading-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs md:text-sm text-[#737D8B] leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 md:p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-5 md:p-6 pt-0 border-t border-[#E3E9EF] mt-4 pt-4",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
