import { IntakeFormData } from "./intake";

export interface BodySystem {
  system: string;
  status: "normal" | "abnormal" | "critical" | "unknown";
  findings: string[];
  relevant_labs: string[];
}

export interface HealthScore {
  overall: number;
  cardiovascular: number;
  metabolic: number;
  functional: number;
  breakdown_notes: string;
}

export interface DigitalTwin {
  session_id: string;
  created_at: string;
  intake: IntakeFormData;
  health_score: HealthScore;
  ecog_estimate: 0 | 1 | 2 | 3 | 4;
  charlson_index: number;
  charlson_10yr_survival_pct: number;
  body_systems: BodySystem[];
  bmi: number;
  primary_icd10: string;
  active_medication_names: string[];
}
