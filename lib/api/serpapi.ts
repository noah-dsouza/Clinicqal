const SERPAPI_BASE = "https://serpapi.com/search";

interface ScholarResult {
  title: string;
  snippet: string;
  link: string;
  year?: string;
  authors?: string;
  cited_by?: number;
}

interface ScholarResponse {
  query: string;
  results: ScholarResult[];
  error?: string;
}

interface WebResult {
  title: string;
  snippet: string;
  link: string;
  displayLink?: string;
}

interface WebSearchResponse {
  query: string;
  results: WebResult[];
  error?: string;
}

export async function searchGoogleScholar(
  query: string,
  options: { numResults?: number; yearFrom?: number; yearTo?: number } = {}
): Promise<ScholarResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return { query, results: [], error: "SERPAPI_API_KEY not configured" };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const params = new URLSearchParams({
      engine: "google_scholar",
      q: query,
      api_key: apiKey,
      num: String(options.numResults ?? 3),
    });
    if (options.yearFrom) params.set("as_ylo", String(options.yearFrom));
    if (options.yearTo) params.set("as_yhi", String(options.yearTo));
    if (!options.yearFrom && !options.yearTo) {
      params.set("as_ylo", String(new Date().getFullYear() - 5));
    }

    const response = await fetch(`${SERPAPI_BASE}?${params}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { query, results: [], error: `SerpAPI returned HTTP ${response.status}` };
    }

    const data: {
      organic_results?: Array<{
        title: string;
        snippet?: string;
        link: string;
        publication_info?: { summary?: string; authors?: Array<{ name: string }> };
        inline_links?: { cited_by?: { total?: number } };
        year?: number;
      }>;
      error?: string;
    } = await response.json();

    if (data.error) return { query, results: [], error: data.error };

    const results: ScholarResult[] = (data.organic_results || [])
      .slice(0, options.numResults ?? 3)
      .map((r) => ({
        title: r.title,
        snippet: r.snippet || r.publication_info?.summary || "",
        link: r.link,
        year: r.year?.toString(),
        authors: r.publication_info?.authors?.map((a) => a.name).join(", "),
        cited_by: r.inline_links?.cited_by?.total,
      }));

    return { query, results };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      query,
      results: [],
      error: `SerpAPI Scholar request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

export async function searchGoogleWeb(
  query: string,
  options: { numResults?: number; siteRestrict?: string } = {}
): Promise<WebSearchResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return { query, results: [], error: "SERPAPI_API_KEY not configured" };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const fullQuery = options.siteRestrict ? `site:${options.siteRestrict} ${query}` : query;

  try {
    const params = new URLSearchParams({
      engine: "google",
      q: fullQuery,
      api_key: apiKey,
      num: String(options.numResults ?? 10),
    });

    const response = await fetch(`${SERPAPI_BASE}?${params}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { query: fullQuery, results: [], error: `SerpAPI returned HTTP ${response.status}` };
    }

    const data: {
      organic_results?: Array<{ title: string; snippet?: string; link: string; displayed_link?: string }>;
      error?: string;
    } = await response.json();

    if (data.error) return { query: fullQuery, results: [], error: data.error };

    const results: WebResult[] = (data.organic_results || [])
      .slice(0, options.numResults ?? 10)
      .map((r) => ({
        title: r.title,
        snippet: r.snippet || "",
        link: r.link,
        displayLink: r.displayed_link,
      }));

    return { query: fullQuery, results };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      query: fullQuery,
      results: [],
      error: `SerpAPI web search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}
