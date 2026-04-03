import { Router, Request, Response } from "express";
import { sessionStore } from "../services/sessionStore";
import { buildDigitalTwin } from "../services/digitalTwinBuilder";
import { IntakeFormData } from "../types/intake";

const router = Router();

router.get("/:sessionId", (req: Request, res: Response): void => {
  const sessionIdParam = req.params.sessionId;
  const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const twin = sessionStore.get(sessionId);
  if (!twin) {
    res.status(404).json({ error: "Session not found or expired" });
    return;
  }

  res.json(twin);
});

router.put("/:sessionId/scenario", (req: Request, res: Response): void => {
  try {
    const sessionIdParam = req.params.sessionId;
    const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;

    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    const existingTwin = sessionStore.get(sessionId);
    if (!existingTwin) {
      res.status(404).json({ error: "Session not found or expired" });
      return;
    }

    const scenarioOverrides = req.body as Partial<IntakeFormData["lifestyle"]> & {
      weight_kg?: number;
    };

    // Apply scenario overrides to the existing intake data
    const modifiedIntake: IntakeFormData = {
      ...existingTwin.intake,
      lifestyle: {
        ...existingTwin.intake.lifestyle,
        ...(scenarioOverrides.smoking_status !== undefined && { smoking_status: scenarioOverrides.smoking_status }),
        ...(scenarioOverrides.alcohol_use !== undefined && { alcohol_use: scenarioOverrides.alcohol_use }),
        ...(scenarioOverrides.physical_activity !== undefined && { physical_activity: scenarioOverrides.physical_activity }),
        ...(scenarioOverrides.diet_quality !== undefined && { diet_quality: scenarioOverrides.diet_quality }),
      },
      demographics: {
        ...existingTwin.intake.demographics,
        ...(scenarioOverrides.weight_kg !== undefined && { weight_kg: scenarioOverrides.weight_kg }),
      },
    };

    // Rebuild twin with modified data
    const updatedTwin = buildDigitalTwin(modifiedIntake, sessionId);

    // Preserve original creation timestamp
    updatedTwin.created_at = existingTwin.created_at;

    sessionStore.set(sessionId, updatedTwin);

    res.json(updatedTwin);
  } catch (error) {
    console.error("[Twin] Scenario update error:", error);
    res.status(500).json({
      error: "Failed to apply scenario",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
