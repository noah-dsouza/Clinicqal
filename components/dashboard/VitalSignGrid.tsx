"use client";

import { VitalSignCard } from "./VitalSignCard";
import { IntakeFormData } from "@/lib/digital-twin/schema";

interface VitalSignGridProps {
  vitals: IntakeFormData["vitals"];
}

export function VitalSignGrid({ vitals }: VitalSignGridProps) {
  const vitalCards = [
    {
      key: "systolic_bp" as const,
      label: "Systolic BP",
      unit: "mmHg",
      normalLow: 90,
      normalHigh: 130,
      value: vitals.systolic_bp ? `${vitals.systolic_bp}/${vitals.diastolic_bp ?? "??"}` : undefined,
      numericValue: vitals.systolic_bp,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: "heart_rate" as const,
      label: "Heart Rate",
      unit: "bpm",
      normalLow: 60,
      normalHigh: 100,
      value: vitals.heart_rate,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: "spo2_percent" as const,
      label: "SpO₂",
      unit: "%",
      normalLow: 95,
      normalHigh: 100,
      value: vitals.spo2_percent,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "temperature_c" as const,
      label: "Temperature",
      unit: "°C",
      normalLow: 36.1,
      normalHigh: 37.2,
      value: vitals.temperature_c,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: "respiratory_rate" as const,
      label: "Resp. Rate",
      unit: "/min",
      normalLow: 12,
      normalHigh: 20,
      value: vitals.respiratory_rate,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 12H2a10 10 0 0 0 20 0h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 6l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {vitalCards.map((vital) => (
        <VitalSignCard
          key={vital.key}
          label={vital.label}
          value={vital.value}
          unit={vital.unit}
          normalLow={vital.normalLow}
          normalHigh={vital.normalHigh}
          icon={vital.icon}
        />
      ))}
    </div>
  );
}
