import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { DigitalTwin } from "../types/digitalTwin";

const router = Router();

function buildSystemPrompt(twin: DigitalTwin | null): string {
  if (!twin) {
    return "You are ClinIQ, a helpful health assistant. Answer health questions concisely and clearly. Always recommend consulting a healthcare provider for medical decisions.";
  }

  const { intake, health_score, body_systems, bmi, ecog_estimate, charlson_index, active_medication_names } = twin;

  return `You are ClinIQ, a personalized health assistant for a specific patient. Here is their full health profile:

PATIENT PROFILE:
- Age: ${intake.demographics.age}, Sex: ${intake.demographics.sex}
- BMI: ${bmi.toFixed(1)}, Weight: ${intake.demographics.weight_kg}kg, Height: ${intake.demographics.height_cm}cm

DIAGNOSIS:
- Primary: ${intake.diagnosis.primary_condition}${intake.diagnosis.icd10_code ? ` (${intake.diagnosis.icd10_code})` : ""}${intake.diagnosis.stage ? `, Stage: ${intake.diagnosis.stage}` : ""}
- Comorbidities: ${intake.diagnosis.secondary_conditions.join(", ") || "None"}

HEALTH SCORES:
- Overall: ${health_score.overall}/100
- Cardiovascular: ${health_score.cardiovascular}/100
- Metabolic: ${health_score.metabolic}/100
- Functional: ${health_score.functional}/100
- ECOG Status: ${ecog_estimate}/4
- Charlson Comorbidity Index: ${charlson_index}

MEDICATIONS: ${active_medication_names.join(", ") || "None"}

LAB RESULTS:
${intake.labs.map((l) => `- ${l.name}: ${l.value} ${l.unit}${l.reference_low != null && l.reference_high != null ? ` (ref: ${l.reference_low}–${l.reference_high})` : ""}`).join("\n") || "None recorded"}

VITAL SIGNS:
${intake.vitals.systolic_bp ? `- BP: ${intake.vitals.systolic_bp}/${intake.vitals.diastolic_bp} mmHg` : ""}
${intake.vitals.heart_rate ? `- Heart Rate: ${intake.vitals.heart_rate} bpm` : ""}
${intake.vitals.spo2_percent ? `- SpO2: ${intake.vitals.spo2_percent}%` : ""}
${intake.vitals.temperature_c ? `- Temperature: ${intake.vitals.temperature_c}°C` : ""}
${intake.vitals.respiratory_rate ? `- Respiratory Rate: ${intake.vitals.respiratory_rate}/min` : ""}

LIFESTYLE: Smoking: ${intake.lifestyle.smoking_status}, Alcohol: ${intake.lifestyle.alcohol_use}, Activity: ${intake.lifestyle.physical_activity}, Diet: ${intake.lifestyle.diet_quality}

BODY SYSTEMS: ${body_systems.map((s) => `${s.system} (${s.status})`).join(", ") || "None assessed"}

Answer questions about this patient's specific health data concisely and helpfully. Reference their actual numbers. Always add a brief disclaimer to consult their healthcare provider for medical decisions. Keep responses under 150 words unless the question genuinely requires more detail.`;
}

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { message, twin } = req.body as { message: string; twin?: DigitalTwin };

  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    // Rule-based fallback when no API key
    const reply = getRuleBasedReply(message, twin ?? null);
    res.json({ reply });
    return;
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: buildSystemPrompt(twin ?? null),
      messages: [{ role: "user", content: message }],
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "I couldn't generate a response.";
    res.json({ reply });
  } catch (err) {
    console.error("[Chat Error]", err);
    res.status(500).json({ error: "Failed to generate response" });
  }
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

  return `I can answer questions about your health score (${twin.health_score.overall}/100), lab results, medications, BMI, or clinical trial eligibility. What would you like to know? Note: add your Anthropic API key to .env for full AI responses.`;
}

export default router;
