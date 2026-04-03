import { v4 as uuidv4 } from "uuid";
import { IntakeFormData } from "../types/intake";
import { DigitalTwin } from "../types/digitalTwin";
import { estimateECOG } from "../utils/ecogEstimator";
import { calculateCharlsonIndex } from "../utils/charlsonIndex";
import { calculateHealthScore } from "../utils/healthScoreCalc";
import { mapBodySystems } from "../utils/bodySystemMapper";

export function buildDigitalTwin(intake: IntakeFormData, sessionId?: string): DigitalTwin {
  const id = sessionId || uuidv4();

  const bmi = parseFloat(
    (intake.demographics.weight_kg / Math.pow(intake.demographics.height_cm / 100, 2)).toFixed(1)
  );

  const charlson = calculateCharlsonIndex(intake);
  const healthScore = calculateHealthScore(intake);
  const ecogEstimate = estimateECOG(intake);
  const bodySystems = mapBodySystems(intake);

  const activeMedications = intake.medications
    .filter((m) => m.name && m.name.trim().length > 0)
    .map((m) => m.name.trim());

  const primaryIcd10 = intake.diagnosis.icd10_code || deriveIcd10(intake.diagnosis.primary_condition);

  return {
    session_id: id,
    created_at: new Date().toISOString(),
    intake,
    health_score: healthScore,
    ecog_estimate: ecogEstimate,
    charlson_index: charlson.index,
    charlson_10yr_survival_pct: charlson.ten_year_survival_pct,
    body_systems: bodySystems,
    bmi,
    primary_icd10: primaryIcd10,
    active_medication_names: activeMedications,
  };
}

function deriveIcd10(condition: string): string {
  const lower = condition.toLowerCase();

  const mappings: Array<[string[], string]> = [
    [["type 2 diabetes", "diabetes mellitus type 2", "t2dm"], "E11.9"],
    [["type 1 diabetes", "diabetes mellitus type 1", "t1dm"], "E10.9"],
    [["hypertension", "high blood pressure"], "I10"],
    [["heart failure", "chf", "congestive heart failure"], "I50.9"],
    [["atrial fibrillation", "afib", "a-fib"], "I48.91"],
    [["copd", "chronic obstructive pulmonary"], "J44.9"],
    [["asthma"], "J45.909"],
    [["breast cancer", "breast carcinoma"], "C50.919"],
    [["lung cancer", "lung carcinoma"], "C34.90"],
    [["colorectal cancer", "colon cancer", "rectal cancer"], "C18.9"],
    [["prostate cancer"], "C61"],
    [["lymphoma", "non-hodgkin"], "C85.90"],
    [["leukemia", "cll", "cml", "all", "aml"], "C95.90"],
    [["multiple myeloma"], "C90.00"],
    [["ckd", "chronic kidney disease", "renal failure"], "N18.9"],
    [["stroke", "cerebrovascular accident", "cva"], "I63.9"],
    [["depression", "major depressive"], "F32.9"],
    [["anxiety"], "F41.9"],
    [["rheumatoid arthritis"], "M06.9"],
    [["lupus", "sle"], "M32.9"],
    [["hypothyroidism", "underactive thyroid"], "E03.9"],
    [["hyperthyroidism", "graves"], "E05.90"],
    [["obesity"], "E66.9"],
    [["anemia"], "D64.9"],
    [["hepatitis c", "hcv"], "B18.2"],
    [["hepatitis b", "hbv"], "B18.1"],
    [["cirrhosis"], "K74.60"],
    [["parkinson", "parkinsons disease"], "G20"],
    [["alzheimer", "dementia"], "G30.9"],
    [["multiple sclerosis", "ms"], "G35"],
  ];

  for (const [keywords, code] of mappings) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return code;
    }
  }

  return "Z00.00"; // General health exam / unknown
}
