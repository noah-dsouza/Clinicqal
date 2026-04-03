import { Router, Request, Response } from "express";
import { sessionStore } from "../services/sessionStore";
import { analyzeEligibility } from "../services/claudeService";
import { getTrialById, searchClinicalTrials } from "../services/clinicalTrialsService";
import { ClinicalTrial } from "../types/trial";

const router = Router();

router.post("/analyze-single", async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id, nct_id, trial } = req.body as {
      session_id: string;
      nct_id?: string;
      trial?: ClinicalTrial;
    };

    if (!session_id) {
      res.status(400).json({ error: "session_id is required" });
      return;
    }

    const twin = sessionStore.get(session_id);
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

    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(503).json({
        error: "Eligibility analysis is not available: ANTHROPIC_API_KEY not configured",
      });
      return;
    }

    console.log(`[Eligibility] Analyzing ${targetTrial.nct_id} for session ${session_id}`);

    const matchResult = await analyzeEligibility(twin, targetTrial);

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
