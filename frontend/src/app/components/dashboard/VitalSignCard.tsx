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
  if (low !== undefined && num < low * 0.8) return "critical";
  if (high !== undefined && num > high * 1.3) return "critical";
  if ((low !== undefined && num < low) || (high !== undefined && num > high)) return "abnormal";
  return "normal";
}

const statusColors: Record<VitalStatus, string> = {
  normal: "#34D399",
  abnormal: "#FBBF24",
  critical: "#F87171",
  unknown: "#64748B",
};

export function VitalSignCard({ label, value, unit, normalLow, normalHigh, icon }: VitalSignCardProps) {
  const status = getStatus(value, normalLow, normalHigh);
  const color = statusColors[status];
  const displayValue = value !== undefined && value !== null && value !== "" ? value : "—";

  return (
    <div
      className="rounded-xl p-3.5 border transition-all duration-200"
      style={{ background: `${color}09`, borderColor: `${color}22` }}
    >
      <div className="flex items-start justify-between mb-2.5">
        <span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-wide leading-tight">{label}</span>
        {icon && (
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
            <span style={{ color }}>{icon}</span>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold" style={{ color, textShadow: status !== "unknown" ? `0 0 10px ${color}35` : "none" }}>
          {displayValue}
        </span>
        {value !== undefined && value !== "" && (
          <span className="text-[10px] text-[#64748B]">{unit}</span>
        )}
      </div>

      {normalLow !== undefined && normalHigh !== undefined && (
        <p className="mt-1.5 text-[9px] text-[#64748B]">{normalLow}–{normalHigh} {unit}</p>
      )}

      {status !== "unknown" && (
        <div className="mt-1.5 flex items-center gap-1">
          <div className="w-1 h-1 rounded-full" style={{ background: color, boxShadow: status === "critical" ? `0 0 4px ${color}` : "none" }} />
          <span className="text-[9px] capitalize" style={{ color }}>{status}</span>
        </div>
      )}
    </div>
  );
}
