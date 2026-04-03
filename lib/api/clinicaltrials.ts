import { ClinicalTrial, TrialLocation } from "@/lib/utils/trial-schema";

const CT_GOV_BASE = "https://clinicaltrials.gov/api/v2/studies";

interface CtGovStudy {
  protocolSection: {
    identificationModule: { nctId: string; briefTitle: string; officialTitle?: string };
    statusModule: { overallStatus: string; startDateStruct?: { date: string } };
    descriptionModule?: { briefSummary?: string; detailedDescription?: string };
    conditionsModule?: { conditions?: string[]; keywords?: string[] };
    interventionsModule?: { interventions?: Array<{ type: string; name: string; description?: string }> };
    eligibilityModule?: { eligibilityCriteria?: string; healthyVolunteers?: boolean; sex?: string; minimumAge?: string; maximumAge?: string };
    contactsLocationsModule?: {
      centralContacts?: Array<{ name?: string; phone?: string; email?: string; role?: string }>;
      locations?: Array<{ facility?: string; city?: string; state?: string; zip?: string; country?: string; status?: string; contacts?: Array<{ name?: string; phone?: string; email?: string }> }>;
    };
    sponsorCollaboratorsModule?: { leadSponsor?: { name: string; class?: string }; collaborators?: Array<{ name: string }> };
    designModule?: { phases?: string[]; studyType?: string };
  };
}

function parseAgeToYears(ageStr: string): number | undefined {
  if (!ageStr || ageStr === "N/A") return undefined;
  const lower = ageStr.toLowerCase();
  const num = parseFloat(ageStr);
  if (isNaN(num)) return undefined;
  if (lower.includes("year")) return num;
  if (lower.includes("month")) return Math.floor(num / 12);
  if (lower.includes("week")) return Math.floor(num / 52);
  if (lower.includes("day")) return Math.floor(num / 365);
  return num;
}

function splitCriteria(eligibilityText: string): { inclusion: string; exclusion: string } {
  if (!eligibilityText) return { inclusion: "", exclusion: "" };
  const lower = eligibilityText.toLowerCase();
  const exclIndex = lower.indexOf("exclusion criteria");
  if (exclIndex === -1) return { inclusion: eligibilityText, exclusion: "" };
  const inclEnd = eligibilityText.lastIndexOf("\n", exclIndex);
  const inclusion = eligibilityText.substring(0, inclEnd > 0 ? inclEnd : exclIndex).trim();
  const exclusion = eligibilityText.substring(exclIndex).trim();
  return { inclusion, exclusion };
}

function parseStudy(study: CtGovStudy): ClinicalTrial {
  const ps = study.protocolSection;
  const id = ps.identificationModule;
  const status = ps.statusModule;
  const desc = ps.descriptionModule;
  const cond = ps.conditionsModule;
  const interv = ps.interventionsModule;
  const elig = ps.eligibilityModule;
  const contacts = ps.contactsLocationsModule;
  const sponsor = ps.sponsorCollaboratorsModule;
  const design = ps.designModule;

  const eligText = elig?.eligibilityCriteria || "";
  const { inclusion, exclusion } = splitCriteria(eligText);

  const locations: TrialLocation[] = (contacts?.locations || [])
    .filter((loc) => loc.country === "United States" || !loc.country)
    .slice(0, 10)
    .map((loc) => ({
      facility: loc.facility || "Unknown Facility",
      city: loc.city || "",
      state: loc.state || "",
      zip: loc.zip,
    }));

  const centralContact = contacts?.centralContacts?.[0];
  const phases = design?.phases || [];
  const phase = phases.length > 0 ? phases.join("/") : "N/A";

  return {
    nct_id: id.nctId,
    title: id.briefTitle,
    brief_summary: desc?.briefSummary?.replace(/\n+/g, " ").trim() || "No summary available.",
    phase,
    status: status.overallStatus,
    sponsor: sponsor?.leadSponsor?.name || "Unknown Sponsor",
    conditions: cond?.conditions || [],
    interventions: (interv?.interventions || []).map((i) => `${i.type}: ${i.name}`),
    inclusion_criteria: inclusion,
    exclusion_criteria: exclusion,
    locations,
    min_age: parseAgeToYears(elig?.minimumAge || ""),
    max_age: parseAgeToYears(elig?.maximumAge || ""),
    accepts_healthy_volunteers: elig?.healthyVolunteers || false,
    contact_email: centralContact?.email,
    contact_phone: centralContact?.phone,
    url: `https://clinicaltrials.gov/study/${id.nctId}`,
    source: "clinicaltrials.gov",
  };
}

// Simple in-memory cache (5-min TTL)
const cache = new Map<string, { data: ClinicalTrial[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function searchClinicalTrials(
  condition: string,
  options: { location?: string; status?: string; phase?: string; pageSize?: number } = {}
): Promise<ClinicalTrial[] | { error: string; source: string }> {
  const cacheKey = `${condition}-${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const params = new URLSearchParams({
      "query.cond": condition,
      "filter.overallStatus": options.status || "RECRUITING",
      pageSize: String(options.pageSize ?? 20),
      format: "json",
    });
    if (options.location) params.set("query.locn", options.location);
    if (options.phase) params.set("filter.phase", options.phase);

    const response = await fetch(`${CT_GOV_BASE}?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { error: `ClinicalTrials.gov returned HTTP ${response.status}`, source: "clinicaltrials.gov" };
    }

    const data: { studies: CtGovStudy[]; totalCount: number } = await response.json();
    const trials = (data.studies || []).map(parseStudy);
    cache.set(cacheKey, { data: trials, ts: Date.now() });
    return trials;
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      error: `ClinicalTrials.gov request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      source: "clinicaltrials.gov",
    };
  }
}

export async function getTrialById(
  nctId: string
): Promise<ClinicalTrial | { error: string; source: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `${CT_GOV_BASE}?query.id=${nctId}&format=json`,
      { signal: controller.signal, headers: { Accept: "application/json" } }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { error: `ClinicalTrials.gov returned HTTP ${response.status}`, source: "clinicaltrials.gov" };
    }

    const data: { studies: CtGovStudy[] } = await response.json();
    if (!data.studies?.length) return { error: `Trial ${nctId} not found`, source: "clinicaltrials.gov" };
    return parseStudy(data.studies[0]);
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      error: `Failed to fetch trial ${nctId}: ${err instanceof Error ? err.message : "Unknown error"}`,
      source: "clinicaltrials.gov",
    };
  }
}
