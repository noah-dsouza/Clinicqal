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
