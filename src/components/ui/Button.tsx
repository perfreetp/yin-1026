import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success" | "warning";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[#0A6EBD] text-white hover:bg-[#095a9a] active:bg-[#084d82]",
  secondary:
    "border border-[#0A6EBD] text-[#0A6EBD] bg-white hover:bg-[#0A6EBD]/5 active:bg-[#0A6EBD]/10",
  danger: "bg-[#FA5252] text-white hover:bg-[#e04444] active:bg-[#c93b3b]",
  ghost:
    "bg-transparent text-[#868E96] hover:bg-gray-100 active:bg-gray-200",
  success: "bg-green-600 text-white hover:bg-green-700 active:bg-green-800",
  warning: "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/40 disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
