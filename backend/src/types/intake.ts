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
