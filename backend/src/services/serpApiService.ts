import axios from "axios";

interface ScholarResult {
  title: string;
  snippet: string;
  link: string;
  year?: string;
  authors?: string;
}

interface AcademicContext {
  query: string;
  results: ScholarResult[];
  error?: string;
}

export async function searchGoogleScholar(
  query: string,
  numResults = 3
): Promise<AcademicContext> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return {
      query,
      results: [],
      error: "SERPAPI_KEY not configured",
    };
  }

  try {
    const response = await axios.get<{
      organic_results?: Array<{
        title: string;
        snippet?: string;
        link: string;
        publication_info?: {
          summary?: string;
          authors?: Array<{ name: string }>;
        };
        inline_links?: {
          cited_by?: { total?: number };
        };
        year?: number;
      }>;
      error?: string;
    }>("https://serpapi.com/search", {
      params: {
        engine: "google_scholar",
        q: query,
        api_key: apiKey,
        num: numResults,
        as_ylo: new Date().getFullYear() - 5, // Last 5 years
      },
      timeout: 10000,
    });

    if (response.data.error) {
      return { query, results: [], error: response.data.error };
    }

    const results: ScholarResult[] = (response.data.organic_results || [])
      .slice(0, numResults)
      .map((r) => ({
        title: r.title,
        snippet: r.snippet || r.publication_info?.summary || "",
        link: r.link,
        year: r.year?.toString(),
        authors: r.publication_info?.authors?.map((a) => a.name).join(", "),
      }));

    return { query, results };
  } catch (error) {
    console.error("SerpAPI error:", error);
    return {
      query,
      results: [],
      error: `SerpAPI request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function getAcademicContextForTrial(
  condition: string,
  intervention: string
): Promise<string> {
  const query = `clinical trial ${condition} ${intervention} eligibility criteria outcomes`;
  const context = await searchGoogleScholar(query, 2);

  if (context.error || context.results.length === 0) {
    return "No additional academic context available.";
  }

  const summaries = context.results
    .map((r) => `- "${r.title}" (${r.year || "n.d."}): ${r.snippet}`)
    .join("\n");

  return `Recent academic context:\n${summaries}`;
}
