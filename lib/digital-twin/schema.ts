import { z } from "zod";

// ── TypeScript Interfaces ────────────────────────────────────────────────────

export interface IntakeFormData {
  demographics: {
    age: number;
    sex: "male" | "female" | "other";
    ethnicity: string;
    weight_kg: number;
    height_cm: number;
    zip_code: string;
  };
  diagnosis: {
    primary_condition: string;
    icd10_code?: string;
    stage?: string;
    diagnosis_date?: string;
    secondary_conditions: string[];
  };
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
  }>;
  labs: Array<{
    name: string;
    value: number;
    unit: string;
    reference_low?: number;
    reference_high?: number;
    date?: string;
  }>;
  vitals: {
    systolic_bp?: number;
    diastolic_bp?: number;
    heart_rate?: number;
    temperature_c?: number;
    spo2_percent?: number;
    respiratory_rate?: number;
  };
  lifestyle: {
    smoking_status: "never" | "former" | "current";
    alcohol_use: "none" | "moderate" | "heavy";
    physical_activity: "sedentary" | "light" | "moderate" | "active";
    diet_quality: "poor" | "average" | "good";
  };
}

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

// ── Zod Schemas for Runtime Validation ──────────────────────────────────────

export const IntakeFormDataSchema = z.object({
  demographics: z.object({
    age: z.number().min(0).max(120).describe("Patient age in years"),
    sex: z.enum(["male", "female", "other"]).describe("Biological sex"),
    ethnicity: z.string().describe("Patient ethnicity"),
    weight_kg: z.number().min(0).describe("Weight in kilograms"),
    height_cm: z.number().min(0).describe("Height in centimeters"),
    zip_code: z.string().describe("ZIP or postal code for trial location matching"),
  }),
  diagnosis: z.object({
    primary_condition: z.string().describe("Primary diagnosis or condition name"),
    icd10_code: z.string().optional().describe("ICD-10 code if known"),
    stage: z.string().optional().describe("Disease stage or grade if applicable"),
    diagnosis_date: z.string().optional().describe("Date of diagnosis (ISO format)"),
    secondary_conditions: z.array(z.string()).describe("List of comorbidities"),
  }),
  medications: z.array(
    z.object({
      name: z.string().describe("Medication name"),
      dosage: z.string().optional().describe("Dosage e.g. 10mg"),
      frequency: z.string().optional().describe("Frequency e.g. once daily"),
    })
  ).describe("Current medications"),
  labs: z.array(
    z.object({
      name: z.string().describe("Lab test name"),
      value: z.number().describe("Numeric result value"),
      unit: z.string().describe("Unit of measurement"),
      reference_low: z.number().optional().describe("Lower reference range"),
      reference_high: z.number().optional().describe("Upper reference range"),
      date: z.string().optional().describe("Date of test"),
    })
  ).describe("Recent lab results"),
  vitals: z.object({
    systolic_bp: z.number().optional().describe("Systolic blood pressure mmHg"),
    diastolic_bp: z.number().optional().describe("Diastolic blood pressure mmHg"),
    heart_rate: z.number().optional().describe("Heart rate bpm"),
    temperature_c: z.number().optional().describe("Body temperature Celsius"),
    spo2_percent: z.number().optional().describe("Oxygen saturation percentage"),
    respiratory_rate: z.number().optional().describe("Respiratory rate breaths/min"),
  }).describe("Current vital signs"),
  lifestyle: z.object({
    smoking_status: z.enum(["never", "former", "current"]).describe("Smoking history"),
    alcohol_use: z.enum(["none", "moderate", "heavy"]).describe("Alcohol consumption level"),
    physical_activity: z
      .enum(["sedentary", "light", "moderate", "active"])
      .describe("Physical activity level"),
    diet_quality: z.enum(["poor", "average", "good"]).describe("Overall diet quality"),
  }).describe("Lifestyle factors"),
});

// ── Default Values ───────────────────────────────────────────────────────────

export const defaultIntakeFormData: IntakeFormData = {
  demographics: {
    age: 0,
    sex: "male",
    ethnicity: "",
    weight_kg: 0,
    height_cm: 0,
    zip_code: "",
  },
  diagnosis: {
    primary_condition: "",
    icd10_code: "",
    stage: "",
    diagnosis_date: "",
    secondary_conditions: [],
  },
  medications: [],
  labs: [],
  vitals: {},
  lifestyle: {
    smoking_status: "never",
    alcohol_use: "none",
    physical_activity: "moderate",
    diet_quality: "average",
  },
};
