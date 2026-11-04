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
        "bg-white border border-[#E6E4DD] shadow-[0_4px_24px_-4px_rgba(34,34,34,0.04)]",
      glass:
        "bg-white/95 backdrop-blur-md border border-[#E6E4DD] shadow-[0_4px_24px_-4px_rgba(34,34,34,0.04)]",
      subtle:
        "bg-[#F0EFE9] border border-[#E6E4DD] shadow-none",
      dark:
        "bg-[#292929] text-white border border-[#3D3D3D] shadow-[0_8px_32px_rgba(0,0,0,0.16)]",
      outline:
        "bg-transparent border border-[#E6E4DD] shadow-none",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[24px] transition-all duration-200",
          variants[variant],
          hoverable &&
            "hover:border-[#FFD95E] hover:shadow-[0_10px_30px_-4px_rgba(34,34,34,0.07)] hover:-translate-y-0.5",
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
      "text-base md:text-lg font-semibold text-[#222222] tracking-tight leading-tight",
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
    className={cn("text-xs md:text-sm text-[#737373] leading-relaxed", className)}
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
