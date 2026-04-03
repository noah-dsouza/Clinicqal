import { tool } from "ai";
import { z } from "zod";
import { searchClinicalTrials } from "@/lib/api/clinicaltrials";
import { searchGoogleWeb, searchGoogleScholar } from "@/lib/api/serpapi";
import { searchHealthCanada } from "@/lib/api/health-canada";
import { lookupDrug } from "@/lib/api/openfda";
import { lookupProvider } from "@/lib/api/npi";
import { lookupHealthDataCanada } from "@/lib/api/health-infobase";

export const searchClinicalTrialsTool = tool({
  description:
    "Search ClinicalTrials.gov for recruiting clinical trials matching a patient's condition, location, and filters. Use this as the primary registry for all trial searches. Returns normalized trial objects with eligibility criteria, locations, and sponsor info.",
  inputSchema: z.object({
    condition: z.string().describe("Medical condition or diagnosis to search for"),
    location: z.string().optional().describe("Geographic location filter e.g. 'New York, NY' or ZIP code"),
    status: z.string().optional().describe("Trial status filter, defaults to RECRUITING"),
    phase: z.string().optional().describe("Trial phase filter e.g. PHASE2, PHASE3"),
    pageSize: z.number().optional().default(20).describe("Number of results to return, max 100"),
  }),
  execute: async ({ condition, location, status, phase, pageSize }) => {
    return searchClinicalTrials(condition, { location, status, phase, pageSize });
  },
});

export const searchWhoIctrpTool = tool({
  description:
    "Search WHO ICTRP (International Clinical Trials Registry Platform) for international clinical trials not listed on ClinicalTrials.gov. Uses Google Search to scrape trialsearch.who.int. Use this to find trials in Europe, Asia, and other international registries.",
  inputSchema: z.object({
    query: z.string().describe("Search query — condition name, intervention, or trial keywords"),
    location: z.string().optional().describe("Geographic location to bias results"),
  }),
  execute: async ({ query, location }) => {
    const fullQuery = location ? `${query} ${location}` : query;
    return searchGoogleWeb(fullQuery, { siteRestrict: "trialsearch.who.int", numResults: 10 });
  },
});

export const searchHealthCanadaTool = tool({
  description:
    "Search Health Canada Clinical Trial Applications (CTA) for Canadian clinical trials. Use this when the patient is located in Canada or when searching for Canadian-specific trials. Returns trial authorization records from Health Canada.",
  inputSchema: z.object({
    condition: z.string().describe("Medical condition or therapeutic area to search"),
    status: z.string().optional().describe("Authorization status filter"),
  }),
  execute: async ({ condition, status }) => {
    return searchHealthCanada(condition, { status });
  },
});

export const searchScholarTool = tool({
  description:
    "Search Google Scholar for recent academic research papers related to a condition or intervention. Use this to find evidence-based context for trial explanations — particularly to understand a trial's intervention mechanism, outcomes, and patient populations.",
  inputSchema: z.object({
    query: z.string().describe("Search query — condition, intervention, or clinical trial topic"),
    yearFrom: z.number().optional().describe("Start year for date filter"),
    yearTo: z.number().optional().describe("End year for date filter"),
    numResults: z.number().optional().default(3).describe("Number of results to return, max 10"),
  }),
  execute: async ({ query, yearFrom, yearTo, numResults }) => {
    return searchGoogleScholar(query, { yearFrom, yearTo, numResults });
  },
});

export const lookupDrugTool = tool({
  description:
    "Look up FDA drug information for a medication — including label indications, adverse events, and active recalls. Use this when a trial involves a specific drug, when evaluating medication-related exclusion criteria, or when the patient's current medications may interact with a trial's intervention.",
  inputSchema: z.object({
    drugName: z.string().describe("Brand name or generic name of the drug"),
    lookupType: z
      .enum(["label", "adverse_events", "recalls"])
      .describe("Type of information to retrieve: 'label' for indications/warnings, 'adverse_events' for top reported side effects, 'recalls' for active recalls"),
  }),
  execute: async ({ drugName, lookupType }) => {
    return lookupDrug(drugName, lookupType);
  },
});

export const lookupProviderTool = tool({
  description:
    "Look up a healthcare provider by name or NPI number using the CMS NPI Registry. Use this to find the principal investigator at a trial site, or to help a patient locate a specialist affiliated with a trial location.",
  inputSchema: z.object({
    query: z.string().describe("Provider name (first last) or organization name"),
    state: z.string().optional().describe("U.S. state abbreviation to narrow results e.g. 'NY'"),
    npi: z.string().optional().describe("NPI number for exact lookup"),
  }),
  execute: async ({ query, state, npi }) => {
    return lookupProvider(query, { state, npi });
  },
});

export const lookupHealthDataCanadaTool = tool({
  description:
    "Retrieve Canadian public health statistics and datasets from Health Infobase Canada. Use this to provide regional health context for Canadian patients — e.g., prevalence rates, incidence data, or treatment statistics for specific conditions in Canada.",
  inputSchema: z.object({
    dataset: z.string().describe("Dataset topic e.g. 'cancer', 'diabetes', 'heart-disease', 'respiratory', 'mental_health'"),
    query: z.string().describe("Search term to filter records within the dataset"),
  }),
  execute: async ({ dataset, query }) => {
    return lookupHealthDataCanada(dataset, query);
  },
});

// All tools bundled for route handler use
export const allTools = {
  search_clinicaltrials: searchClinicalTrialsTool,
  search_who_ictrp: searchWhoIctrpTool,
  search_health_canada: searchHealthCanadaTool,
  search_scholar: searchScholarTool,
  lookup_drug: lookupDrugTool,
  lookup_provider: lookupProviderTool,
  lookup_health_data_canada: lookupHealthDataCanadaTool,
};
