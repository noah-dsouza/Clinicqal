import { Router, Request, Response } from "express";
import { sessionStore } from "../services/sessionStore";
import { analyzeEligibility } from "../services/claudeService";
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
    let primaryError: Error | null = null;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        matchResult = await analyzeEligibility(twin, targetTrial);
      } catch (err) {
        primaryError = err instanceof Error ? err : new Error("Unknown Anthropic error");
        console.warn("[Eligibility] Anthropic analysis failed, attempting fallback", primaryError);
      }
    } else {
      console.warn("[Eligibility] ANTHROPIC_API_KEY not configured — attempting Groq fallback");
    }

    if (!matchResult && isGroqReady()) {
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

  if (trial.min_age !== undefined) {
    const met = age >= trial.min_age;
    inclusion.push({
      criterion_text: `Age ≥ ${trial.min_age}`,
      status: met ? "met" : "unmet",
      reasoning: met ? `Patient age ${age} is within range.` : `Patient age ${age} is below required minimum.`,
    });
    if (!met) concerns.push(`Patient age (${age}) is under the minimum for this trial.`);
  }

  if (trial.max_age !== undefined) {
    const met = age <= trial.max_age;
    inclusion.push({
      criterion_text: `Age ≤ ${trial.max_age}`,
      status: met ? "met" : "unmet",
      reasoning: met ? `Patient age ${age} is within range.` : `Patient age ${age} exceeds the upper limit.`,
    });
    if (!met) concerns.push(`Patient age (${age}) exceeds the maximum for this trial.`);
  }

  const hba1cLab = twin.intake.labs.find((lab) => /hba1c/i.test(lab.name));
  if (trial.conditions.some((c) => /diabetes/i.test(c)) && hba1cLab) {
    const met = hba1cLab.value >= 7;
    inclusion.push({
      criterion_text: "HbA1c ≥ 7%",
      status: met ? "met" : "likely_unmet",
      reasoning: met ? `HbA1c ${hba1cLab.value}% meets the metabolic requirement.` : `HbA1c ${hba1cLab.value}% may be too low for enrollment.`,
    });
    if (!met) concerns.push("HbA1c may be below the target range for this protocol.");
  }

  const eco = twin.ecog_estimate;
  exclusion.push({
    criterion_text: "ECOG ≤ 2",
    status: eco <= 2 ? "met" : "unmet",
    reasoning: eco <= 2 ? `ECOG ${eco} suggests adequate performance status.` : `ECOG ${eco} exceeds the allowed limit.`,
  });
  if (eco > 2) concerns.push(`ECOG ${eco} usually excludes participation.`);

  const overallBase = 75;
  const penalties = concerns.length * 10;
  const inclusionPenalties = inclusion.filter((c) => c.status === "unmet").length * 12;
  const exclusionPenalties = exclusion.filter((c) => c.status === "unmet").length * 18;
  const overallScore = Math.max(5, Math.min(95, overallBase - penalties - inclusionPenalties - exclusionPenalties));

  const recommendation = overallScore >= 75 ? "strong_match" : overallScore >= 50 ? "possible_match" : "unlikely";
  const summaryParts = [
    `Patient age ${age} and ECOG ${eco} were evaluated against trial requirements.`,
    concerns.length === 0
      ? "No critical conflicts detected from available data."
      : `Key considerations: ${concerns.join("; ")}`,
  ];

  return {
    trial_nct_id: trial.nct_id,
    overall_score: overallScore,
    inclusion_matches: inclusion,
    exclusion_matches: exclusion,
    plain_english_summary: summaryParts.join(" "),
    key_concerns: concerns,
    recommendation,
  };
}
