import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  color?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-[#868E96]",
  primary: "bg-[#0A6EBD]/10 text-[#0A6EBD]",
  success: "bg-[#12B886]/10 text-[#12B886]",
  warning: "bg-[#FF922B]/10 text-[#FF922B]",
  danger: "bg-[#FA5252]/10 text-[#FA5252]",
};

export function Badge({
  variant = "default",
  children,
  className,
  color,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        !color && variantStyles[variant],
        className,
      )}
      style={color ? { backgroundColor: `${color}1a`, color } : undefined}
    >
      {children}
    </span>
  );
}
