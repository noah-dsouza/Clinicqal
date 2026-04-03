import { DigitalTwin } from "../types/digitalTwin";
import { formatPatientSummary } from "./patientSummary";

const PROACTIVE_EVENT = "proactive-trigger";
const MAX_CONTEXT_JSON_CHARS = 6000;
let lastContextSignature: string | null = null;

interface BotpressOptions {
  question?: string;
  twin?: DigitalTwin | null;
  forceContext?: boolean;
}

interface ContextPacket {
  summary: string;
  json: string;
  signature: string;
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return hash.toString(16);
}

function buildContextPacket(twin: DigitalTwin): ContextPacket {
  const summary = formatPatientSummary(twin);
  const structured = {
    sessionId: twin.session_id,
    diagnosis: twin.intake.diagnosis,
    demographics: twin.intake.demographics,
    vitals: twin.intake.vitals,
    labs: twin.intake.labs.slice(0, 6),
    medications: twin.active_medication_names.slice(0, 8),
    scores: twin.health_score,
    ecog: twin.ecog_estimate,
    lifestyle: twin.intake.lifestyle,
    body_systems: twin.body_systems.slice(0, 6),
  };
  const jsonString = JSON.stringify(structured);
  const trimmedJson =
    jsonString.length > MAX_CONTEXT_JSON_CHARS
      ? `${jsonString.slice(0, MAX_CONTEXT_JSON_CHARS)}...(truncated)`
      : jsonString;
  return {
    summary,
    json: trimmedJson,
    signature: hashString(jsonString),
  };
}

export function openBotpressChat(options?: BotpressOptions, attempt = 0): void {
  if (typeof window === "undefined") return;

  const widget = window.botpressWebChat;
  if (!widget) {
    if (attempt < 5) {
      setTimeout(() => openBotpressChat(options, attempt + 1), 250 * (attempt + 1));
    } else {
      console.warn("[Botpress] Webchat is not loaded yet.");
    }
    return;
  }

  widget.open();

  const contextPacket = options?.twin ? buildContextPacket(options.twin) : null;
  if (contextPacket && typeof widget.sendEvent === "function") {
    const needsSend = options?.forceContext || contextPacket.signature !== lastContextSignature;
    if (needsSend) {
      widget.sendEvent({
        type: PROACTIVE_EVENT,
        payload: {
          text: `PATIENT SUMMARY:\n${contextPacket.summary}`,
          metadata: { type: "patient_context", variant: "summary", sessionId: options?.twin?.session_id },
        },
      });
      widget.sendEvent({
        type: PROACTIVE_EVENT,
        payload: {
          text: `PATIENT_CONTEXT_JSON:\n${contextPacket.json}`,
          metadata: { type: "patient_context", variant: "json", sessionId: options?.twin?.session_id },
        },
      });
      lastContextSignature = contextPacket.signature;
    }
  }

  const trimmedQuestion = options?.question?.trim();
  if (trimmedQuestion && typeof widget.sendEvent === "function") {
    widget.sendEvent({
      type: PROACTIVE_EVENT,
      payload: {
        text: trimmedQuestion,
        metadata: { type: "patient_question", sessionId: options?.twin?.session_id },
      },
    });
  }
}
