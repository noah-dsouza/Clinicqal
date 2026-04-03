import { DigitalTwin } from "../types/digitalTwin";

export function formatPatientSummary(twin: DigitalTwin): string {
  const dx = twin.intake.diagnosis;
  const demographics = twin.intake.demographics;
  const labs = twin.intake.labs
    .slice(0, 3)
    .map((lab) => `${lab.name} ${lab.value}${lab.unit ? ` ${lab.unit}` : ""}`);
  const meds = twin.active_medication_names.slice(0, 4);
  const summaryParts = [
    `${demographics.age}-year-old ${demographics.sex} with ${dx.primary_condition}${dx.stage ? ` (stage ${dx.stage})` : ""}`,
    `Health score ${twin.health_score.overall}/100 (cardio ${twin.health_score.cardiovascular}, metabolic ${twin.health_score.metabolic}, functional ${twin.health_score.functional})`,
  ];
  if (dx.secondary_conditions.length > 0) summaryParts.push(`Comorbidities: ${dx.secondary_conditions.join(", ")}`);
  if (labs.length > 0) summaryParts.push(`Key labs: ${labs.join("; ")}`);
  if (meds.length > 0) summaryParts.push(`Meds: ${meds.join(", ")}`);
  return summaryParts.join(". ");
}
