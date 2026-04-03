"use client";

import React from "react";

interface VitalSignCardProps {
  label: string;
  value: number | string | undefined;
  unit: string;
  normalLow?: number;
  normalHigh?: number;
  icon?: React.ReactNode;
}

type VitalStatus = "normal" | "abnormal" | "critical" | "unknown";

function getStatus(value: number | string | undefined, low?: number, high?: number): VitalStatus {
  if (value === undefined || value === null || value === "") return "unknown";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "unknown";
  const isLow = low !== undefined && num < low;
  const isHigh = high !== undefined && num > high;
  if (!isLow && !isHigh) return "normal";
  if ((low !== undefined && num < low * 0.8) || (high !== undefined && num > high * 1.3)) return "critical";
  return "abnormal";
}

const statusColors: Record<VitalStatus, string> = {
  normal: "#22C55E",
  abnormal: "#F59E0B",
  critical: "#EF4444",
  unknown: "hsl(var(--muted-foreground))",
};

const statusBg: Record<VitalStatus, string> = {
  normal: "rgba(34, 197, 94, 0.06)",
  abnormal: "rgba(245, 158, 11, 0.06)",
  critical: "rgba(239, 68, 68, 0.06)",
  unknown: "hsl(var(--muted)/0.4)",
};

const statusBorder: Record<VitalStatus, string> = {
  normal: "rgba(34, 197, 94, 0.2)",
  abnormal: "rgba(245, 158, 11, 0.2)",
  critical: "rgba(239, 68, 68, 0.2)",
  unknown: "hsl(var(--border))",
};

export function VitalSignCard({ label, value, unit, normalLow, normalHigh, icon }: VitalSignCardProps) {
  const status = getStatus(value, normalLow, normalHigh);
  const color = statusColors[status];
  const displayValue = value !== undefined && value !== null && value !== "" ? value : "—";

  return (
    <div
      className="rounded-xl p-4 border transition-all duration-200"
      style={{ background: statusBg[status], borderColor: statusBorder[status] }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">{label}</span>
        {icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
            <span style={{ color }}>{icon}</span>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold" style={{ color, textShadow: status !== "unknown" ? `0 0 12px ${color}40` : "none" }}>
          {displayValue}
        </span>
        {value !== undefined && value !== "" && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>

      {normalLow !== undefined && normalHigh !== undefined && (
        <div className="mt-2 text-xs text-muted-foreground">Normal: {normalLow}–{normalHigh}</div>
      )}

      {status !== "unknown" && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: status === "critical" ? `0 0 6px ${color}` : "none" }} />
          <span className="text-xs capitalize" style={{ color }}>{status}</span>
        </div>
      )}
    </div>
  );
}
