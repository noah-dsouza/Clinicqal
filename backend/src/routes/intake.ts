import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { IntakeFormData } from "../types/intake";
import { buildDigitalTwin } from "../services/digitalTwinBuilder";
import { sessionStore } from "../services/sessionStore";

const router = Router();

router.post("/submit", async (req: Request, res: Response): Promise<void> => {
  try {
    const intake = req.body as IntakeFormData;

    // Basic validation
    if (intake?.demographics?.age == null || !intake?.diagnosis?.primary_condition) {
      res.status(400).json({
        error: "Invalid intake data: demographics.age and diagnosis.primary_condition are required",
      });
      return;
    }

    if (intake.demographics.age < 0 || intake.demographics.age > 150) {
      res.status(400).json({ error: "Invalid age value" });
      return;
    }

    const sessionId = uuidv4();
    const twin = buildDigitalTwin(intake, sessionId);

    sessionStore.set(sessionId, twin);

    console.log(`[Intake] Session created: ${sessionId} for condition: ${intake.diagnosis.primary_condition}`);

    res.status(201).json({
      session_id: sessionId,
      twin,
    });
  } catch (error) {
    console.error("[Intake] Error processing intake:", error);
    res.status(500).json({
      error: "Failed to process intake form",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
