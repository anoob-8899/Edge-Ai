import * as React from "react";
import { cn } from "@/lib/utils";

interface StaffAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "active" | "invited" | "absent" | "offline";
  imageUrl?: string | null;
  className?: string;
}

export function StaffAvatar({
  name,
  size = "md",
  status,
  imageUrl,
  className,
}: StaffAvatarProps) {
  const getInitials = (str: string) => {
    if (!str) return "OP";
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
    xl: "w-16 h-16 text-lg font-bold",
  };

  const statusColors = {
    active: "bg-[#8CE071]",
    invited: "bg-[#FFD95E]",
    absent: "bg-[#737D8B]",
    offline: "bg-gray-300",
  };

  // Deterministic soft color for avatar backgrounds
  const colors = [
    "bg-[#DCEEFF] text-[#13457A]",
    "bg-[#FFF0C2] text-[#7A5300]",
    "bg-[#DDF4CF] text-[#225414]",
    "bg-[#FCE4E4] text-[#962222]",
    "bg-[#E3E9EF] text-[#20242B]",
  ];
  const charCode = name ? name.charCodeAt(0) + (name.charCodeAt(1) || 0) : 0;
  const colorClass = colors[charCode % colors.length];

  return (
    <div className={cn("relative inline-flex flex-shrink-0 items-center justify-center rounded-full font-semibold select-none", sizeClasses[size], className)}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <div className={cn("w-full h-full rounded-full flex items-center justify-center font-medium shadow-xs", colorClass)}>
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white",
            size === "sm" ? "w-2 h-2" : size === "xl" ? "w-4 h-4" : "w-2.5 h-2.5",
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
