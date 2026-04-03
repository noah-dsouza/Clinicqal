const NPI_BASE = "https://npiregistry.cms.hhs.gov/api";

interface NPIProvider {
  npi: string;
  name: string;
  credential: string;
  specialty: string;
  organization?: string;
  address: {
    line1: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
  };
  source: "npi";
}

interface NPIError {
  error: string;
  source: string;
}

export async function lookupProvider(
  query: string,
  options: { state?: string; npi?: string } = {}
): Promise<NPIProvider[] | NPIError> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const params = new URLSearchParams({
      version: "2.1",
      limit: "10",
    });

    if (options.npi) {
      params.set("number", options.npi);
    } else {
      // Parse "FirstName LastName" or organization name
      const parts = query.trim().split(/\s+/);
      if (parts.length >= 2) {
        params.set("first_name", parts[0]);
        params.set("last_name", parts.slice(1).join(" "));
      } else {
        params.set("organization_name", query);
      }
      if (options.state) params.set("state", options.state);
    }

    const response = await fetch(`${NPI_BASE}/?${params}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { error: `NPI Registry returned HTTP ${response.status}`, source: "npi" };
    }

    const data: {
      results?: Array<{
        number: string;
        basic?: { first_name?: string; last_name?: string; credential?: string; organization_name?: string };
        taxonomies?: Array<{ desc?: string; primary?: boolean }>;
        addresses?: Array<{ address_1?: string; city?: string; state?: string; postal_code?: string; telephone_number?: string; address_purpose?: string }>;
      }>;
      result_count?: number;
    } = await response.json();

    if (!data.results?.length) return [];

    return data.results.map((r) => {
      const basic = r.basic || {};
      const name =
        basic.organization_name ||
        [basic.first_name, basic.last_name].filter(Boolean).join(" ") ||
        "Unknown Provider";

      const primaryTaxonomy = r.taxonomies?.find((t) => t.primary) || r.taxonomies?.[0];
      const practiceAddr =
        r.addresses?.find((a) => a.address_purpose === "LOCATION") || r.addresses?.[0];

      return {
        npi: r.number,
        name,
        credential: basic.credential || "",
        specialty: primaryTaxonomy?.desc || "Unknown Specialty",
        organization: basic.organization_name,
        address: {
          line1: practiceAddr?.address_1 || "",
          city: practiceAddr?.city || "",
          state: practiceAddr?.state || "",
          zip: practiceAddr?.postal_code || "",
          phone: practiceAddr?.telephone_number,
        },
        source: "npi" as const,
      };
    });
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      error: `NPI Registry request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      source: "npi",
    };
  }
}
