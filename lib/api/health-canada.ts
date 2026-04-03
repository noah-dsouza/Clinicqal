import { ClinicalTrial } from "@/lib/utils/trial-schema";

// Health Canada Clinical Trial Applications API
// Docs: https://health-products.canada.ca/api/documentation/cta-documentation-en.html
const HC_BASE = "https://health-products.canada.ca/api/clinical-trial";

interface HCTrialRecord {
  authorisation_no?: string;
  protocol_title?: string;
  therapeutic_area?: string;
  medical_condition?: string;
  drug_name?: string;
  authorization_status?: string;
  sponsor_name?: string;
  date_authorized?: string;
  date_submitted?: string;
  study_phase?: string;
  trial_type?: string;
  estimated_enrolment?: number;
  contact_name?: string;
  contact_email?: string;
}

function parseHCTrial(record: HCTrialRecord): ClinicalTrial {
  const id = record.authorisation_no || `HC-${Date.now()}`;
  return {
    nct_id: id,
    title: record.protocol_title || "Untitled Health Canada Trial",
    brief_summary: [
      record.therapeutic_area && `Therapeutic area: ${record.therapeutic_area}`,
      record.medical_condition && `Condition: ${record.medical_condition}`,
      record.drug_name && `Drug: ${record.drug_name}`,
    ]
      .filter(Boolean)
      .join(". ") || "Health Canada clinical trial authorization.",
    phase: record.study_phase || "N/A",
    status: record.authorization_status || "Unknown",
    sponsor: record.sponsor_name || "Unknown Sponsor",
    conditions: [
      record.medical_condition,
      record.therapeutic_area,
    ].filter((c): c is string => Boolean(c)),
    interventions: record.drug_name ? [`Drug: ${record.drug_name}`] : [],
    inclusion_criteria: "",
    exclusion_criteria: "",
    locations: [{ facility: "Health Canada Authorized Site", city: "Canada", state: "" }],
    accepts_healthy_volunteers: false,
    contact_email: record.contact_email,
    url: `https://health-products.canada.ca/ctdb-bdec/startRequest.do?lang=en`,
    source: "health_canada",
  };
}

export async function searchHealthCanada(
  condition: string,
  options: { status?: string } = {}
): Promise<ClinicalTrial[] | { error: string; source: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Health Canada CTA API — search by medical condition
    const params = new URLSearchParams({
      lang: "en",
      type: "json",
    });
    if (condition) params.set("medical_condition", condition);
    if (options.status) params.set("authorization_status", options.status);

    const response = await fetch(`${HC_BASE}/search?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Health Canada API sometimes returns 404 for valid searches with no results
      if (response.status === 404) return [];
      return { error: `Health Canada API returned HTTP ${response.status}`, source: "health_canada" };
    }

    const data: HCTrialRecord[] | { results?: HCTrialRecord[] } = await response.json();
    const records = Array.isArray(data) ? data : (data as { results?: HCTrialRecord[] }).results || [];

    return records.slice(0, 20).map(parseHCTrial);
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      error: `Health Canada request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      source: "health_canada",
    };
  }
}
