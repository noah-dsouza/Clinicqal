import { IntakeFormData } from "../types/intake";

interface CharlsonResult {
  index: number;
  ten_year_survival_pct: number;
}

/**
 * Estimates Charlson Comorbidity Index from diagnosis and intake data.
 * Maps conditions to weighted scores and computes 10-year survival.
 */
export function calculateCharlsonIndex(intake: IntakeFormData): CharlsonResult {
  let score = 0;

  const allConditions = [
    intake.diagnosis.primary_condition,
    ...intake.diagnosis.secondary_conditions,
  ].map((c) => c.toLowerCase());

  const icd10 = (intake.diagnosis.icd10_code || "").toUpperCase();

  // Helper to check if any condition matches keywords
  const hasCondition = (...keywords: string[]): boolean => {
    return keywords.some((kw) =>
      allConditions.some((c) => c.includes(kw.toLowerCase()))
    );
  };

  // Weight 1 conditions
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

  // Weight 2 conditions
  if (hasCondition("hemiplegia", "paraplegia")) score += 2;
  if (hasCondition("moderate renal", "severe renal", "chronic kidney", "renal failure", "ckd")) score += 2;
  if (hasCondition("diabetes") && hasCondition("end organ", "nephropathy", "retinopathy", "neuropathy")) score += 2;
  if (hasCondition("solid tumor") || (icd10.startsWith("C") && !icd10.startsWith("C77") && !icd10.startsWith("C78") && !icd10.startsWith("C79"))) {
    if (!hasCondition("metastatic", "stage iv", "stage 4")) score += 2;
  }
  if (hasCondition("leukemia", "lymphoma", "multiple myeloma")) score += 2;

  // Weight 3 conditions
  if (hasCondition("moderate liver", "severe liver", "portal hypertension", "esophageal varices")) score += 3;

  // Weight 6 conditions
  if (hasCondition("metastatic", "stage iv", "stage 4") || icd10.startsWith("C77") || icd10.startsWith("C78") || icd10.startsWith("C79")) score += 6;
  if (hasCondition("aids", "hiv") && hasCondition("opportunistic")) score += 6;

  // Age adjustment
  const age = intake.demographics.age;
  if (age >= 50 && age < 60) score += 1;
  else if (age >= 60 && age < 70) score += 2;
  else if (age >= 70 && age < 80) score += 3;
  else if (age >= 80) score += 4;

  // 10-year survival estimation based on CCI
  // Based on Charlson et al. validated survival tables
  const survivalTable: Record<number, number> = {
    0: 98,
    1: 96,
    2: 90,
    3: 77,
    4: 53,
    5: 21,
    6: 21,
    7: 12,
    8: 12,
  };

  const clampedScore = Math.min(score, 8);
  const tenYearSurvival = survivalTable[clampedScore] ?? 5;

  return {
    index: score,
    ten_year_survival_pct: tenYearSurvival,
  };
}
