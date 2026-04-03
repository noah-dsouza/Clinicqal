import React from "react";
import { cn } from "../../../lib/utils";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "teal" | "violet" | "emerald" | "amber" | "rose" | "blue" | "none";
  onClick?: () => void;
  interactive?: boolean;
}

const glowClasses: Record<string, string> = {
  teal: "glow-teal border-[rgba(13,148,136,0.2)]",
  violet: "glow-teal border-[rgba(13,148,136,0.2)]",
  emerald: "glow-emerald border-[rgba(34,197,94,0.2)]",
  amber: "glow-amber border-[rgba(245,158,11,0.2)]",
  rose: "glow-rose border-[rgba(239,68,68,0.2)]",
  blue: "border-[rgba(59,130,246,0.2)]",
  none: "border-[#E5E7EB]",
};

export function GlowCard({
  children,
  className,
  glowColor = "none",
  onClick,
  interactive = false,
}: GlowCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4",
        glowClasses[glowColor],
        interactive && "cursor-pointer transition-all duration-200 hover:bg-[#F9FAFB] hover:scale-[1.01]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
