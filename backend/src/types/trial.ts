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
  match_result?: MatchResult;
}
