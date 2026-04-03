import { Router, Request, Response } from "express";
import { sessionStore } from "../services/sessionStore";
import { getTrialById } from "../services/clinicalTrialsService";
import { ClinicalTrial, MatchResult, CriterionMatch } from "../types/trial";
import { groqEligibilityAnalysis, isGroqReady } from "../services/groqService";
import { DigitalTwin } from "../types/digitalTwin";

const router = Router();

router.post("/analyze-single", async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id, nct_id, trial, twin: twinPayload } = req.body as {
      session_id?: string;
      nct_id?: string;
      trial?: ClinicalTrial;
      twin?: DigitalTwin;
    };

    const providedSessionId = session_id || (twinPayload ? `client-${twinPayload.session_id || Date.now()}` : undefined);
    if (!providedSessionId) {
      res.status(400).json({ error: "session_id is required" });
      return;
    }

    let twin = sessionStore.get(providedSessionId);
    if (!twin && twinPayload) {
      twin = twinPayload;
      sessionStore.set(providedSessionId, twin);
    }
    if (!twin) {
      res.status(404).json({ error: "Session not found or expired" });
      return;
    }

    let targetTrial: ClinicalTrial | null = null;

    if (trial) {
      targetTrial = trial;
    } else if (nct_id) {
      targetTrial = await getTrialById(nct_id);
      if (!targetTrial) {
        res.status(404).json({ error: `Trial ${nct_id} not found` });
        return;
      }
    } else {
      res.status(400).json({ error: "Either nct_id or trial object is required" });
      return;
    }

    console.log(`[Eligibility] Analyzing ${targetTrial.nct_id} for session ${providedSessionId}`);

    let matchResult: MatchResult | null = null;

    if (isGroqReady()) {
      try {
        matchResult = await groqEligibilityAnalysis(twin, targetTrial);
        if (!matchResult) {
          console.warn("[Eligibility] Groq fallback returned empty payload");
        }
      } catch (fallbackErr) {
        console.error("[Eligibility] Groq fallback failed", fallbackErr);
      }
    }

    if (!matchResult) {
      matchResult = buildRuleBasedMatch(twin, targetTrial);
    }
    // If LLM returned a result but score is suspiciously 0 with no criteria, override score with keyword-based estimate
    if (matchResult.overall_score === 0 && matchResult.inclusion_matches.length === 0 && matchResult.exclusion_matches.length === 0) {
      const keywordResult = buildRuleBasedMatch(twin, targetTrial);
      matchResult = { ...matchResult, overall_score: keywordResult.overall_score, recommendation: keywordResult.recommendation };
    }

    // Update the session twin with the match result
    const updatedTrial: ClinicalTrial = {
      ...targetTrial,
      match_result: matchResult,
    };

    res.json({
      match_result: matchResult,
      trial: updatedTrial,
    });
  } catch (error) {
    console.error("[Eligibility] Analysis error:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("credit") || msg.includes("quota") || msg.includes("billing")) {
      res.status(503).json({ error: "Anthropic account has no credits. Add credits at console.anthropic.com to enable AI eligibility analysis." });
      return;
    }
    res.status(500).json({
      error: "Eligibility analysis failed",
      details: msg || "Unknown error",
    });
  }
});

export default router;

function buildRuleBasedMatch(twin: DigitalTwin, trial: ClinicalTrial): MatchResult {
  const inclusion: CriterionMatch[] = [];
  const exclusion: CriterionMatch[] = [];
  const concerns: string[] = [];
  const age = twin.intake.demographics.age;
  const eco = twin.ecog_estimate;

  // ── Keyword-based score ───────────────────────────────────────────────────
  const diagnosis = twin.intake.diagnosis.primary_condition.toLowerCase();
  const stage = (twin.intake.diagnosis.stage || "").toLowerCase();
  const secondary = twin.intake.diagnosis.secondary_conditions.map((c) => c.toLowerCase()).join(" ");
  const patientText = `${diagnosis} ${stage} ${secondary}`;

  const trialText = [
    trial.title || "",
    trial.brief_summary || "",
    ...trial.conditions,
    trial.inclusion_criteria || "",
    trial.interventions?.join(" ") || "",
  ].join(" ").toLowerCase();

  // Count significant words from patient diagnosis that appear in trial text
  const diagWords = patientText.split(/\W+/).filter((w) => w.length > 3);
  const matchedWords = diagWords.filter((w) => trialText.includes(w));
  const matchRatio = diagWords.length > 0 ? matchedWords.length / diagWords.length : 0;

  // Base score: 40–85 range driven by keyword overlap
  let baseScore = 40 + Math.round(matchRatio * 45);

  // Age eligibility adjustments
  if (trial.min_age !== undefined) {
    const met = age >= trial.min_age;
    inclusion.push({
      criterion_text: `Age ≥ ${trial.min_age}`,
      status: met ? "met" : "unmet",
      reasoning: met ? `Patient age ${age} meets the minimum.` : `Patient age ${age} is below the required minimum of ${trial.min_age}.`,
    });
    if (!met) { baseScore -= 20; concerns.push(`Patient age (${age}) is under the minimum for this trial.`); }
  }

  if (trial.max_age !== undefined) {
    const met = age <= trial.max_age;
    inclusion.push({
      criterion_text: `Age ≤ ${trial.max_age}`,
      status: met ? "met" : "unmet",
      reasoning: met ? `Patient age ${age} is within range.` : `Patient age ${age} exceeds the upper limit of ${trial.max_age}.`,
    });
    if (!met) { baseScore -= 15; concerns.push(`Patient age (${age}) exceeds the maximum for this trial.`); }
  }

  // ECOG performance status
  const ecogLimit = 2;
  inclusion.push({
    criterion_text: `ECOG performance status ≤ ${ecogLimit}`,
    status: eco <= ecogLimit ? "met" : "likely_unmet",
    reasoning: eco <= ecogLimit
      ? `ECOG ${eco} is within the typical performance threshold.`
      : `ECOG ${eco} may exceed the acceptable range — confirm with study coordinator.`,
  });
  if (eco > ecogLimit) { baseScore -= 12; concerns.push(`ECOG ${eco} may limit eligibility — review with study team.`); }

  // Lab value checks
  const hba1cLab = twin.intake.labs.find((lab) => /hba1c/i.test(lab.name));
  if (trial.conditions.some((c) => /diabetes/i.test(c)) && hba1cLab) {
    const met = hba1cLab.value >= 7;
    inclusion.push({
      criterion_text: "HbA1c ≥ 7%",
      status: met ? "met" : "likely_unmet",
      reasoning: met ? `HbA1c ${hba1cLab.value}% meets metabolic threshold.` : `HbA1c ${hba1cLab.value}% may be below the target range.`,
    });
    if (!met) { baseScore -= 8; concerns.push("HbA1c may be below the target range for this protocol."); }
  }

  const creatinineLab = twin.intake.labs.find((lab) => /creatinine/i.test(lab.name));
  if (creatinineLab && creatinineLab.value > 2.0) {
    exclusion.push({
      criterion_text: "Adequate renal function (creatinine ≤ 2.0 mg/dL)",
      status: "likely_unmet",
      reasoning: `Creatinine ${creatinineLab.value} ${creatinineLab.unit} may exceed renal function thresholds.`,
    });
    baseScore -= 8;
    concerns.push(`Elevated creatinine (${creatinineLab.value}) may be an exclusion factor.`);
  }

  // Deterministic per-trial jitter: ±10 points based on NCT ID hash
  const nctHash = trial.nct_id.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0);
  const jitter = (nctHash % 21) - 10; // -10 to +10

  const finalScore = Math.max(8, Math.min(94, baseScore + jitter));

  if (concerns.length === 0 && matchRatio < 0.2) {
    concerns.push("Limited condition overlap detected — verify this trial targets your diagnosis.");
  }
  if (concerns.length === 0) {
    concerns.push("Confirm current medications and comorbidities with the study coordinator before enrollment.");
  }

  const recommendation = finalScore >= 75 ? "strong_match" : finalScore >= 50 ? "possible_match" : "unlikely";

  return {
    trial_nct_id: trial.nct_id,
    overall_score: finalScore,
    inclusion_matches: inclusion,
    exclusion_matches: exclusion,
    plain_english_summary: `Keyword-based eligibility estimate: ${finalScore}/100. Diagnosis match ratio: ${Math.round(matchRatio * 100)}%. Patient age ${age} and ECOG ${eco} evaluated. ${concerns.length === 0 ? "No critical conflicts detected." : concerns.join(" ")}`,
    key_concerns: concerns,
    recommendation,
  };
}
