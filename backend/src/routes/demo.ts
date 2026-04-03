import { Router, Request, Response } from "express";
import { buildDigitalTwin } from "../services/digitalTwinBuilder";
import { IntakeFormData } from "../types/intake";

const router = Router();

const DEMO_INTAKE: IntakeFormData = {
  demographics: {
    age: 58,
    sex: "male",
    ethnicity: "South Asian",
    weight_kg: 92,
    height_cm: 175,
    zip_code: "10001",
  },
  diagnosis: {
    primary_condition: "Type 2 Diabetes Mellitus",
    icd10_code: "E11.65",
    stage: "Moderate",
    diagnosis_date: "2019-03-14",
    secondary_conditions: [
      "Hypertension",
      "Dyslipidemia",
      "Mild Chronic Kidney Disease (Stage 2)",
    ],
  },
  medications: [
    { name: "Metformin", dosage: "1000mg", frequency: "Twice daily" },
    { name: "Lisinopril", dosage: "10mg", frequency: "Once daily" },
    { name: "Atorvastatin", dosage: "40mg", frequency: "Once daily at night" },
    { name: "Empagliflozin", dosage: "10mg", frequency: "Once daily" },
    { name: "Low-dose Aspirin", dosage: "81mg", frequency: "Once daily" },
  ],
  labs: [
    { name: "HbA1c", value: 8.1, unit: "%", reference_low: 4, reference_high: 5.7, date: "2026-03-15" },
    { name: "Fasting Glucose", value: 172, unit: "mg/dL", reference_low: 70, reference_high: 100, date: "2026-03-15" },
    { name: "LDL Cholesterol", value: 118, unit: "mg/dL", reference_low: 0, reference_high: 100, date: "2026-03-15" },
    { name: "HDL Cholesterol", value: 38, unit: "mg/dL", reference_low: 40, reference_high: 60, date: "2026-03-15" },
    { name: "Triglycerides", value: 218, unit: "mg/dL", reference_low: 0, reference_high: 150, date: "2026-03-15" },
    { name: "Creatinine", value: 1.3, unit: "mg/dL", reference_low: 0.7, reference_high: 1.2, date: "2026-03-15" },
    { name: "eGFR", value: 62, unit: "mL/min/1.73m²", reference_low: 90, reference_high: 120, date: "2026-03-15" },
    { name: "ALT", value: 34, unit: "U/L", reference_low: 7, reference_high: 40, date: "2026-03-15" },
    { name: "Hemoglobin", value: 13.4, unit: "g/dL", reference_low: 13.5, reference_high: 17.5, date: "2026-03-15" },
    { name: "WBC", value: 7.2, unit: "K/µL", reference_low: 4.5, reference_high: 11.0, date: "2026-03-15" },
    { name: "Platelet Count", value: 198, unit: "K/µL", reference_low: 150, reference_high: 400, date: "2026-03-15" },
    { name: "Sodium", value: 139, unit: "mEq/L", reference_low: 136, reference_high: 145, date: "2026-03-15" },
    { name: "Potassium", value: 4.2, unit: "mEq/L", reference_low: 3.5, reference_high: 5.0, date: "2026-03-15" },
    { name: "TSH", value: 2.1, unit: "mIU/L", reference_low: 0.4, reference_high: 4.0, date: "2026-03-15" },
    { name: "Albumin", value: 3.9, unit: "g/dL", reference_low: 3.5, reference_high: 5.0, date: "2026-03-15" },
    { name: "Urine Albumin/Creatinine", value: 48, unit: "mg/g", reference_low: 0, reference_high: 30, date: "2026-03-15" },
  ],
  vitals: {
    systolic_bp: 142,
    diastolic_bp: 88,
    heart_rate: 78,
    temperature_c: 36.8,
    spo2_percent: 97,
    respiratory_rate: 16,
  },
  lifestyle: {
    smoking_status: "former",
    alcohol_use: "moderate",
    physical_activity: "sedentary",
    diet_quality: "average",
  },
};

router.get("/patient", async (_req: Request, res: Response) => {
  try {
    const twin = await buildDigitalTwin(DEMO_INTAKE, "demo-session");
    res.json({ twin, session_id: "demo-session" });
  } catch (err) {
    console.error("[Demo Error]", err);
    res.status(500).json({ error: "Failed to build demo patient" });
  }
});

export default router;
