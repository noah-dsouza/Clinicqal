import { DigitalTwin } from "../types/digitalTwin";

export function formatPatientSummary(twin: DigitalTwin): string {
  const dx = twin.intake.diagnosis;
  const demographics = twin.intake.demographics;
  const labs = twin.intake.labs
    .slice(0, 4)
    .map((lab) => `${lab.name} ${lab.value}${lab.unit ? ` ${lab.unit}` : ""}`);
  const meds = twin.active_medication_names.slice(0, 5);
  const vitals = twin.intake.vitals;

  const summaryParts = [
    `${demographics.age}-year-old ${demographics.sex} living in ${demographics.zip_code || "unknown location"} with ${dx.primary_condition}${dx.stage ? ` (stage ${dx.stage})` : ""}`,
    `Overall health score ${twin.health_score.overall}/100 (cardio ${twin.health_score.cardiovascular}, metabolic ${twin.health_score.metabolic}, functional ${twin.health_score.functional})`,
    `ECOG ${twin.ecog_estimate}/4, Charlson index ${twin.charlson_index} (~${twin.charlson_10yr_survival_pct}% 10-yr survival)`,
  ];

  if (dx.secondary_conditions.length > 0) {
    summaryParts.push(`Comorbidities: ${dx.secondary_conditions.join(", ")}`);
  }
  if (labs.length > 0) {
    summaryParts.push(`Recent labs: ${labs.join("; ")}`);
  }
  if (meds.length > 0) {
    summaryParts.push(`Active medications: ${meds.join(", ")}`);
  }
  const vitalSnippets: string[] = [];
  if (vitals.systolic_bp && vitals.diastolic_bp) vitalSnippets.push(`BP ${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg`);
  if (vitals.heart_rate) vitalSnippets.push(`HR ${vitals.heart_rate} bpm`);
  if (vitals.spo2_percent) vitalSnippets.push(`SpO₂ ${vitals.spo2_percent}%`);
  if (vitals.temperature_c) vitalSnippets.push(`Temp ${vitals.temperature_c}°C`);
  if (vitalSnippets.length > 0) {
    summaryParts.push(`Vitals: ${vitalSnippets.join(", ")}`);
  }

  return summaryParts.join(". ");
}
