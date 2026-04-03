import React from "react";
import { IntakeFormData } from "../../../../types/intake";

interface Props {
  vitals: IntakeFormData["vitals"];
  onChange: (updates: Partial<IntakeFormData["vitals"]>) => void;
}

const inputCls =
  "w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] rounded-lg px-4 py-2.5 text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[rgba(20,184,166,0.4)] transition-colors";

const labelCls = "block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wide";

interface VitalMeta {
  key: keyof IntakeFormData["vitals"];
  label: string;
  placeholder: string;
  unit: string;
  normalLow?: number;
  normalHigh?: number;
  step?: number;
}

const VITAL_FIELDS: VitalMeta[] = [
  {
    key: "systolic_bp",
    label: "Systolic BP",
    placeholder: "e.g. 120",
    unit: "mmHg",
    normalLow: 90,
    normalHigh: 130,
  },
  {
    key: "diastolic_bp",
    label: "Diastolic BP",
    placeholder: "e.g. 80",
    unit: "mmHg",
    normalLow: 60,
    normalHigh: 85,
  },
  {
    key: "heart_rate",
    label: "Heart Rate",
    placeholder: "e.g. 72",
    unit: "bpm",
    normalLow: 60,
    normalHigh: 100,
  },
  {
    key: "spo2_percent",
    label: "SpO₂ Saturation",
    placeholder: "e.g. 98",
    unit: "%",
    normalLow: 95,
    normalHigh: 100,
    step: 0.1,
  },
  {
    key: "temperature_c",
    label: "Temperature",
    placeholder: "e.g. 36.6",
    unit: "°C",
    normalLow: 36.1,
    normalHigh: 37.2,
    step: 0.1,
  },
  {
    key: "respiratory_rate",
    label: "Respiratory Rate",
    placeholder: "e.g. 16",
    unit: "/min",
    normalLow: 12,
    normalHigh: 20,
  },
];

function getVitalStatus(
  value: number,
  low?: number,
  high?: number
): "normal" | "abnormal" | "critical" {
  if (!value) return "normal";
  const tooLow = low !== undefined && value < low;
  const tooHigh = high !== undefined && value > high;
  if (!tooLow && !tooHigh) return "normal";

  // Critical checks
  if (low !== undefined && value < low * 0.8) return "critical";
  if (high !== undefined && value > high * 1.3) return "critical";
  return "abnormal";
}

export function Step5Vitals({ vitals, onChange }: Props) {
  return (
    <div className="fade-in-up">
      <h2 className="text-xl font-bold text-[#F1F5F9] mb-1">Vital Signs</h2>
      <p className="text-sm text-[#64748B] mb-6">
        Enter your most recent vital signs. Leave fields blank if not available.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VITAL_FIELDS.map((vital) => {
          const value = vitals[vital.key] as number | undefined;
          const status = value ? getVitalStatus(value, vital.normalLow, vital.normalHigh) : "normal";

          const borderColor =
            status === "critical"
              ? "border-[rgba(239,68,68,0.5)] focus:border-[#EF4444]"
              : status === "abnormal"
              ? "border-[rgba(245,158,11,0.5)] focus:border-[#F59E0B]"
              : "";

          return (
            <div key={vital.key}>
              <label className={labelCls}>
                {vital.label}
                {vital.normalLow !== undefined && vital.normalHigh !== undefined && (
                  <span className="ml-2 text-[#64748B] normal-case tracking-normal">
                    (normal: {vital.normalLow}–{vital.normalHigh} {vital.unit})
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="number"
                  className={`${inputCls} pr-14 ${borderColor}`}
                  placeholder={vital.placeholder}
                  step={vital.step || 1}
                  value={value || ""}
                  onChange={(e) =>
                    onChange({
                      [vital.key]: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">
                  {vital.unit}
                </span>
              </div>
              {value !== undefined && value > 0 && (
                <div className="mt-1">
                  {status === "critical" && (
                    <span className="text-xs text-[#EF4444]">⚠ Critical value</span>
                  )}
                  {status === "abnormal" && (
                    <span className="text-xs text-[#F59E0B]">• Outside normal range</span>
                  )}
                  {status === "normal" && (
                    <span className="text-xs text-[#22C55E]">✓ Normal</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-[rgba(13,148,136,0.05)] rounded-lg border border-[rgba(13,148,136,0.12)]">
        <p className="text-xs text-[#64748B]">
          <span className="text-[#0D9488] font-medium">Tip:</span> Vital signs help estimate your ECOG
          performance status and are used to determine eligibility for many clinical trials that require
          specific cardiovascular parameters.
        </p>
      </div>
    </div>
  );
}
