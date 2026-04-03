import { streamText, stepCountIs } from "ai";
import type { ModelMessage } from "@ai-sdk/provider-utils";
import { cliniqModel } from "@/lib/ai/provider";
import { allTools } from "@/lib/ai/tools";
import { CHAT_SYSTEM_PROMPT, buildPatientSummary } from "@/lib/ai/prompts";
import { DigitalTwin } from "@/lib/digital-twin/schema";

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, twin } = body as {
    messages: { role: string; content: string }[];
    twin?: DigitalTwin;
  };

  // Augment the system prompt with the patient's profile summary if available
  const systemPrompt = twin
    ? `${CHAT_SYSTEM_PROMPT}\n\n## Current Patient Profile\n\n${buildPatientSummary(twin)}`
    : CHAT_SYSTEM_PROMPT;

  const result = streamText({
    model: cliniqModel,
    system: systemPrompt,
    messages: messages as ModelMessage[],
    tools: allTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
