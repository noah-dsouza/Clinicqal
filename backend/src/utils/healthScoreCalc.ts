import { IntakeFormData } from "../types/intake";

interface HealthScoreResult {
  overall: number;
  cardiovascular: number;
  metabolic: number;
  functional: number;
  breakdown_notes: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function calculateHealthScore(intake: IntakeFormData): HealthScoreResult {
  const notes: string[] = [];

  // ── Cardiovascular Score (0-100) ──────────────────────────────────────────
  let cardioScore = 100;
  const vitals = intake.vitals;

  if (vitals.systolic_bp !== undefined && vitals.diastolic_bp !== undefined) {
    const sbp = vitals.systolic_bp;
    const dbp = vitals.diastolic_bp;
    if (sbp >= 180 || dbp >= 120) { cardioScore -= 40; notes.push("Hypertensive crisis detected."); }
    else if (sbp >= 140 || dbp >= 90) { cardioScore -= 20; notes.push("Stage 2 hypertension."); }
    else if (sbp >= 130 || dbp >= 80) { cardioScore -= 10; notes.push("Stage 1 hypertension."); }
    else if (sbp < 90) { cardioScore -= 25; notes.push("Hypotension noted."); }
  }

  if (vitals.heart_rate !== undefined) {
    const hr = vitals.heart_rate;
    if (hr > 120 || hr < 40) { cardioScore -= 25; notes.push("Significant heart rate abnormality."); }
    else if (hr > 100 || hr < 55) { cardioScore -= 10; notes.push("Heart rate outside normal range."); }
  }

  if (vitals.spo2_percent !== undefined) {
    const spo2 = vitals.spo2_percent;
    if (spo2 < 90) { cardioScore -= 30; notes.push("Critical oxygen saturation."); }
    else if (spo2 < 94) { cardioScore -= 15; notes.push("Low oxygen saturation."); }
    else if (spo2 < 96) { cardioScore -= 5; }
  }

  // Check lab markers for cardiovascular
  const cholesterol = intake.labs.find((l) => l.name.toLowerCase().includes("cholesterol") || l.name.toLowerCase().includes("ldl"));
  if (cholesterol) {
    if (cholesterol.value > 240) { cardioScore -= 15; notes.push("High cholesterol levels."); }
    else if (cholesterol.value > 200) { cardioScore -= 7; }
  }

  const allConditions = [
    intake.diagnosis.primary_condition,
    ...intake.diagnosis.secondary_conditions,
  ].map((c) => c.toLowerCase());

  if (allConditions.some((c) => c.includes("heart failure") || c.includes("myocardial") || c.includes("coronary"))) {
    cardioScore -= 30;
    notes.push("Cardiac condition impacts cardiovascular score.");
  }

  // ── Metabolic Score (0-100) ────────────────────────────────────────────────
  let metabolicScore = 100;

  const bmi = intake.demographics.weight_kg / Math.pow(intake.demographics.height_cm / 100, 2);
  if (bmi >= 40) { metabolicScore -= 30; notes.push("Severe obesity (BMI ≥40)."); }
  else if (bmi >= 35) { metabolicScore -= 20; notes.push("Obesity class II (BMI 35-39.9)."); }
  else if (bmi >= 30) { metabolicScore -= 12; notes.push("Obesity class I (BMI 30-34.9)."); }
  else if (bmi >= 25) { metabolicScore -= 5; }
  else if (bmi < 18.5) { metabolicScore -= 15; notes.push("Underweight (BMI <18.5)."); }

  const glucose = intake.labs.find((l) => l.name.toLowerCase().includes("glucose") || l.name.toLowerCase().includes("blood sugar"));
  const hba1c = intake.labs.find((l) => l.name.toLowerCase().includes("hba1c") || l.name.toLowerCase().includes("hemoglobin a1c"));

  if (glucose && glucose.value > 200) { metabolicScore -= 25; notes.push("Critically elevated blood glucose."); }
  else if (glucose && glucose.value > 125) { metabolicScore -= 15; notes.push("Elevated fasting glucose (diabetic range)."); }
  else if (glucose && glucose.value > 100) { metabolicScore -= 5; notes.push("Pre-diabetic glucose range."); }

  if (hba1c && hba1c.value > 9) { metabolicScore -= 25; notes.push("Very poor glycemic control (HbA1c >9%)."); }
  else if (hba1c && hba1c.value > 7) { metabolicScore -= 15; }
  else if (hba1c && hba1c.value > 5.7) { metabolicScore -= 5; }

  if (allConditions.some((c) => c.includes("diabetes") || c.includes("metabolic syndrome"))) {
    metabolicScore -= 15;
    notes.push("Metabolic condition noted.");
  }

  // ── Functional Score (0-100) ───────────────────────────────────────────────
  let functionalScore = 100;

  const activityMap: Record<string, number> = {
    active: 0,
    moderate: -5,
    light: -15,
    sedentary: -30,
  };
  functionalScore += activityMap[intake.lifestyle.physical_activity] ?? 0;

  const smokingMap: Record<string, number> = {
    never: 0,
    former: -5,
    current: -20,
  };
  functionalScore += smokingMap[intake.lifestyle.smoking_status] ?? 0;

  const alcoholMap: Record<string, number> = {
    none: 5,
    moderate: 0,
    heavy: -20,
  };
  functionalScore += alcoholMap[intake.lifestyle.alcohol_use] ?? 0;

  const dietMap: Record<string, number> = {
    good: 5,
    average: 0,
    poor: -15,
  };
  functionalScore += dietMap[intake.lifestyle.diet_quality] ?? 0;

  // Age adjustment
  const age = intake.demographics.age;
  if (age > 80) functionalScore -= 20;
  else if (age > 70) functionalScore -= 10;
  else if (age > 60) functionalScore -= 5;

  if (allConditions.some((c) => c.includes("cancer") || c.includes("tumor") || c.includes("lymphoma"))) {
    functionalScore -= 20;
    notes.push("Active malignancy affects functional score.");
  }

  // ── Overall Score ──────────────────────────────────────────────────────────
  const cvClamped = clamp(cardioScore, 0, 100);
  const metClamped = clamp(metabolicScore, 0, 100);
  const funcClamped = clamp(functionalScore, 0, 100);

  // Weighted average: CV 35%, Metabolic 30%, Functional 35%
  const overall = Math.round(cvClamped * 0.35 + metClamped * 0.30 + funcClamped * 0.35);

  return {
    overall: clamp(overall, 0, 100),
    cardiovascular: Math.round(cvClamped),
    metabolic: Math.round(metClamped),
    functional: Math.round(funcClamped),
    breakdown_notes: notes.length > 0 ? notes.join(" ") : "No significant health concerns identified from provided data.",
  };
}
