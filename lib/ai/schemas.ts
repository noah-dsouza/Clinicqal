import { z } from "zod";

// ── Eligibility Score Schema ──────────────────────────────────────────────────

export const CriterionAssessmentSchema = z.object({
  criterion: z.string().describe("The exact criterion text from the trial protocol"),
  status: z
    .enum(["met", "not_met", "uncertain", "not_applicable"])
    .describe("Whether the patient meets this criterion"),
  reasoning: z
    .string()
    .describe("Brief explanation referencing specific patient data and the criterion text"),
});

export const TrialEligibilitySchema = z.object({
  nctId: z.string().describe("Trial NCT ID or registry identifier"),
  eligibilityScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall eligibility score 0-100, higher means better match"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Confidence level based on data completeness and criterion ambiguity"),
  recommendation: z
    .enum(["strong_match", "possible_match", "unlikely", "excluded"])
    .describe("Overall eligibility recommendation"),
  criteriaAssessments: z
    .array(CriterionAssessmentSchema)
    .describe("Per-criterion eligibility assessments"),
  key_concerns: z
    .array(z.string())
    .describe("List of key barriers or concerns about eligibility"),
  plain_english_summary: z
    .string()
    .describe("Patient-friendly explanation of the eligibility assessment"),
});

export const TrialScoresSchema = z.object({
  trials: z.array(TrialEligibilitySchema).describe("Eligibility scores for each trial"),
  analysis_timestamp: z
    .string()
    .describe("ISO timestamp when analysis was performed"),
});

export type TrialEligibility = z.infer<typeof TrialEligibilitySchema>;
export type TrialScores = z.infer<typeof TrialScoresSchema>;

// ── Reanalyze Schema ──────────────────────────────────────────────────────────

export const ScenarioImpactSchema = z.object({
  trial_id: z.string().describe("Trial NCT ID"),
  trial_title: z.string().describe("Trial title"),
  score_change: z
    .number()
    .describe("Change in eligibility score (positive = improvement, negative = decline)"),
  new_score: z.number().min(0).max(100).describe("Updated eligibility score after scenario"),
  impacted_criteria: z
    .array(z.string())
    .describe("List of criteria that changed status due to the scenario"),
  summary: z
    .string()
    .describe("Brief explanation of how the lifestyle scenario affects eligibility for this trial"),
});

export const ReanalyzeSchema = z.object({
  updated_health_score: z
    .number()
    .min(0)
    .max(100)
    .describe("Projected health score after scenario changes"),
  scenario_summary: z
    .string()
    .describe("Overall summary of how the scenario changes affect eligibility"),
  trial_impacts: z.array(ScenarioImpactSchema).describe("Per-trial impact of the scenario"),
});

export type ReanalyzeResult = z.infer<typeof ReanalyzeSchema>;
