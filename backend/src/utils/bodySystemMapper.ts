import { IntakeFormData } from "../types/intake";
import { BodySystem } from "../types/digitalTwin";

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

  // ── Cardiovascular System ─────────────────────────────────────────────────
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    const hasCardioCondition = allConditions.some((c) =>
      c.includes("heart") || c.includes("cardiac") || c.includes("coronary") ||
      c.includes("hypertension") || c.includes("atrial") || c.includes("arrhythmia")
    );
    if (hasCardioCondition) findings.push("Cardiovascular condition in history");

    const { systolic_bp, diastolic_bp, heart_rate } = intake.vitals;
    if (systolic_bp && diastolic_bp) {
      if (systolic_bp >= 180 || diastolic_bp >= 120) {
        criticalCount++;
        findings.push(`Hypertensive crisis: ${systolic_bp}/${diastolic_bp} mmHg`);
      } else if (systolic_bp >= 140 || diastolic_bp >= 90) {
        findings.push(`Hypertension: ${systolic_bp}/${diastolic_bp} mmHg`);
      } else if (systolic_bp < 90) {
        criticalCount++;
        findings.push(`Hypotension: ${systolic_bp}/${diastolic_bp} mmHg`);
      }
    }

    if (heart_rate) {
      if (heart_rate > 120 || heart_rate < 40) {
        criticalCount++;
        findings.push(`Abnormal heart rate: ${heart_rate} bpm`);
      } else if (heart_rate > 100 || heart_rate < 55) {
        findings.push(`Heart rate outside normal: ${heart_rate} bpm`);
      }
    }

    if (isLabAbnormal("cholesterol") || isLabAbnormal("ldl") || isLabAbnormal("triglyceride")) {
      findings.push("Dyslipidemia noted in labs");
      relevantLabs.push("Cholesterol/Lipid Panel");
    }
    if (isLabCritical("troponin") || isLabCritical("bnp") || isLabCritical("nt-probnp")) {
      criticalCount++;
      findings.push("Critical cardiac biomarkers elevated");
      relevantLabs.push("Cardiac Biomarkers");
    }

    systems.push({
      system: "Cardiovascular",
      status: determineStatus(findings, criticalCount),
      findings,
      relevant_labs: relevantLabs,
    });
  }

  // ── Pulmonary System ──────────────────────────────────────────────────────
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    const hasPulmonaryCondition = allConditions.some((c) =>
      c.includes("copd") || c.includes("asthma") || c.includes("lung") ||
      c.includes("pulmonary") || c.includes("emphysema") || c.includes("pneumonia") ||
      c.includes("bronchitis") || c.includes("fibrosis")
    );
    if (hasPulmonaryCondition) findings.push("Pulmonary condition in history");

    const { spo2_percent, respiratory_rate } = intake.vitals;
    if (spo2_percent) {
      if (spo2_percent < 90) {
        criticalCount++;
        findings.push(`Critical oxygen saturation: ${spo2_percent}%`);
      } else if (spo2_percent < 94) {
        findings.push(`Low oxygen saturation: ${spo2_percent}%`);
      }
    }

    if (respiratory_rate) {
      if (respiratory_rate > 30 || respiratory_rate < 8) {
        criticalCount++;
        findings.push(`Abnormal respiratory rate: ${respiratory_rate}/min`);
      } else if (respiratory_rate > 20 || respiratory_rate < 12) {
        findings.push(`Respiratory rate outside normal: ${respiratory_rate}/min`);
      }
    }

    if (intake.lifestyle.smoking_status === "current") {
      findings.push("Active smoker - pulmonary risk elevated");
    }

    systems.push({
      system: "Pulmonary",
      status: determineStatus(findings, criticalCount),
      findings,
      relevant_labs: relevantLabs,
    });
  }

  // ── Renal System ──────────────────────────────────────────────────────────
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    const hasRenalCondition = allConditions.some((c) =>
      c.includes("kidney") || c.includes("renal") || c.includes("ckd") || c.includes("nephropathy")
    );
    if (hasRenalCondition) findings.push("Renal condition in history");

    if (isLabCritical("creatinine")) {
      criticalCount++;
      findings.push("Critically elevated creatinine");
      relevantLabs.push("Creatinine");
    } else if (isLabAbnormal("creatinine")) {
      findings.push("Elevated creatinine");
      relevantLabs.push("Creatinine");
    }

    if (isLabCritical("bun") || isLabCritical("urea")) {
      criticalCount++;
      findings.push("Critically elevated BUN");
      relevantLabs.push("BUN");
    } else if (isLabAbnormal("bun") || isLabAbnormal("urea")) {
      findings.push("Elevated BUN");
      relevantLabs.push("BUN");
    }

    if (isLabAbnormal("gfr") || isLabAbnormal("egfr")) {
      const gfr = getLabByKeyword("gfr") || getLabByKeyword("egfr");
      if (gfr && gfr.value < 30) {
        criticalCount++;
        findings.push(`Severely reduced GFR: ${gfr.value}`);
      } else {
        findings.push("Reduced GFR noted");
      }
      relevantLabs.push("eGFR");
    }

    systems.push({
      system: "Renal",
      status: determineStatus(findings, criticalCount),
      findings,
      relevant_labs: relevantLabs,
    });
  }

  // ── Hepatic System ────────────────────────────────────────────────────────
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    const hasHepaticCondition = allConditions.some((c) =>
      c.includes("liver") || c.includes("hepatic") || c.includes("hepatitis") ||
      c.includes("cirrhosis") || c.includes("cholangitis")
    );
    if (hasHepaticCondition) findings.push("Hepatic condition in history");

    for (const labKey of ["alt", "ast", "alp", "bilirubin", "albumin"]) {
      if (isLabCritical(labKey)) {
        criticalCount++;
        findings.push(`Critical ${labKey.toUpperCase()} value`);
        relevantLabs.push(labKey.toUpperCase());
      } else if (isLabAbnormal(labKey)) {
        findings.push(`Abnormal ${labKey.toUpperCase()}`);
        relevantLabs.push(labKey.toUpperCase());
      }
    }

    if (intake.lifestyle.alcohol_use === "heavy") {
      findings.push("Heavy alcohol use - hepatic risk");
    }

    systems.push({
      system: "Hepatic",
      status: determineStatus(findings, criticalCount),
      findings,
      relevant_labs: relevantLabs,
    });
  }

  // ── Endocrine/Metabolic System ────────────────────────────────────────────
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    const hasEndoCondition = allConditions.some((c) =>
      c.includes("diabetes") || c.includes("thyroid") || c.includes("metabolic") ||
      c.includes("adrenal") || c.includes("insulin") || c.includes("obesity")
    );
    if (hasEndoCondition) findings.push("Endocrine/metabolic condition in history");

    if (isLabCritical("glucose")) {
      criticalCount++;
      findings.push("Critical blood glucose");
      relevantLabs.push("Blood Glucose");
    } else if (isLabAbnormal("glucose")) {
      findings.push("Abnormal blood glucose");
      relevantLabs.push("Blood Glucose");
    }

    if (isLabAbnormal("hba1c") || isLabAbnormal("hemoglobin a1c")) {
      findings.push("Abnormal HbA1c");
      relevantLabs.push("HbA1c");
    }

    if (isLabAbnormal("tsh") || isLabAbnormal("t3") || isLabAbnormal("t4")) {
      findings.push("Thyroid function abnormality");
      relevantLabs.push("Thyroid Panel");
    }

    const bmi = intake.demographics.weight_kg / Math.pow(intake.demographics.height_cm / 100, 2);
    if (bmi >= 35) {
      findings.push(`Severe obesity (BMI: ${bmi.toFixed(1)})`);
      if (bmi >= 40) criticalCount++;
    } else if (bmi >= 30) {
      findings.push(`Obesity (BMI: ${bmi.toFixed(1)})`);
    }

    systems.push({
      system: "Endocrine/Metabolic",
      status: determineStatus(findings, criticalCount),
      findings,
      relevant_labs: relevantLabs,
    });
  }

  // ── Hematologic System ────────────────────────────────────────────────────
  {
    const findings: string[] = [];
    let criticalCount = 0;
    const relevantLabs: string[] = [];

    const hasHematoCondition = allConditions.some((c) =>
      c.includes("anemia") || c.includes("leukemia") || c.includes("lymphoma") ||
      c.includes("myeloma") || c.includes("thrombocytopenia") || c.includes("coagulation")
    );
    if (hasHematoCondition) findings.push("Hematologic condition in history");

    for (const labKey of ["hemoglobin", "hematocrit", "wbc", "platelet", "inr", "pt", "ptt"]) {
      if (isLabCritical(labKey)) {
        criticalCount++;
        findings.push(`Critical ${labKey.toUpperCase()}`);
        relevantLabs.push(labKey.toUpperCase());
      } else if (isLabAbnormal(labKey)) {
        findings.push(`Abnormal ${labKey.toUpperCase()}`);
        relevantLabs.push(labKey.toUpperCase());
      }
    }

    systems.push({
      system: "Hematologic",
      status: determineStatus(findings, criticalCount),
      findings,
      relevant_labs: relevantLabs,
    });
  }

  // ── Oncologic System ──────────────────────────────────────────────────────
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
        criticalCount++;
        findings.push(`Metastatic/Stage IV malignancy: ${intake.diagnosis.primary_condition}`);
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

  // ── Neurological System ───────────────────────────────────────────────────
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
      if (allConditions.some((c) => c.includes("stroke") || c.includes("cerebrovascular"))) {
        criticalCount++;
      }
    }

    systems.push({
      system: "Neurological",
      status: determineStatus(findings, criticalCount),
      findings,
      relevant_labs: relevantLabs,
    });
  }

  return systems;
}

function getLabByKeyword(labMap: Map<string, { name: string; value: number; unit: string; reference_low?: number; reference_high?: number }>, keyword: string) {
  for (const [key, lab] of labMap.entries()) {
    if (key.includes(keyword)) return lab;
  }
  return null;
}
