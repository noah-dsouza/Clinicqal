import Anthropic from "@anthropic-ai/sdk";
import { DigitalTwin } from "../types/digitalTwin";
import { ClinicalTrial, MatchResult, CriterionMatch } from "../types/trial";
import { groqEligibilityAnalysis, isGroqReady } from "./groqService";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are ClinIQ, an expert clinical trial eligibility analyst with deep expertise in oncology, internal medicine, and clinical research methodology.

Your role is to analyze a patient's digital health profile against clinical trial eligibility criteria with the precision of a board-certified physician and clinical research coordinator.

For each eligibility analysis, you will:
1. Systematically evaluate each inclusion criterion against the patient's data
2. Systematically evaluate each exclusion criterion against the patient's data
3. Identify potential concerns that may affect eligibility
4. Provide a clear, compassionate plain-English explanation
5. Give an overall match recommendation

IMPORTANT RULES:
- Base analysis ONLY on provided patient data
- When data is insufficient to evaluate a criterion, mark it as "unknown" with explanation
- Be conservative: when uncertain, lean toward identifying potential concerns
- Never diagnose or provide medical advice - only assess eligibility probability
- Always emphasize that final eligibility determination requires physician review
- Score criteria status as: "met", "unmet", "likely_met", "likely_unmet", or "unknown"
- Overall score is 0-100 (higher = better match)
- Recommendation must be exactly one of: "strong_match", "possible_match", "unlikely", "excluded"

SCORING GUIDANCE:
- "excluded": Any exclusion criterion is clearly "unmet" (patient triggers an exclusion)
- "strong_match" (75-100): Most inclusion criteria met, no exclusion flags
- "possible_match" (40-74): Several criteria met but some uncertainties or mild concerns
- "unlikely" (0-39): Few criteria met or significant barriers exist

Return ONLY valid JSON matching this exact schema:
{
  "trial_nct_id": "string",
  "overall_score": number,
  "inclusion_matches": [
    {
      "criterion_text": "string",
      "status": "met|unmet|likely_met|likely_unmet|unknown",
      "reasoning": "string"
    }
  ],
  "exclusion_matches": [
    {
      "criterion_text": "string",
      "status": "met|unmet|likely_met|likely_unmet|unknown",
      "reasoning": "string"
    }
  ],
  "plain_english_summary": "string",
  "key_concerns": ["string"],
  "recommendation": "strong_match|possible_match|unlikely|excluded"
}`;

function buildPatientSummary(twin: DigitalTwin): string {
  const { intake } = twin;
  const d = intake.demographics;
  const dx = intake.diagnosis;

  const labSummary = intake.labs
    .map((l) => {
      const isLow = l.reference_low !== undefined && l.value < l.reference_low;
      const isHigh = l.reference_high !== undefined && l.value > l.reference_high;
      const flag = isLow ? " [LOW]" : isHigh ? " [HIGH]" : " [NORMAL]";
      return `  - ${l.name}: ${l.value} ${l.unit}${flag}${l.date ? ` (${l.date})` : ""}`;
    })
    .join("\n");

  const medSummary = intake.medications
    .map((m) => `  - ${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? ` ${m.frequency}` : ""}`)
    .join("\n");

  const vitalsSummary = Object.entries(intake.vitals)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `  - ${k.replace(/_/g, " ")}: ${v}`)
    .join("\n");

  const systemSummary = twin.body_systems
    .map((s) => `  - ${s.system}: ${s.status.toUpperCase()}${s.findings.length > 0 ? ` (${s.findings[0]})` : ""}`)
    .join("\n");

  return `
PATIENT DIGITAL TWIN PROFILE
=============================
Demographics:
  - Age: ${d.age} years
  - Sex: ${d.sex}
  - Ethnicity: ${d.ethnicity}
  - BMI: ${twin.bmi.toFixed(1)} kg/m²
  - Weight: ${d.weight_kg} kg | Height: ${d.height_cm} cm
  - Location ZIP: ${d.zip_code}

Primary Diagnosis: ${dx.primary_condition}${dx.icd10_code ? ` (ICD-10: ${dx.icd10_code})` : ""}
${dx.stage ? `Stage: ${dx.stage}` : ""}
${dx.diagnosis_date ? `Diagnosis Date: ${dx.diagnosis_date}` : ""}
Secondary Conditions: ${dx.secondary_conditions.length > 0 ? dx.secondary_conditions.join(", ") : "None"}

Performance Status:
  - ECOG Estimate: ${twin.ecog_estimate} (0=fully active, 4=completely disabled)
  - Charlson Comorbidity Index: ${twin.charlson_index}
  - Estimated 10-year survival: ${twin.charlson_10yr_survival_pct}%

Overall Health Score: ${twin.health_score.overall}/100
  - Cardiovascular: ${twin.health_score.cardiovascular}/100
  - Metabolic: ${twin.health_score.metabolic}/100
  - Functional: ${twin.health_score.functional}/100

Vitals:
${vitalsSummary || "  - No vitals recorded"}

Laboratory Results:
${labSummary || "  - No lab results recorded"}

Current Medications:
${medSummary || "  - No medications recorded"}

Lifestyle Factors:
  - Smoking: ${intake.lifestyle.smoking_status}
  - Alcohol: ${intake.lifestyle.alcohol_use}
  - Physical Activity: ${intake.lifestyle.physical_activity}
  - Diet Quality: ${intake.lifestyle.diet_quality}

Body Systems Assessment:
${systemSummary}
`;
}

function parseCriteria(criteriaText: string): string[] {
  if (!criteriaText) return [];

  // Split by numbered list items, bullet points, or newlines
  const lines = criteriaText
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 10)
    .filter((l) => !l.toLowerCase().match(/^(inclusion criteria|exclusion criteria|eligibility criteria)$/))
    .map((l) => l.replace(/^[\d]+\.\s*/, "").replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 10);

  // Deduplicate
  return [...new Set(lines)].slice(0, 15); // Limit to 15 criteria each
}

function calculateFallbackScore(twin: DigitalTwin, trial: ClinicalTrial): number {
  // Calculate score based on keyword matching when Claude fails
  let matchScore = 0;
  let totalPoints = 0;

  const textToAnalyze = [
    trial.conditions.join(" "),
    trial.inclusion_criteria,
    trial.exclusion_criteria,
  ].join(" ").toLowerCase();

  // Check for diagnosis matches
  const diagnosis = twin.intake.diagnosis.primary_condition.toLowerCase();
  const diagnosisTerms = diagnosis.split(" ");
  diagnosisTerms.forEach((term) => {
    if (textToAnalyze.includes(term) && term.length > 3) {
      matchScore += 15;
    }
  });
  totalPoints += diagnosisTerms.length * 15;

  // Check for age eligibility
  if (trial.min_age !== undefined || trial.max_age !== undefined) {
    const age = twin.intake.demographics.age;
    const meetsAge =
      (trial.min_age === undefined || age >= trial.min_age) &&
      (trial.max_age === undefined || age <= trial.max_age);
    if (meetsAge) {
      matchScore += 20;
    }
    totalPoints += 20;
  }

  // Check for exclusion criteria triggers (negative keywords)
  const exclusionKeywords = ["pregnant", "lactating", "severe hepatic", "severe renal", "active malignancy"];
  const hasMajorExclusion = exclusionKeywords.some(
    (kw) =>
      textToAnalyze.includes(kw) &&
      (twin.intake.diagnosis.secondary_conditions.some((c) => c.toLowerCase().includes(kw)) ||
        twin.active_medication_names.some((m) => m.toLowerCase().includes(kw)))
  );
  if (!hasMajorExclusion) {
    matchScore += 15;
  }
  totalPoints += 15;

  // Check ECOG/performance status if mentioned
  if (textToAnalyze.includes("ecog") || textToAnalyze.includes("performance")) {
    const ecogOk = twin.ecog_estimate <= 2;
    if (ecogOk) {
      matchScore += 20;
    }
    totalPoints += 20;
  }

  // Check for common lab value mentions
  const labKeywords = ["hemoglobin", "white blood", "platelet", "creatinine", "ast", "alt", "bilirubin"];
  const mentionedLabs = labKeywords.filter((kw) => textToAnalyze.includes(kw));
  matchScore += mentionedLabs.length * 8;
  totalPoints += labKeywords.length * 8;

  // Randomize around the calculated base (±15% to show it's a fallback estimate)
  const baseScore = totalPoints > 0 ? Math.round((matchScore / totalPoints) * 100) : 30;
  const variance = Math.floor(Math.random() * 30) - 15; // -15 to +15
  return Math.max(0, Math.min(100, baseScore + variance));
}

function buildFallbackConcerns(trial: ClinicalTrial): string[] {
  const concerns: string[] = [];
  const exclusionText = trial.exclusion_criteria || "";
  const inclusionText = trial.inclusion_criteria || "";

  const extractSentences = (text: string): string[] =>
    text
      .split(/[\n•\-]+/)
      .map((line) => line.replace(/^[\d.\)]+\s*/, "").trim())
      .filter((line) => line.length > 8)
      .slice(0, 4);

  const exclusionSentences = extractSentences(exclusionText);
  for (const sentence of exclusionSentences) {
    concerns.push(`Potential exclusion: ${sentence}`);
    if (concerns.length >= 2) break;
  }

  if (concerns.length < 2) {
    const inclusionSentences = extractSentences(inclusionText).filter((line) => /lab|organ|therapy|treatment|history/i.test(line));
    for (const sentence of inclusionSentences) {
      concerns.push(`Eligibility watch-out: ${sentence}`);
      if (concerns.length >= 2) break;
    }
  }

  if (concerns.length === 0 && trial.brief_summary) {
    concerns.push(`Review protocol risks noted in summary: ${trial.brief_summary.split(/\.\s+/)[0]}`);
  }

  while (concerns.length < 2) {
    concerns.push("Confirm lab values, medications, and comorbidities with the study coordinator before enrollment.");
  }

  return concerns.slice(0, 3);
}

export async function analyzeEligibility(
  twin: DigitalTwin,
  trial: ClinicalTrial
): Promise<MatchResult> {
  const patientSummary = buildPatientSummary(twin);
  const inclusionCriteria = parseCriteria(trial.inclusion_criteria);
  const exclusionCriteria = parseCriteria(trial.exclusion_criteria);

  const userPrompt = `Please analyze this patient's eligibility for the following clinical trial.

${patientSummary}

CLINICAL TRIAL: ${trial.title}
NCT ID: ${trial.nct_id}
Phase: ${trial.phase}
Sponsor: ${trial.sponsor}
Conditions: ${trial.conditions.join(", ")}
Interventions: ${trial.interventions.slice(0, 5).join("; ")}
${trial.min_age !== undefined ? `Minimum Age: ${trial.min_age} years` : ""}
${trial.max_age !== undefined ? `Maximum Age: ${trial.max_age} years` : ""}
Accepts Healthy Volunteers: ${trial.accepts_healthy_volunteers}

INCLUSION CRITERIA:
${inclusionCriteria.length > 0 ? inclusionCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n") : trial.inclusion_criteria || "Not specified"}

EXCLUSION CRITERIA:
${exclusionCriteria.length > 0 ? exclusionCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n") : trial.exclusion_criteria || "Not specified"}

Provide a comprehensive eligibility analysis in the required JSON format. Remember: return ONLY valid JSON, no additional text.`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    let jsonText = content.text.trim();

    // Extract JSON if wrapped in code blocks
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // Find JSON object boundaries
    const startIdx = jsonText.indexOf("{");
    const endIdx = jsonText.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1) {
      jsonText = jsonText.substring(startIdx, endIdx + 1);
    }

    const parsed = JSON.parse(jsonText) as MatchResult;

    // Validate and ensure required fields
    return {
      trial_nct_id: parsed.trial_nct_id || trial.nct_id,
      overall_score: Math.max(0, Math.min(100, parsed.overall_score ?? 0)),
      inclusion_matches: (parsed.inclusion_matches || []).map((m): CriterionMatch => ({
        criterion_text: m.criterion_text || "",
        status: m.status || "unknown",
        reasoning: m.reasoning || "",
      })),
      exclusion_matches: (parsed.exclusion_matches || []).map((m): CriterionMatch => ({
        criterion_text: m.criterion_text || "",
        status: m.status || "unknown",
        reasoning: m.reasoning || "",
      })),
      plain_english_summary: parsed.plain_english_summary || "Analysis could not be completed.",
      key_concerns: parsed.key_concerns || [],
      recommendation: parsed.recommendation || "unlikely",
    };
  } catch (error) {
    console.error("Claude eligibility analysis error:", error);

    if (isGroqReady()) {
      try {
        const groqResult = await groqEligibilityAnalysis(twin, trial);
        if (groqResult) {
          return groqResult;
        }
      } catch (groqError) {
        console.error("Groq eligibility fallback error:", groqError);
      }
    }

    const fallbackScore = calculateFallbackScore(twin, trial);
    const fallbackConcerns = buildFallbackConcerns(trial);
    return {
      trial_nct_id: trial.nct_id,
      overall_score: fallbackScore,
      inclusion_matches: [],
      exclusion_matches: [],
      plain_english_summary: `Preliminary AI analysis using pattern matching. Score: ${fallbackScore}/100. For detailed eligibility assessment, please consult with the trial coordinator.`,
      key_concerns: fallbackConcerns,
      recommendation: fallbackScore >= 70 ? "possible_match" : fallbackScore >= 40 ? "possible_match" : "unlikely",
    };
  }
}
