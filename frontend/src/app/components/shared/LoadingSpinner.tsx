import React from "react";
import { cn } from "../../../lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
  label?: string;
}

const sizeMap: Record<string, { wh: string; stroke: number }> = {
  sm: { wh: "w-4 h-4", stroke: 2 },
  md: { wh: "w-8 h-8", stroke: 2.5 },
  lg: { wh: "w-12 h-12", stroke: 2.5 },
};

export function LoadingSpinner({
  size = "md",
  color = "#0D9488",
  className,
  label,
}: LoadingSpinnerProps) {
  const { wh, stroke } = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <svg
        className={cn(wh, "animate-spin")}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth={stroke}
          strokeOpacity="0.2"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
      {label && (
        <span className="text-sm text-[#6B7280] animate-pulse">{label}</span>
      )}
    </div>
  );
}
