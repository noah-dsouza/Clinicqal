import { IntakeFormData } from "../types/intake";

/**
 * Estimates ECOG Performance Status (0-4) from intake data.
 * 0 = Fully active, 1 = Restricted strenuous activity, 2 = Ambulatory >50% of day,
 * 3 = Confined to bed/chair >50% of day, 4 = Completely disabled.
 */
export function estimateECOG(intake: IntakeFormData): 0 | 1 | 2 | 3 | 4 {
  let score = 0;

  // Physical activity is the primary driver
  const activity = intake.lifestyle.physical_activity;
  if (activity === "sedentary") score += 2;
  else if (activity === "light") score += 1;
  else if (activity === "moderate") score += 0;
  else if (activity === "active") score += 0;

  // Smoking significantly impacts functional status
  if (intake.lifestyle.smoking_status === "current") score += 1;

  // Heavy alcohol use
  if (intake.lifestyle.alcohol_use === "heavy") score += 1;

  // Check vitals for indicators of poor functional status
  const vitals = intake.vitals;
  if (vitals.spo2_percent && vitals.spo2_percent < 92) score += 2;
  else if (vitals.spo2_percent && vitals.spo2_percent < 95) score += 1;

  if (vitals.systolic_bp && vitals.systolic_bp < 90) score += 1;
  if (vitals.heart_rate && vitals.heart_rate > 110) score += 1;

  // Check for lab abnormalities suggesting poor status
  const criticalLabs = intake.labs.filter((lab) => {
    if (!lab.reference_low && !lab.reference_high) return false;
    const tooLow = lab.reference_low !== undefined && lab.value < lab.reference_low * 0.7;
    const tooHigh = lab.reference_high !== undefined && lab.value > lab.reference_high * 1.5;
    return tooLow || tooHigh;
  });
  if (criticalLabs.length >= 3) score += 1;

  // Age factor
  if (intake.demographics.age > 75) score += 1;

  // Clamp to 0-4
  if (score <= 0) return 0;
  if (score === 1) return 1;
  if (score === 2) return 2;
  if (score === 3) return 3;
  return 4;
}
