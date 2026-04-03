import { IntakeFormData } from "../types/intake";
import { DigitalTwin } from "../types/digitalTwin";
import { ClinicalTrial, MatchResult } from "../types/trial";

const BASE_URL = "";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ── Intake ────────────────────────────────────────────────────────────────────
export interface IntakeSubmitResponse {
  session_id: string;
  twin: DigitalTwin;
}

export async function submitIntake(data: IntakeFormData): Promise<IntakeSubmitResponse> {
  return fetchJson<IntakeSubmitResponse>("/api/intake/submit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Digital Twin ─────────────────────────────────────────────────────────────
export async function getDigitalTwin(sessionId: string): Promise<DigitalTwin> {
  return fetchJson<DigitalTwin>(`/api/twin/${sessionId}`);
}

export interface ScenarioPayload {
  smoking_status?: "never" | "former" | "current";
  alcohol_use?: "none" | "moderate" | "heavy";
  physical_activity?: "sedentary" | "light" | "moderate" | "active";
  diet_quality?: "poor" | "average" | "good";
  weight_kg?: number;
}

export async function applyScenario(
  sessionId: string,
  scenario: ScenarioPayload
): Promise<DigitalTwin> {
  return fetchJson<DigitalTwin>(`/api/twin/${sessionId}/scenario`, {
    method: "PUT",
    body: JSON.stringify(scenario),
  });
}

// ── Trials ────────────────────────────────────────────────────────────────────
export interface TrialSearchResponse {
  condition: string;
  total: number;
  trials: ClinicalTrial[];
}

export async function searchTrials(
  sessionId: string,
  condition?: string,
  pageSize = 20
): Promise<TrialSearchResponse> {
  const params = new URLSearchParams({ session_id: sessionId, page_size: String(pageSize) });
  if (condition) params.append("condition", condition);
  return fetchJson<TrialSearchResponse>(`/api/trials/search?${params.toString()}`);
}

// ── Eligibility ───────────────────────────────────────────────────────────────
export interface EligibilityAnalysisResponse {
  match_result: MatchResult;
  trial: ClinicalTrial;
}

export async function analyzeEligibility(
  sessionId: string,
  trial: ClinicalTrial
): Promise<EligibilityAnalysisResponse> {
  return fetchJson<EligibilityAnalysisResponse>("/api/eligibility/analyze-single", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, trial }),
  });
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatResponse {
  reply: string;
}

export async function sendChatMessage(message: string, twin?: DigitalTwin | null): Promise<ChatResponse> {
  return fetchJson<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, twin }),
  });
}
