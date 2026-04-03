import axios from "axios";
import { ClinicalTrial, TrialLocation } from "../types/trial";
import { groqTrialFallback, isGroqReady } from "./groqService";

const CT_GOV_BASE = "https://clinicaltrials.gov/api/v2/studies";

interface CtGovStudy {
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
      officialTitle?: string;
    };
    statusModule: {
      overallStatus: string;
      startDateStruct?: { date: string };
    };
    descriptionModule?: {
      briefSummary?: string;
      detailedDescription?: string;
    };
    conditionsModule?: {
      conditions?: string[];
      keywords?: string[];
    };
    interventionsModule?: {
      interventions?: Array<{
        type: string;
        name: string;
        description?: string;
      }>;
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      healthyVolunteers?: boolean;
      sex?: string;
      minimumAge?: string;
      maximumAge?: string;
    };
    contactsLocationsModule?: {
      centralContacts?: Array<{
        name?: string;
        phone?: string;
        email?: string;
        role?: string;
      }>;
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
        status?: string;
        contacts?: Array<{
          name?: string;
          phone?: string;
          email?: string;
        }>;
      }>;
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: {
        name: string;
        class?: string;
      };
      collaborators?: Array<{ name: string }>;
    };
    designModule?: {
      phases?: string[];
      studyType?: string;
    };
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

  if (exclIndex === -1) {
    return { inclusion: eligibilityText, exclusion: "" };
  }

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
  const contactEmail = centralContact?.email;
  const contactPhone = centralContact?.phone;

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
    contact_email: contactEmail,
    contact_phone: contactPhone,
    url: `https://clinicaltrials.gov/study/${id.nctId}`,
  };
}

export async function searchClinicalTrials(
  condition: string,
  pageSize = 20
): Promise<ClinicalTrial[]> {
  try {
    const params = new URLSearchParams({
      "query.cond": condition,
      "filter.overallStatus": "RECRUITING",
      pageSize: String(pageSize),
      format: "json",
      fields: [
        "NCTId",
        "BriefTitle",
        "OfficialTitle",
        "OverallStatus",
        "BriefSummary",
        "Condition",
        "InterventionType",
        "InterventionName",
        "Phase",
        "EligibilityCriteria",
        "HealthyVolunteers",
        "MinimumAge",
        "MaximumAge",
        "LeadSponsorName",
        "LocationFacility",
        "LocationCity",
        "LocationState",
        "LocationZip",
        "CentralContactEMail",
        "CentralContactPhone",
      ].join(","),
    });

    const response = await axios.get<{ studies: CtGovStudy[]; totalCount: number }>(
      `${CT_GOV_BASE}?${params.toString()}`,
      {
        timeout: 15000,
        headers: {
          Accept: "application/json",
        },
      }
    );

    const studies = response.data?.studies || [];
    if (studies.length === 0) {
      const groqTrials = await getGroqTrials(condition, pageSize);
      if (groqTrials.length > 0) return groqTrials;
    }
    return studies.map(parseStudy);
  } catch (error) {
    console.error("ClinicalTrials.gov API error:", error);
    const groqTrials = await getGroqTrials(condition, pageSize);
    if (groqTrials.length > 0) return groqTrials;
    throw new Error(`Failed to fetch clinical trials: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function getTrialById(nctId: string): Promise<ClinicalTrial | null> {
  try {
    const response = await axios.get<{ studies: CtGovStudy[] }>(
      `${CT_GOV_BASE}?query.id=${nctId}&format=json`,
      {
        timeout: 10000,
        headers: { Accept: "application/json" },
      }
    );

    const studies = response.data?.studies || [];
    if (studies.length === 0) return null;
    return parseStudy(studies[0]);
  } catch (error) {
    console.error(`Error fetching trial ${nctId}:`, error);
    return null;
  }
}

async function getGroqTrials(condition: string, pageSize: number): Promise<ClinicalTrial[]> {
  if (!isGroqReady()) return [];
  try {
    const trials = await groqTrialFallback(condition, pageSize);
    return trials ?? [];
  } catch (err) {
    console.error("[Trials] Groq fallback failed", err);
    return [];
  }
}
