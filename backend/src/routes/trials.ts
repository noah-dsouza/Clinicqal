import { Router, Request, Response } from "express";
import { searchClinicalTrials } from "../services/clinicalTrialsService";
import { sessionStore } from "../services/sessionStore";

const router = Router();

router.get("/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const condition = req.query.condition as string;
    const sessionId = req.query.session_id as string;
    const pageSize = parseInt(req.query.page_size as string || "20", 10);

    let searchCondition = condition;

    if (!searchCondition && sessionId) {
      const twin = sessionStore.get(sessionId);
      if (twin) {
        searchCondition = twin.intake.diagnosis.primary_condition;
      }
    }

    if (!searchCondition) {
      res.status(400).json({
        error: "Either condition query parameter or a valid session_id is required",
      });
      return;
    }

    const clampedPageSize = Math.max(1, Math.min(50, pageSize));

    console.log(`[Trials] Searching for: "${searchCondition}" (pageSize=${clampedPageSize})`);

    const trials = await searchClinicalTrials(searchCondition, clampedPageSize);

    res.json({
      condition: searchCondition,
      total: trials.length,
      trials,
    });
  } catch (error) {
    console.error("[Trials] Search error:", error);
    res.status(500).json({
      error: "Failed to search clinical trials",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
