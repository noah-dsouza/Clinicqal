import React from "react";
import { cn } from "../../../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "teal" | "violet" | "emerald" | "amber" | "rose" | "blue" | "muted";
  size?: "sm" | "md";
  className?: string;
}

const variantStyles: Record<string, string> = {
  teal: "bg-[rgba(47,62,52,0.08)] text-[#2F3E34] border-[rgba(47,62,52,0.2)]",
  violet: "bg-[rgba(47,62,52,0.08)] text-[#2F3E34] border-[rgba(47,62,52,0.2)]",
  emerald: "bg-[rgba(107,127,106,0.1)] text-[#6B7F6A] border-[rgba(107,127,106,0.25)]",
  amber: "bg-[rgba(193,132,58,0.1)] text-[#C1843A] border-[rgba(193,132,58,0.25)]",
  rose: "bg-[rgba(169,90,63,0.1)] text-[#A95A3F] border-[rgba(169,90,63,0.25)]",
  blue: "bg-[rgba(163,174,149,0.12)] text-[#6B7F6A] border-[rgba(163,174,149,0.3)]",
  muted: "bg-[rgba(139,119,101,0.08)] text-[#8B7765] border-[rgba(139,119,101,0.2)]",
};

const sizeStyles: Record<string, string> = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
};

export function Badge({ children, variant = "muted", size = "sm", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
