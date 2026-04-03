const OPENFDA_BASE = "https://api.fda.gov/drug";

interface DrugLabelResult {
  drug_name: string;
  brand_names: string[];
  indications: string;
  contraindications: string;
  warnings: string;
  adverse_reactions: string;
  dosage_and_administration: string;
  source: "openfda";
}

interface AdverseEventResult {
  drug_name: string;
  top_reactions: Array<{ reaction: string; count: number }>;
  total_reports: number;
  source: "openfda";
}

interface RecallResult {
  drug_name: string;
  recalls: Array<{
    recall_number: string;
    reason_for_recall: string;
    status: string;
    product_description: string;
    recall_initiation_date: string;
  }>;
  source: "openfda";
}

type OpenFDAResult = DrugLabelResult | AdverseEventResult | RecallResult | { error: string; source: string };

function buildOpenFDAUrl(endpoint: string, params: URLSearchParams): string {
  const apiKey = process.env.OPENFDA_API_KEY;
  const url = `${OPENFDA_BASE}/${endpoint}?${params}`;
  return apiKey ? `${url}&api_key=${apiKey}` : url;
}

export async function lookupDrug(
  drugName: string,
  lookupType: "label" | "adverse_events" | "recalls"
): Promise<OpenFDAResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    if (lookupType === "label") {
      const params = new URLSearchParams({
        search: `openfda.brand_name:"${drugName}" OR openfda.generic_name:"${drugName}"`,
        limit: "1",
      });

      const response = await fetch(buildOpenFDAUrl("label.json", params), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          return { drug_name: drugName, brand_names: [], indications: "Not found", contraindications: "", warnings: "", adverse_reactions: "", dosage_and_administration: "", source: "openfda" };
        }
        return { error: `OpenFDA label lookup returned HTTP ${response.status}`, source: "openfda" };
      }

      const data: { results?: Array<{
        openfda?: { brand_name?: string[]; generic_name?: string[] };
        indications_and_usage?: string[];
        contraindications?: string[];
        warnings?: string[];
        adverse_reactions?: string[];
        dosage_and_administration?: string[];
      }> } = await response.json();

      const result = data.results?.[0];
      if (!result) return { error: `No label found for ${drugName}`, source: "openfda" };

      return {
        drug_name: drugName,
        brand_names: result.openfda?.brand_name || result.openfda?.generic_name || [drugName],
        indications: result.indications_and_usage?.[0]?.substring(0, 500) || "Not specified",
        contraindications: result.contraindications?.[0]?.substring(0, 500) || "Not specified",
        warnings: result.warnings?.[0]?.substring(0, 500) || "Not specified",
        adverse_reactions: result.adverse_reactions?.[0]?.substring(0, 500) || "Not specified",
        dosage_and_administration: result.dosage_and_administration?.[0]?.substring(0, 300) || "Not specified",
        source: "openfda",
      };
    }

    if (lookupType === "adverse_events") {
      const params = new URLSearchParams({
        search: `patient.drug.openfda.brand_name:"${drugName}" OR patient.drug.openfda.generic_name:"${drugName}"`,
        count: "patient.reaction.reactionmeddrapt.exact",
        limit: "10",
      });

      const response = await fetch(buildOpenFDAUrl("event.json", params), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) return { drug_name: drugName, top_reactions: [], total_reports: 0, source: "openfda" };
        return { error: `OpenFDA adverse events returned HTTP ${response.status}`, source: "openfda" };
      }

      const data: { results?: Array<{ term: string; count: number }>; meta?: { results?: { total?: number } } } = await response.json();

      return {
        drug_name: drugName,
        top_reactions: (data.results || []).map((r) => ({ reaction: r.term, count: r.count })),
        total_reports: data.meta?.results?.total || 0,
        source: "openfda",
      };
    }

    // recalls
    const params = new URLSearchParams({
      search: `product_description:"${drugName}"`,
      limit: "5",
    });

    const response = await fetch(buildOpenFDAUrl("enforcement.json", params), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) return { drug_name: drugName, recalls: [], source: "openfda" };
      return { error: `OpenFDA recalls returned HTTP ${response.status}`, source: "openfda" };
    }

    const data: { results?: Array<{
      recall_number: string;
      reason_for_recall: string;
      status: string;
      product_description: string;
      recall_initiation_date: string;
    }> } = await response.json();

    return {
      drug_name: drugName,
      recalls: (data.results || []).map((r) => ({
        recall_number: r.recall_number,
        reason_for_recall: r.reason_for_recall?.substring(0, 200) || "",
        status: r.status,
        product_description: r.product_description?.substring(0, 100) || "",
        recall_initiation_date: r.recall_initiation_date,
      })),
      source: "openfda",
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      error: `OpenFDA request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      source: "openfda",
    };
  }
}
