import { DigitalTwin } from "../types/digitalTwin";
import { formatPatientSummary } from "./patientSummary";

let lastContextSignature: string | null = null;

interface BotpressOptions {
  question?: string;
  twin?: DigitalTwin | null;
  forceContext?: boolean;
}

export function openBotpressChat(options?: BotpressOptions): void {
  if (typeof window === "undefined") return;

  const widget = window.botpressWebChat;
  if (!widget) {
    console.warn("[Botpress] Webchat is not loaded yet.");
    return;
  }

  widget.open();

  const summary = options?.twin ? `Patient context: ${formatPatientSummary(options.twin)}` : null;
  const signature = summary ? `${summary}` : null;

  if (summary && typeof widget.sendEvent === "function") {
    if (options?.forceContext || signature !== lastContextSignature) {
      widget.sendEvent({
        type: "proactive-trigger",
        payload: { text: summary },
      });
      lastContextSignature = signature;
    }
  }

  const trimmedQuestion = options?.question?.trim();
  if (trimmedQuestion && typeof widget.sendEvent === "function") {
    widget.sendEvent({
      type: "proactive-trigger",
      payload: { text: trimmedQuestion },
    });
  }
}
