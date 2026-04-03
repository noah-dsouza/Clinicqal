import Groq from "groq-sdk";
import { jsonrepair } from "jsonrepair";
import { DigitalTwin } from "../types/digitalTwin";
import { ClinicalTrial, MatchResult, CriterionMatch } from "../types/trial";
import { DoctorResult } from "../types/doctor";

const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

interface DoctorPatientContext {
  age?: number;
  sex?: string;
  stage?: string;
}

let cachedClient: Groq | null = null;

function getClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) {
    cachedClient = new Groq({ apiKey });
  }
  return cachedClient;
}

function clampJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

function tryParseJson(candidate: string): any | null {
  try {
    return JSON.parse(candidate);
  } catch {
    try {
      const repaired = jsonrepair(candidate);
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}

function extractJson(text?: string): any | null {
  if (!text) return null;

  const trimmed = text.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = match ? match[1] : trimmed;

  const candidates = [clampJson(raw), clampJson(raw.replace(/\s+/g, " "))];
  for (const candidate of candidates) {
    const parsed = tryParseJson(candidate);
    if (parsed) return parsed;
  }

  console.error("[Groq] JSON parse failed after repair attempt");
  return null;
}

async function runStructuredPrompt<T>(systemPrompt: string, userPrompt: string, maxTokens = 1800): Promise<T | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: `${systemPrompt}\nALWAYS respond with strictly valid minified JSON and nothing else.` },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? undefined;
    return extractJson(text) as T | null;
  } catch (error) {
    console.error("[Groq] request failed", error);
    return null;
  }
}

export function isGroqReady(): boolean {
  return Boolean(getClient());
}

export async function groqDoctorFallback(
  condition: string,
  location: string,
  specialty: string,
  context?: DoctorPatientContext
): Promise<DoctorResult[] | null> {
  const contextDetails = [
    context?.age ? `age ${context.age}` : null,
    context?.sex ? `sex ${context.sex}` : null,
    context?.stage ? `disease stage ${context.stage}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const contextLine = contextDetails ? `Patient context: ${contextDetails}.` : "";

  const payload = await runStructuredPrompt<{ doctors: DoctorResult[] }>(
    "You generate structured provider data for healthcare navigation platforms.",
    `Create 4 local doctors treating ${condition} near ${location}. Focus on ${specialty} specialists and consider ${contextLine || "the patient's diagnosis"} when describing expertise or age considerations. Include realistic clinic names and detailed addresses. Schema:\n{
      "doctors": [
        {
          "id": "string",
          "name": "string",
          "specialty": "string",
          "address": "string",
          "phone": "string",
          "email": "string",
          "rating": number,
          "reviews": number,
          "website": "string",
          "accepting_patients": boolean,
          "distance": "string",
          "source": "groq_llm"
        }
      ]
    }`
  );

  return payload?.doctors ?? null;
}

export async function groqTrialFallback(condition: string, pageSize: number): Promise<ClinicalTrial[] | null> {
  const payload = await runStructuredPrompt<{ trials: Array<Partial<ClinicalTrial>> }>(
    "You invent realistic but clearly labeled clinical trial listings for prototyping.",
    `Generate up to ${Math.min(pageSize, 10)} clinical trials recruiting for ${condition} in the United States. Include sponsor, summary, inclusion/exclusion notes, at least one location, and set nct_id to GROQ followed by unique digits. Schema:\n{
      "trials": [
        {
          "nct_id": "string",
          "title": "string",
          "brief_summary": "string",
          "phase": "string",
          "status": "string",
          "sponsor": "string",
          "conditions": ["string"],
          "interventions": ["string"],
          "inclusion_criteria": "string",
          "exclusion_criteria": "string",
          "locations": [{ "facility": "string", "city": "string", "state": "string", "zip": "string" }],
          "min_age": number,
          "max_age": number,
          "accepts_healthy_volunteers": boolean,
          "contact_email": "string",
          "contact_phone": "string",
          "url": "string"
        }
      ]
    }`
  );

  if (!payload?.trials) return null;

  return payload.trials.map((trial, idx) => {
    const locations = (trial.locations && trial.locations.length > 0
      ? trial.locations
      : [{ facility: "ClinIQ Virtual Site", city: "Remote", state: "Virtual", zip: "00000" }]).map((loc) => ({
        facility: loc.facility || "ClinIQ Research Facility",
        city: loc.city || "Remote",
        state: loc.state || "Virtual",
        zip: loc.zip,
      }));

    return {
      nct_id: trial.nct_id || `GROQ-${Date.now()}-${idx}`,
      title: trial.title || `${condition} Investigational Study`,
      brief_summary: trial.brief_summary || "Prototype summary generated by Groq fallback.",
      phase: trial.phase || "Phase 2",
      status: trial.status || "Recruiting",
      sponsor: trial.sponsor || "ClinIQ Research Network",
      conditions: trial.conditions && trial.conditions.length > 0 ? trial.conditions : [condition],
      interventions: trial.interventions && trial.interventions.length > 0 ? trial.interventions : ["Drug: Investigational Therapy"],
      inclusion_criteria: trial.inclusion_criteria || "Inclusion criteria details provided during screening.",
      exclusion_criteria: trial.exclusion_criteria || "Key exclusion factors evaluated by investigator.",
      locations,
      min_age: trial.min_age ?? 18,
      max_age: trial.max_age ?? 85,
      accepts_healthy_volunteers: trial.accepts_healthy_volunteers ?? false,
      contact_email: trial.contact_email || "trials@cliniq.ai",
      contact_phone: trial.contact_phone || "(555) 123-9876",
      url: trial.url || "https://clinicaltrials.gov/",
    } satisfies ClinicalTrial;
  });
}

export async function groqEligibilityAnalysis(twin: DigitalTwin, trial: ClinicalTrial): Promise<MatchResult | null> {
  const payload = await runStructuredPrompt<MatchResult>(
    "You are a clinical research coordinator that outputs JSON eligibility assessments.",
    `Patient data:\n${JSON.stringify(twin)}\n\nTrial data:\n${JSON.stringify(trial)}\n\nReturn the eligibility analysis schema from ClinIQ with all required fields.`
  );

  if (!payload) return null;

  return {
    trial_nct_id: payload.trial_nct_id || trial.nct_id,
    overall_score:
      payload.overall_score !== undefined && payload.overall_score !== null
        ? Math.max(0, Math.min(100, payload.overall_score))
        : 0,
    inclusion_matches: (payload.inclusion_matches || []).map((m): CriterionMatch => ({
      criterion_text: m.criterion_text || "",
      status: m.status,
      reasoning: m.reasoning || "",
    })),
    exclusion_matches: (payload.exclusion_matches || []).map((m): CriterionMatch => ({
      criterion_text: m.criterion_text || "",
      status: m.status,
      reasoning: m.reasoning || "",
    })),
    plain_english_summary: payload.plain_english_summary || "",
    key_concerns: payload.key_concerns || [],
    recommendation: payload.recommendation || "possible_match",
  };
}

export async function groqChatReply(message: string, twin: DigitalTwin | null): Promise<string | null> {
  if (!message.trim()) return null;
  const payload = await runStructuredPrompt<{ reply: string }>(
    "You are ClinIQ, a concise health copilot. Respond in JSON with { \"reply\": string }.",
    `${twin ? `Patient context: ${JSON.stringify(twin)}\n` : ""}User question: ${message}`,
    800
  );
  return payload?.reply ?? null;
}
