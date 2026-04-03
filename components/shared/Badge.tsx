"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "teal" | "violet" | "emerald" | "amber" | "rose" | "blue" | "muted";
  size?: "sm" | "md";
  className?: string;
}

const variantStyles: Record<string, string> = {
  teal: "bg-[rgba(13,148,136,0.1)] text-[#0D9488] border-[rgba(13,148,136,0.25)]",
  violet: "bg-[rgba(13,148,136,0.1)] text-[#0D9488] border-[rgba(13,148,136,0.25)]",
  emerald: "bg-[rgba(34,197,94,0.1)] text-[#22C55E] border-[rgba(34,197,94,0.25)]",
  amber: "bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.25)]",
  rose: "bg-[rgba(239,68,68,0.1)] text-[#EF4444] border-[rgba(239,68,68,0.25)]",
  blue: "bg-[rgba(59,130,246,0.1)] text-[#3B82F6] border-[rgba(59,130,246,0.25)]",
  muted: "bg-[rgba(156,163,175,0.1)] text-muted-foreground border-[rgba(156,163,175,0.25)]",
};

const sizeStyles: Record<string, string> = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
};

export function Badge({ children, variant = "muted", size = "sm", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border font-medium", variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </span>
  );
}
