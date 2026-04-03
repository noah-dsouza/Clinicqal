import { anthropic } from "@ai-sdk/anthropic";

// Claude Sonnet 4.6 — primary model for all ClinIQ agent calls
export const cliniqModel = anthropic("claude-sonnet-4-6-20250218");
