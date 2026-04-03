"use client";

import { useState } from "react";
import { useDigitalTwin } from "@/context/DigitalTwinContext";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { HealthScoreGauge } from "./HealthScoreGauge";

interface SliderConfig {
  key: string;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  formatValue: (v: number) => string;
  color: string;
}

const SLIDERS: SliderConfig[] = [
  {
    key: "sleep_quality",
    label: "Sleep Quality",
    description: "Hours of quality sleep per night",
    min: 3,
    max: 10,
    step: 0.5,
    defaultValue: 7,
    formatValue: (v) => `${v}h/night`,
    color: "#0D9488",
  },
  {
    key: "exercise_frequency",
    label: "Exercise Frequency",
    description: "Days per week of moderate exercise",
    min: 0,
    max: 7,
    step: 1,
    defaultValue: 3,
    formatValue: (v) => `${v}x/week`,
    color: "#22C55E",
  },
  {
    key: "diet_quality_score",
    label: "Diet Quality",
    description: "Overall diet adherence score",
    min: 1,
    max: 10,
    step: 1,
    defaultValue: 5,
    formatValue: (v) => (v <= 3 ? "Poor" : v <= 6 ? "Average" : "Good"),
    color: "#22C55E",
  },
  {
    key: "alcohol_frequency",
    label: "Alcohol Reduction",
    description: "Drinks per week (lower is better)",
    min: 0,
    max: 21,
    step: 1,
    defaultValue: 7,
    formatValue: (v) => `${v}/week`,
    color: "#F59E0B",
  },
  {
    key: "medication_adherence",
    label: "Medication Adherence",
    description: "Percentage of doses taken as prescribed",
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 80,
    formatValue: (v) => `${v}%`,
    color: "#3B82F6",
  },
];

type ScenarioOverrides = {
  diet_quality?: "poor" | "average" | "good";
  physical_activity?: "sedentary" | "light" | "moderate" | "active";
  alcohol_use?: "none" | "moderate" | "heavy";
  smoking_status?: "never" | "former" | "current";
};

function mapToOverrides(
  sliderValues: Record<string, number>,
  smokingStatus: "never" | "former" | "current"
): ScenarioOverrides {
  const payload: ScenarioOverrides = {};

  const dietScore = sliderValues["diet_quality_score"] ?? 5;
  payload.diet_quality = dietScore <= 3 ? "poor" : dietScore <= 6 ? "average" : "good";

  const exercise = sliderValues["exercise_frequency"] ?? 3;
  payload.physical_activity = exercise === 0 ? "sedentary" : exercise <= 2 ? "light" : exercise <= 4 ? "moderate" : "active";

  const alcoholPerWeek = sliderValues["alcohol_frequency"] ?? 7;
  payload.alcohol_use = alcoholPerWeek === 0 ? "none" : alcoholPerWeek <= 7 ? "moderate" : "heavy";

  payload.smoking_status = smokingStatus;
  return payload;
}

export function ScenarioBuilder() {
  const { twin, setTwin } = useDigitalTwin();
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    SLIDERS.forEach((s) => (defaults[s.key] = s.defaultValue));
    return defaults;
  });
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  if (!twin) return null;

  const updateSlider = (key: string, value: number) => {
    setSliderValues((prev) => ({ ...prev, [key]: value }));
    setApplied(false);
  };

  const handleApply = async () => {
    setIsApplying(true);
    setError(null);
    try {
      const overrides = mapToOverrides(sliderValues, twin.intake.lifestyle.smoking_status);
      const res = await fetch("/api/agent/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twin, scenarioOverrides: overrides, trials: [] }),
      });
      if (!res.ok) throw new Error("Reanalyze request failed");
      const data = await res.json();
      if (data.updatedTwin) setTwin(data.updatedTwin);
      setApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply scenario");
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    const defaults: Record<string, number> = {};
    SLIDERS.forEach((s) => (defaults[s.key] = s.defaultValue));
    setSliderValues(defaults);
    setApplied(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Lifestyle Scenario Simulator</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Adjust lifestyle parameters to see how improvements affect your health score and trial eligibility.
          </p>

          <div className="space-y-6">
            {SLIDERS.map((slider) => {
              const value = sliderValues[slider.key] ?? slider.defaultValue;
              const pct = ((value - slider.min) / (slider.max - slider.min)) * 100;
              return (
                <div key={slider.key}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-foreground">{slider.label}</span>
                      <p className="text-xs text-muted-foreground">{slider.description}</p>
                    </div>
                    <span
                      className="text-sm font-bold px-3 py-1 rounded-lg"
                      style={{ color: slider.color, background: `${slider.color}12` }}
                    >
                      {slider.formatValue(value)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={value}
                    onChange={(e) => updateSlider(slider.key, parseFloat(e.target.value))}
                    className="w-full"
                    style={{ background: `linear-gradient(to right, ${slider.color} ${pct}%, hsl(var(--border)) ${pct}%)` }}
                  />
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="flex-1 py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-semibold hover:bg-[#0f766e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(13,148,136,0.25)]"
            >
              {isApplying ? (
                <><LoadingSpinner size="sm" color="white" />Applying...</>
              ) : applied ? (
                "✓ Applied — Re-apply"
              ) : (
                "Apply Scenario"
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-card rounded-xl border border-[rgba(13,148,136,0.2)] p-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">Current Health Score</h4>
          <div className="flex justify-center">
            <HealthScoreGauge
              score={twin.health_score.overall}
              size={160}
              showSubScores
              cardiovascular={twin.health_score.cardiovascular}
              metabolic={twin.health_score.metabolic}
              functional={twin.health_score.functional}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Score Breakdown</h4>
          {[
            { label: "Cardiovascular", score: twin.health_score.cardiovascular, color: "#EF4444" },
            { label: "Metabolic", score: twin.health_score.metabolic, color: "#F59E0B" },
            { label: "Functional", score: twin.health_score.functional, color: "#22C55E" },
          ].map((item) => (
            <div key={item.label} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-bold" style={{ color: item.color }}>{item.score}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.score}%`, background: item.color, boxShadow: `0 0 6px ${item.color}60` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Clinical Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">ECOG Status</span>
              <span className="text-xs font-medium text-foreground">{twin.ecog_estimate} / 4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Charlson Index</span>
              <span className="text-xs font-medium text-foreground">{twin.charlson_index}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">10yr Survival</span>
              <span className="text-xs font-medium text-[#22C55E]">{twin.charlson_10yr_survival_pct}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">BMI</span>
              <span className="text-xs font-medium text-foreground">{twin.bmi.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
