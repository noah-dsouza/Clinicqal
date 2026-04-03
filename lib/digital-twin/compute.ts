import { IntakeFormData } from "./schema";
import { BodySystem } from "./schema";

// ── Health Score ─────────────────────────────────────────────────────────────

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

  const cholesterol = intake.labs.find(
    (l) => l.name.toLowerCase().includes("cholesterol") || l.name.toLowerCase().includes("ldl")
  );
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

  const glucose = intake.labs.find(
    (l) => l.name.toLowerCase().includes("glucose") || l.name.toLowerCase().includes("blood sugar")
  );
  const hba1c = intake.labs.find(
    (l) => l.name.toLowerCase().includes("hba1c") || l.name.toLowerCase().includes("hemoglobin a1c")
  );

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

  const activityMap: Record<string, number> = { active: 0, moderate: -5, light: -15, sedentary: -30 };
  functionalScore += activityMap[intake.lifestyle.physical_activity] ?? 0;

  const smokingMap: Record<string, number> = { never: 0, former: -5, current: -20 };
  functionalScore += smokingMap[intake.lifestyle.smoking_status] ?? 0;

  const alcoholMap: Record<string, number> = { none: 5, moderate: 0, heavy: -20 };
  functionalScore += alcoholMap[intake.lifestyle.alcohol_use] ?? 0;

  const dietMap: Record<string, number> = { good: 5, average: 0, poor: -15 };
  functionalScore += dietMap[intake.lifestyle.diet_quality] ?? 0;

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
    breakdown_notes:
      notes.length > 0 ? notes.join(" ") : "No significant health concerns identified from provided data.",
  };
}

// ── ECOG Estimator ────────────────────────────────────────────────────────────

/**
 * Estimates ECOG Performance Status (0-4) from intake data.
 * 0 = Fully active, 1 = Restricted strenuous activity, 2 = Ambulatory >50% of day,
 * 3 = Confined to bed/chair >50% of day, 4 = Completely disabled.
 */
export function estimateECOG(intake: IntakeFormData): 0 | 1 | 2 | 3 | 4 {
  let score = 0;

  const activity = intake.lifestyle.physical_activity;
  if (activity === "sedentary") score += 2;
  else if (activity === "light") score += 1;

  if (intake.lifestyle.smoking_status === "current") score += 1;
  if (intake.lifestyle.alcohol_use === "heavy") score += 1;

  const vitals = intake.vitals;
  if (vitals.spo2_percent && vitals.spo2_percent < 92) score += 2;
  else if (vitals.spo2_percent && vitals.spo2_percent < 95) score += 1;

  if (vitals.systolic_bp && vitals.systolic_bp < 90) score += 1;
  if (vitals.heart_rate && vitals.heart_rate > 110) score += 1;

  const criticalLabs = intake.labs.filter((lab) => {
    if (!lab.reference_low && !lab.reference_high) return false;
    const tooLow = lab.reference_low !== undefined && lab.value < lab.reference_low * 0.7;
    const tooHigh = lab.reference_high !== undefined && lab.value > lab.reference_high * 1.5;
    return tooLow || tooHigh;
  });
  if (criticalLabs.length >= 3) score += 1;

  if (intake.demographics.age > 75) score += 1;

  if (score <= 0) return 0;
  if (score === 1) return 1;
  if (score === 2) return 2;
  if (score === 3) return 3;
  return 4;
}

// ── Charlson Comorbidity Index ────────────────────────────────────────────────

interface CharlsonResult {
  index: number;
  ten_year_survival_pct: number;
}

export function calculateCharlsonIndex(intake: IntakeFormData): CharlsonResult {
  let score = 0;

  const allConditions = [
    intake.diagnosis.primary_condition,
    ...intake.diagnosis.secondary_conditions,
  ].map((c) => c.toLowerCase());

  const icd10 = (intake.diagnosis.icd10_code || "").toUpperCase();

  const hasCondition = (...keywords: string[]): boolean =>
    keywords.some((kw) => allConditions.some((c) => c.includes(kw.toLowerCase())));

  if (hasCondition("myocardial infarction", "heart attack", "mi")) score += 1;
  if (hasCondition("congestive heart failure", "chf", "heart failure")) score += 1;
  if (hasCondition("peripheral vascular", "pvd", "arterial disease")) score += 1;
  if (hasCondition("cerebrovascular", "stroke", "tia")) score += 1;
  if (hasCondition("dementia", "alzheimer")) score += 1;
  if (hasCondition("chronic pulmonary", "copd", "emphysema", "chronic bronchitis")) score += 1;
  if (hasCondition("connective tissue", "lupus", "rheumatoid arthritis", "scleroderma")) score += 1;
  if (hasCondition("peptic ulcer", "gastric ulcer", "duodenal ulcer")) score += 1;
  if (hasCondition("mild liver", "hepatitis", "cirrhosis") && !hasCondition("severe liver", "esophageal varices")) score += 1;
  if (hasCondition("diabetes") && !hasCondition("end organ", "nephropathy", "retinopathy", "neuropathy")) score += 1;

  if (hasCondition("hemiplegia", "paraplegia")) score += 2;
  if (hasCondition("moderate renal", "severe renal", "chronic kidney", "renal failure", "ckd")) score += 2;
  if (hasCondition("diabetes") && hasCondition("end organ", "nephropathy", "retinopathy", "neuropathy")) score += 2;
  if (
    hasCondition("solid tumor") ||
    (icd10.startsWith("C") &&
      !icd10.startsWith("C77") &&
      !icd10.startsWith("C78") &&
      !icd10.startsWith("C79"))
  ) {
    if (!hasCondition("metastatic", "stage iv", "stage 4")) score += 2;
  }
  if (hasCondition("leukemia", "lymphoma", "multiple myeloma")) score += 2;

  if (hasCondition("moderate liver", "severe liver", "portal hypertension", "esophageal varices")) score += 3;

  if (
    hasCondition("metastatic", "stage iv", "stage 4") ||
    icd10.startsWith("C77") ||
    icd10.startsWith("C78") ||
    icd10.startsWith("C79")
  ) score += 6;
  if (hasCondition("aids", "hiv") && hasCondition("opportunistic")) score += 6;

  const age = intake.demographics.age;
  if (age >= 50 && age < 60) score += 1;
  else if (age >= 60 && age < 70) score += 2;
  else if (age >= 70 && age < 80) score += 3;
  else if (age >= 80) score += 4;

  const survivalTable: Record<number, number> = {
    0: 98, 1: 96, 2: 90, 3: 77, 4: 53, 5: 21, 6: 21, 7: 12, 8: 12,
  };
  const clampedScore = Math.min(score, 8);

  return {
    index: score,
    ten_year_survival_pct: survivalTable[clampedScore] ?? 5,
  };
}

// ── Body System Mapper ────────────────────────────────────────────────────────

type SystemStatus = "normal" | "abnormal" | "critical" | "unknown";

function determineStatus(findings: string[], criticalCount: number): SystemStatus {
  if (criticalCount > 0) return "critical";
  if (findings.length > 0) return "abnormal";
  return "normal";
}

export function mapBodySystems(intake: IntakeFormData): BodySystem[] {
  const systems: BodySystem[] = [];

  const allConditions = [
    intake.diagnosis.primary_condition,
    ...intake.diagnosis.secondary_conditions,
  ].map((c) => c.toLowerCase());

  const labMap = new Map(intake.labs.map((l) => [l.name.toLowerCase(), l]));

  const getLabByKeyword = (keyword: string) => {
    for (const [key, lab] of labMap.entries()) {
      if (key.includes(keyword)) return lab;
    }
    return null;
  };

  const isLabAbnormal = (labName: string): boolean => {
    const lab = getLabByKeyword(labName);
    if (!lab) return false;
    if (lab.reference_low !== undefined && lab.value < lab.reference_low) return true;
    if (lab.reference_high !== undefined && lab.value > lab.reference_high) return true;
    return false;
  };

  const isLabCritical = (labName: string): boolean => {
    const lab = getLabByKeyword(labName);
    if (!lab) return false;
    if (lab.reference_low !== undefined && lab.value < lab.reference_low * 0.7) return true;
    if (lab.reference_high !== undefined && lab.value > lab.reference_high * 1.5) return true;
    return false;
  };

  // Cardiovascular
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    if (allConditions.some((c) => c.includes("heart") || c.includes("cardiac") || c.includes("coronary") || c.includes("hypertension") || c.includes("atrial") || c.includes("arrhythmia"))) {
      findings.push("Cardiovascular condition in history");
    }

    const { systolic_bp, diastolic_bp, heart_rate } = intake.vitals;
    if (systolic_bp && diastolic_bp) {
      if (systolic_bp >= 180 || diastolic_bp >= 120) { criticalCount++; findings.push(`Hypertensive crisis: ${systolic_bp}/${diastolic_bp} mmHg`); }
      else if (systolic_bp >= 140 || diastolic_bp >= 90) { findings.push(`Hypertension: ${systolic_bp}/${diastolic_bp} mmHg`); }
      else if (systolic_bp < 90) { criticalCount++; findings.push(`Hypotension: ${systolic_bp}/${diastolic_bp} mmHg`); }
    }
    if (heart_rate) {
      if (heart_rate > 120 || heart_rate < 40) { criticalCount++; findings.push(`Abnormal heart rate: ${heart_rate} bpm`); }
      else if (heart_rate > 100 || heart_rate < 55) { findings.push(`Heart rate outside normal: ${heart_rate} bpm`); }
    }
    if (isLabAbnormal("cholesterol") || isLabAbnormal("ldl") || isLabAbnormal("triglyceride")) {
      findings.push("Dyslipidemia noted in labs"); relevantLabs.push("Cholesterol/Lipid Panel");
    }
    if (isLabCritical("troponin") || isLabCritical("bnp") || isLabCritical("nt-probnp")) {
      criticalCount++; findings.push("Critical cardiac biomarkers elevated"); relevantLabs.push("Cardiac Biomarkers");
    }

    systems.push({ system: "Cardiovascular", status: determineStatus(findings, criticalCount), findings, relevant_labs: relevantLabs });
  }

  // Pulmonary
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    if (allConditions.some((c) => c.includes("copd") || c.includes("asthma") || c.includes("lung") || c.includes("pulmonary") || c.includes("emphysema") || c.includes("pneumonia") || c.includes("bronchitis") || c.includes("fibrosis"))) {
      findings.push("Pulmonary condition in history");
    }

    const { spo2_percent, respiratory_rate } = intake.vitals;
    if (spo2_percent) {
      if (spo2_percent < 90) { criticalCount++; findings.push(`Critical oxygen saturation: ${spo2_percent}%`); }
      else if (spo2_percent < 94) { findings.push(`Low oxygen saturation: ${spo2_percent}%`); }
    }
    if (respiratory_rate) {
      if (respiratory_rate > 30 || respiratory_rate < 8) { criticalCount++; findings.push(`Abnormal respiratory rate: ${respiratory_rate}/min`); }
      else if (respiratory_rate > 20 || respiratory_rate < 12) { findings.push(`Respiratory rate outside normal: ${respiratory_rate}/min`); }
    }
    if (intake.lifestyle.smoking_status === "current") findings.push("Active smoker - pulmonary risk elevated");

    systems.push({ system: "Pulmonary", status: determineStatus(findings, criticalCount), findings, relevant_labs: relevantLabs });
  }

  // Renal
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    if (allConditions.some((c) => c.includes("kidney") || c.includes("renal") || c.includes("ckd") || c.includes("nephropathy"))) {
      findings.push("Renal condition in history");
    }
    if (isLabCritical("creatinine")) { criticalCount++; findings.push("Critically elevated creatinine"); relevantLabs.push("Creatinine"); }
    else if (isLabAbnormal("creatinine")) { findings.push("Elevated creatinine"); relevantLabs.push("Creatinine"); }
    if (isLabCritical("bun") || isLabCritical("urea")) { criticalCount++; findings.push("Critically elevated BUN"); relevantLabs.push("BUN"); }
    else if (isLabAbnormal("bun") || isLabAbnormal("urea")) { findings.push("Elevated BUN"); relevantLabs.push("BUN"); }
    if (isLabAbnormal("gfr") || isLabAbnormal("egfr")) {
      const gfr = getLabByKeyword("gfr") || getLabByKeyword("egfr");
      if (gfr && gfr.value < 30) { criticalCount++; findings.push(`Severely reduced GFR: ${gfr.value}`); }
      else { findings.push("Reduced GFR noted"); }
      relevantLabs.push("eGFR");
    }

    systems.push({ system: "Renal", status: determineStatus(findings, criticalCount), findings, relevant_labs: relevantLabs });
  }

  // Hepatic
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    if (allConditions.some((c) => c.includes("liver") || c.includes("hepatic") || c.includes("hepatitis") || c.includes("cirrhosis") || c.includes("cholangitis"))) {
      findings.push("Hepatic condition in history");
    }
    for (const labKey of ["alt", "ast", "alp", "bilirubin", "albumin"]) {
      if (isLabCritical(labKey)) { criticalCount++; findings.push(`Critical ${labKey.toUpperCase()} value`); relevantLabs.push(labKey.toUpperCase()); }
      else if (isLabAbnormal(labKey)) { findings.push(`Abnormal ${labKey.toUpperCase()}`); relevantLabs.push(labKey.toUpperCase()); }
    }
    if (intake.lifestyle.alcohol_use === "heavy") findings.push("Heavy alcohol use - hepatic risk");

    systems.push({ system: "Hepatic", status: determineStatus(findings, criticalCount), findings, relevant_labs: relevantLabs });
  }

  // Endocrine/Metabolic
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    if (allConditions.some((c) => c.includes("diabetes") || c.includes("thyroid") || c.includes("metabolic") || c.includes("adrenal") || c.includes("insulin") || c.includes("obesity"))) {
      findings.push("Endocrine/metabolic condition in history");
    }
    if (isLabCritical("glucose")) { criticalCount++; findings.push("Critical blood glucose"); relevantLabs.push("Blood Glucose"); }
    else if (isLabAbnormal("glucose")) { findings.push("Abnormal blood glucose"); relevantLabs.push("Blood Glucose"); }
    if (isLabAbnormal("hba1c") || isLabAbnormal("hemoglobin a1c")) { findings.push("Abnormal HbA1c"); relevantLabs.push("HbA1c"); }
    if (isLabAbnormal("tsh") || isLabAbnormal("t3") || isLabAbnormal("t4")) { findings.push("Thyroid function abnormality"); relevantLabs.push("Thyroid Panel"); }

    const bmi = intake.demographics.weight_kg / Math.pow(intake.demographics.height_cm / 100, 2);
    if (bmi >= 35) { findings.push(`Severe obesity (BMI: ${bmi.toFixed(1)})`); if (bmi >= 40) criticalCount++; }
    else if (bmi >= 30) { findings.push(`Obesity (BMI: ${bmi.toFixed(1)})`); }

    systems.push({ system: "Endocrine/Metabolic", status: determineStatus(findings, criticalCount), findings, relevant_labs: relevantLabs });
  }

  // Hematologic
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    if (allConditions.some((c) => c.includes("anemia") || c.includes("leukemia") || c.includes("lymphoma") || c.includes("myeloma") || c.includes("thrombocytopenia") || c.includes("coagulation"))) {
      findings.push("Hematologic condition in history");
    }
    for (const labKey of ["hemoglobin", "hematocrit", "wbc", "platelet", "inr", "pt", "ptt"]) {
      if (isLabCritical(labKey)) { criticalCount++; findings.push(`Critical ${labKey.toUpperCase()}`); relevantLabs.push(labKey.toUpperCase()); }
      else if (isLabAbnormal(labKey)) { findings.push(`Abnormal ${labKey.toUpperCase()}`); relevantLabs.push(labKey.toUpperCase()); }
    }

    systems.push({ system: "Hematologic", status: determineStatus(findings, criticalCount), findings, relevant_labs: relevantLabs });
  }

  // Oncologic
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    const hasOncologicCondition = allConditions.some((c) =>
      c.includes("cancer") || c.includes("tumor") || c.includes("carcinoma") ||
      c.includes("sarcoma") || c.includes("melanoma") || c.includes("lymphoma") ||
      c.includes("leukemia") || c.includes("malignant") || c.includes("neoplasm")
    );

    if (hasOncologicCondition) {
      const stage = intake.diagnosis.stage || "";
      if (stage.toLowerCase().includes("iv") || stage.toLowerCase().includes("4") || stage.toLowerCase().includes("metastatic")) {
        criticalCount++; findings.push(`Metastatic/Stage IV malignancy: ${intake.diagnosis.primary_condition}`);
      } else if (stage) {
        findings.push(`${intake.diagnosis.primary_condition} - Stage ${stage}`);
      } else {
        findings.push(`Active malignancy: ${intake.diagnosis.primary_condition}`);
      }
    }

    for (const markerKey of ["psa", "cea", "ca-125", "ca125", "afp", "ca 19-9"]) {
      if (isLabAbnormal(markerKey)) {
        findings.push(`Elevated tumor marker: ${markerKey.toUpperCase()}`);
        relevantLabs.push(markerKey.toUpperCase());
        if (isLabCritical(markerKey)) criticalCount++;
      }
    }

    systems.push({
      system: "Oncologic",
      status: hasOncologicCondition ? determineStatus(findings, criticalCount) : "unknown",
      findings,
      relevant_labs: relevantLabs,
    });
  }

  // Neurological
  {
    const findings: string[] = [];
    const relevantLabs: string[] = [];
    let criticalCount = 0;

    const hasNeuroCondition = allConditions.some((c) =>
      c.includes("neurolog") || c.includes("seizure") || c.includes("epilepsy") ||
      c.includes("parkinsons") || c.includes("multiple sclerosis") || c.includes("neuropathy") ||
      c.includes("dementia") || c.includes("stroke") || c.includes("cerebrovascular")
    );

    if (hasNeuroCondition) {
      findings.push("Neurological condition in history");
      if (allConditions.some((c) => c.includes("stroke") || c.includes("cerebrovascular"))) criticalCount++;
    }

    systems.push({ system: "Neurological", status: determineStatus(findings, criticalCount), findings, relevant_labs: relevantLabs });
  }

  return systems;
}
