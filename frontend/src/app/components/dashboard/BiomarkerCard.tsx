import React from "react";
import { isLabAbnormal } from "../../../lib/utils";

interface BiomarkerCardProps {
  name: string;
  value: number;
  unit: string;
  referenceLow?: number;
  referenceHigh?: number;
  date?: string;
}

export function BiomarkerCard({
  name,
  value,
  unit,
  referenceLow,
  referenceHigh,
  date,
}: BiomarkerCardProps) {
  const status = isLabAbnormal(value, referenceLow, referenceHigh);

  const colorMap = {
    normal: { text: "#22C55E", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.2)", bar: "#22C55E" },
    low: { text: "#F59E0B", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", bar: "#F59E0B" },
    high: { text: "#EF4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)", bar: "#EF4444" },
  };

  const colors = colorMap[status];

  // Calculate bar fill percentage
  let barPct = 50;
  if (referenceLow !== undefined && referenceHigh !== undefined) {
    const range = referenceHigh - referenceLow;
    const expanded = range * 2;
    const min = referenceLow - range * 0.5;
    barPct = Math.max(2, Math.min(98, ((value - min) / expanded) * 100));
  }

  // Reference low/high percentages on the bar
  let refLowPct = 25;
  let refHighPct = 75;
  if (referenceLow !== undefined && referenceHigh !== undefined) {
    const range = referenceHigh - referenceLow;
    const expanded = range * 2;
    const min = referenceLow - range * 0.5;
    refLowPct = Math.max(2, Math.min(98, ((referenceLow - min) / expanded) * 100));
    refHighPct = Math.max(2, Math.min(98, ((referenceHigh - min) / expanded) * 100));
  }

  return (
    <div
      className="rounded-xl p-3 border transition-all duration-150 hover:border-opacity-60"
      style={{
        background: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-medium text-[#6B7280] truncate max-w-[120px]">{name}</p>
          {date && <p className="text-xs text-[#9CA3AF] mt-0.5">{date}</p>}
        </div>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-medium"
          style={{
            color: colors.text,
            background: colors.bg,
          }}
        >
          {status === "normal" ? "✓" : status === "low" ? "↓" : "↑"}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-lg font-bold" style={{ color: colors.text }}>
          {value}
        </span>
        <span className="text-xs text-[#9CA3AF]">{unit}</span>
      </div>

      {/* Bar visualization */}
      {(referenceLow !== undefined || referenceHigh !== undefined) && (
        <div className="relative">
          {/* Background bar */}
          <div className="h-1.5 rounded-full bg-[#E5E7EB] relative overflow-hidden">
            {/* Normal range highlight */}
            <div
              className="absolute top-0 h-full bg-[rgba(34,197,94,0.15)] rounded-full"
              style={{
                left: `${refLowPct}%`,
                width: `${refHighPct - refLowPct}%`,
              }}
            />
            {/* Value indicator */}
            <div
              className="absolute top-0 h-full w-0.5 rounded-full"
              style={{
                left: `${barPct}%`,
                background: colors.bar,
                boxShadow: `0 0 4px ${colors.bar}`,
              }}
            />
          </div>

          {/* Reference labels */}
          {referenceLow !== undefined && referenceHigh !== undefined && (
            <div className="flex justify-between mt-1">
              <span className="text-xs text-[#9CA3AF]">{referenceLow}</span>
              <span className="text-xs text-[#9CA3AF]">{referenceHigh}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
