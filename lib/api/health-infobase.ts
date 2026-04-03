// Health Infobase Canada — Canadian public health datasets
// https://health-infobase.canada.ca/
const HI_BASE = "https://health-infobase.canada.ca/src/data";

interface HealthInfobaseResult {
  dataset: string;
  query: string;
  records: Array<Record<string, string | number>>;
  total: number;
  source: "health_infobase";
}

// Known dataset endpoints for Health Infobase Canada
const DATASET_ENDPOINTS: Record<string, string> = {
  cancer: "cancer-type/table-tableau.json",
  diabetes: "diabetes/table-tableau.json",
  "heart-disease": "cvd/table-tableau.json",
  respiratory: "copd/table-tableau.json",
  mental_health: "mhdb/table-tableau.json",
};

export async function lookupHealthDataCanada(
  dataset: string,
  query: string
): Promise<HealthInfobaseResult | { error: string; source: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    // Resolve the dataset to an endpoint, defaulting to a general search
    const endpointKey = Object.keys(DATASET_ENDPOINTS).find(
      (k) => dataset.toLowerCase().includes(k) || query.toLowerCase().includes(k)
    );

    if (!endpointKey) {
      // If no known dataset matches, return an informational response
      clearTimeout(timeoutId);
      return {
        dataset,
        query,
        records: [],
        total: 0,
        source: "health_infobase",
      };
    }

    const endpoint = DATASET_ENDPOINTS[endpointKey];
    const response = await fetch(`${HI_BASE}/${endpoint}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        error: `Health Infobase Canada returned HTTP ${response.status}`,
        source: "health_infobase",
      };
    }

    // Health Infobase returns JSON arrays of records
    const data: Array<Record<string, string | number>> = await response.json();

    // Filter records that match the query (simple substring match on string values)
    const filtered = data
      .filter((record) =>
        Object.values(record).some(
          (v) => typeof v === "string" && v.toLowerCase().includes(query.toLowerCase())
        )
      )
      .slice(0, 20);

    return {
      dataset: endpointKey,
      query,
      records: filtered.length > 0 ? filtered : data.slice(0, 5),
      total: data.length,
      source: "health_infobase",
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      error: `Health Infobase Canada request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      source: "health_infobase",
    };
  }
}
