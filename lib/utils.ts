import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toFixed(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function getHealthScoreColor(score: number): string {
  if (score >= 70) return "#22C55E";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

export function getSystemStatusColor(
  status: "normal" | "abnormal" | "critical" | "unknown"
): string {
  switch (status) {
    case "normal":
      return "#22C55E";
    case "abnormal":
      return "#F59E0B";
    case "critical":
      return "#EF4444";
    case "unknown":
      return "#9CA3AF";
  }
}

export function cssVar(name: string): string {
  return `var(${name})`;
}

export function getRecommendationColor(rec: string): string {
  switch (rec) {
    case "strong_match":
      return "#22C55E";
    case "possible_match":
      return "#0D9488";
    case "unlikely":
      return "#F59E0B";
    case "excluded":
      return "#EF4444";
    default:
      return "#9CA3AF";
  }
}

export function getRecommendationLabel(rec: string): string {
  switch (rec) {
    case "strong_match":
      return "Strong Match";
    case "possible_match":
      return "Possible Match";
    case "unlikely":
      return "Unlikely";
    case "excluded":
      return "Excluded";
    default:
      return "Unknown";
  }
}

export function getCriterionStatusColor(status: string): string {
  switch (status) {
    case "met":
      return "#22C55E";
    case "likely_met":
      return "#0D9488";
    case "unmet":
      return "#EF4444";
    case "likely_unmet":
      return "#F59E0B";
    case "unknown":
      return "#9CA3AF";
    default:
      return "#9CA3AF";
  }
}

export function getEcogLabel(ecog: number): string {
  const labels: Record<number, string> = {
    0: "Fully Active",
    1: "Restricted",
    2: "Ambulatory",
    3: "Limited Self-Care",
    4: "Disabled",
  };
  return labels[ecog] ?? "Unknown";
}

export function formatPhase(phase: string): string {
  if (!phase || phase === "N/A") return "N/A";
  return phase.replace("PHASE", "Phase ").replace("_", " ").trim();
}

export function getBmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "#F59E0B" };
  if (bmi < 25) return { label: "Normal", color: "#22C55E" };
  if (bmi < 30) return { label: "Overweight", color: "#F59E0B" };
  if (bmi < 35) return { label: "Obese I", color: "#EF4444" };
  if (bmi < 40) return { label: "Obese II", color: "#EF4444" };
  return { label: "Obese III", color: "#EF4444" };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function isLabAbnormal(
  value: number,
  low?: number,
  high?: number
): "low" | "high" | "normal" {
  if (low !== undefined && value < low) return "low";
  if (high !== undefined && value > high) return "high";
  return "normal";
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "…";
}
