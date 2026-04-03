"use client";

import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "teal" | "emerald" | "amber" | "rose" | "none";
}

const glowClasses = {
  teal: "glow-teal border-[rgba(13,148,136,0.25)]",
  emerald: "glow-emerald border-[rgba(34,197,94,0.25)]",
  amber: "glow-amber border-[rgba(245,158,11,0.25)]",
  rose: "glow-rose border-[rgba(239,68,68,0.25)]",
  none: "border-border",
};

export function GlowCard({ children, className, glowColor = "teal" }: GlowCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-all",
        glowClasses[glowColor],
        className
      )}
    >
      {children}
    </div>
  );
}
