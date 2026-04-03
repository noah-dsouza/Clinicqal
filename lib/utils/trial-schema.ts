import { z } from "zod";

// ── TypeScript Interfaces ────────────────────────────────────────────────────

export interface TrialLocation {
  facility: string;
  city: string;
  state: string;
  zip?: string;
}

export interface CriterionMatch {
  criterion_text: string;
  status: "met" | "unmet" | "likely_met" | "likely_unmet" | "unknown";
  reasoning: string;
}

export interface MatchResult {
  trial_nct_id: string;
  overall_score: number;
  inclusion_matches: CriterionMatch[];
  exclusion_matches: CriterionMatch[];
  plain_english_summary: string;
  key_concerns: string[];
  recommendation: "strong_match" | "possible_match" | "unlikely" | "excluded";
}

export interface ClinicalTrial {
  nct_id: string;
  title: string;
  brief_summary: string;
  phase: string;
  status: string;
  sponsor: string;
  conditions: string[];
  interventions: string[];
  inclusion_criteria: string;
  exclusion_criteria: string;
  locations: TrialLocation[];
  min_age?: number;
  max_age?: number;
  accepts_healthy_volunteers: boolean;
  contact_email?: string;
  contact_phone?: string;
  url: string;
  source: "clinicaltrials.gov" | "who_ictrp" | "health_canada";
  match_result?: MatchResult;
}

// ── Zod Schemas ──────────────────────────────────────────────────────────────

export const CriterionMatchSchema = z.object({
  criterion_text: z.string().describe("The criterion text from the trial protocol"),
  status: z
    .enum(["met", "unmet", "likely_met", "likely_unmet", "unknown"])
    .describe("Assessment of whether the patient meets this criterion"),
  reasoning: z.string().describe("Explanation of why this status was assigned"),
});

export const MatchResultSchema = z.object({
  trial_nct_id: z.string().describe("NCT ID or registry ID of the trial"),
  overall_score: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall eligibility score 0-100, higher is better match"),
  inclusion_matches: z
    .array(CriterionMatchSchema)
    .describe("Assessment of each inclusion criterion"),
  exclusion_matches: z
    .array(CriterionMatchSchema)
    .describe("Assessment of each exclusion criterion"),
  plain_english_summary: z
    .string()
    .describe("Patient-friendly explanation of eligibility assessment"),
  key_concerns: z
    .array(z.string())
    .describe("List of key barriers or concerns about eligibility"),
  recommendation: z
    .enum(["strong_match", "possible_match", "unlikely", "excluded"])
    .describe("Overall recommendation category"),
});

export const ClinicalTrialSchema = z.object({
  nct_id: z.string(),
  title: z.string(),
  brief_summary: z.string(),
  phase: z.string(),
  status: z.string(),
  sponsor: z.string(),
  conditions: z.array(z.string()),
  interventions: z.array(z.string()),
  inclusion_criteria: z.string(),
  exclusion_criteria: z.string(),
  locations: z.array(
    z.object({
      facility: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string().optional(),
    })
  ),
  min_age: z.number().optional(),
  max_age: z.number().optional(),
  accepts_healthy_volunteers: z.boolean(),
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
  url: z.string(),
  source: z.enum(["clinicaltrials.gov", "who_ictrp", "health_canada"]),
  match_result: MatchResultSchema.optional(),
});
