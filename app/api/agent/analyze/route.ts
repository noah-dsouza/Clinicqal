import { streamText, stepCountIs } from "ai";
import type { ModelMessage } from "@ai-sdk/provider-utils";
import { cliniqModel } from "@/lib/ai/provider";
import { allTools } from "@/lib/ai/tools";
import { ANALYSIS_SYSTEM_PROMPT, buildPatientSummary } from "@/lib/ai/prompts";
import { DigitalTwin } from "@/lib/digital-twin/schema";

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, twin } = body as { messages: { role: string; content: string }[]; twin: DigitalTwin };

  // Build patient summary and inject as first user message if no messages yet
  const patientContext = twin ? buildPatientSummary(twin) : "";
  const messagesWithContext =
    messages?.length > 0
      ? messages
      : [
          {
            role: "user" as const,
            content: `Analyze the following patient profile and find matching clinical trials across all registries. Evaluate eligibility for each match and explain results in plain English.\n\n${patientContext}`,
          },
        ];

  const result = streamText({
    model: cliniqModel,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: messagesWithContext as ModelMessage[],
    tools: allTools,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
