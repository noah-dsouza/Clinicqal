import { Router, Request, Response } from "express";
import { DigitalTwin } from "../types/digitalTwin";
import { groqChatReply, isGroqReady } from "../services/groqService";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { message, twin } = req.body as { message: string; twin?: DigitalTwin };

  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  console.log(`[Chat] isGroqReady=${isGroqReady()}, GROQ_API_KEY=${process.env.GROQ_API_KEY ? "set(" + process.env.GROQ_API_KEY.slice(0,8) + "...)" : "MISSING"}`);

  if (isGroqReady()) {
    try {
      const groqReply = await groqChatReply(message, twin ?? null);
      console.log(`[Chat] Groq reply: ${groqReply ? groqReply.slice(0, 80) : "null"}`);
      if (groqReply) {
        res.json({ reply: groqReply });
        return;
      }
    } catch (err) {
      console.error("[Chat] Groq failed", err);
    }
  }

  console.log("[Chat] Falling back to rule-based reply");
  res.json({ reply: getRuleBasedReply(message, twin ?? null) });
});

function getRuleBasedReply(message: string, twin: DigitalTwin | null): string {
  const lower = message.toLowerCase();

  if (!twin) return "I don't have your health data yet. Please complete the intake form or upload a health document first.";

  if (lower.includes("score") || lower.includes("health score")) {
    return `Your overall health score is ${twin.health_score.overall}/100. Cardiovascular: ${twin.health_score.cardiovascular}, Metabolic: ${twin.health_score.metabolic}, Functional: ${twin.health_score.functional}. ${twin.health_score.breakdown_notes || ""}`;
  }

  if (lower.includes("lab") || lower.includes("result") || lower.includes("blood")) {
    if (twin.intake.labs.length === 0) return "No lab results are recorded in your profile yet.";
    return `Your labs: ${twin.intake.labs.map((l) => `${l.name}: ${l.value} ${l.unit}`).join(", ")}. Please consult your doctor to interpret these results in clinical context.`;
  }

  if (lower.includes("med") || lower.includes("drug") || lower.includes("prescription")) {
    if (twin.active_medication_names.length === 0) return "No medications are recorded in your profile.";
    return `Your current medications: ${twin.active_medication_names.join(", ")}. Always consult your healthcare provider before making any changes to your medications.`;
  }

  if (lower.includes("trial") || lower.includes("clinical")) {
    return `Based on your condition (${twin.intake.diagnosis.primary_condition}), click the "Find Trials" button or go to the Clinical Trials tab to see AI-matched trials from ClinicalTrials.gov.`;
  }

  if (lower.includes("bmi") || lower.includes("weight")) {
    return `Your BMI is ${twin.bmi.toFixed(1)}. ${twin.bmi < 18.5 ? "This is underweight." : twin.bmi < 25 ? "This is in the normal range." : twin.bmi < 30 ? "This is overweight." : "This is in the obese range."} Consult your doctor for personalized guidance.`;
  }

  return `I can answer questions about your health score (${twin.health_score.overall}/100), lab results, medications, BMI, or clinical trial eligibility. What would you like to know?`;
}

export default router;
