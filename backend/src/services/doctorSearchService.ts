import axios from "axios";
import { DoctorResult } from "../types/doctor";
import { groqDoctorFallback, isGroqReady } from "./groqService";

interface PatientContext {
  age?: number;
  sex?: string;
  stage?: string;
}

interface SerpLocalResult {
  title?: string;
  type?: string;
  address?: string;
  phone?: string;
  rating?: number;
  reviews?: number;
  website?: string;
  hours?: { current_status?: string };
  distance?: string;
  place_id?: string;
  position?: number;
}

interface NpiAddress {
  address_purpose?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  telephone_number?: string;
}

interface NpiTaxonomy {
  desc?: string;
  primary?: boolean;
}

interface NpiBasic {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  name_prefix?: string;
  credential?: string;
  status?: string;
  gender?: string;
  organization_name?: string;
  authorized_official_first_name?: string;
  authorized_official_last_name?: string;
}

interface NpiResult {
  number?: string;
  enumeration_type?: string;
  basic?: NpiBasic;
  addresses?: NpiAddress[];
  taxonomies?: NpiTaxonomy[];
}

// Map condition/specialty to NPI taxonomy search term
function getNpiTaxonomy(specialty: string): string {
  const s = specialty.toLowerCase();
  if (s.includes("endocrin") || s.includes("diabetes")) return "Endocrinology, Diabetes";
  if (s.includes("oncolog") || s.includes("cancer")) return "Oncology";
  if (s.includes("cardio") || s.includes("heart")) return "Cardiovascular Disease";
  if (s.includes("nephrolog") || s.includes("kidney")) return "Nephrology";
  if (s.includes("neurolog") || s.includes("brain")) return "Neurology";
  if (s.includes("pulmon") || s.includes("lung")) return "Pulmonary Disease";
  if (s.includes("rheumat")) return "Rheumatology";
  if (s.includes("gastro")) return "Gastroenterology";
  if (s.includes("infect")) return "Infectious Disease";
  if (s.includes("psychiat")) return "Psychiatry";
  if (s.includes("hematolog")) return "Hematology";
  return "Internal Medicine";
}

// Parse "New York, NY" or "New York NY" or "10001" into { city, state, zip }
function parseLocation(raw: string): { city: string; state: string; zip: string } {
  const cleaned = raw.trim();

  // Pure zip code
  if (/^\d{5}(-\d{4})?$/.test(cleaned)) return { city: "", state: "", zip: cleaned.slice(0, 5) };

  // State abbreviation map for common shorthand
  const stateMap: Record<string, string> = {
    "nyc": "NY", "ny": "NY", "la": "CA", "sf": "CA",
    "chicago": "IL", "houston": "TX", "phoenix": "AZ",
    "philadelphia": "PA", "san antonio": "TX", "san diego": "CA",
    "dallas": "TX", "san jose": "CA", "austin": "TX",
    "jacksonville": "FL", "fort worth": "TX", "columbus": "OH",
    "charlotte": "NC", "indianapolis": "IN", "san francisco": "CA",
    "seattle": "WA", "denver": "CO", "boston": "MA",
    "los angeles": "CA", "new york": "NY", "miami": "FL",
    "atlanta": "GA", "washington": "DC", "dc": "DC",
    "detroit": "MI", "minneapolis": "MN", "portland": "OR",
  };

  const lower = cleaned.toLowerCase();
  for (const [city, st] of Object.entries(stateMap)) {
    if (lower.startsWith(city)) return { city: cleaned.split(",")[0].trim(), state: st, zip: "" };
  }

  // "City, ST" or "City, State"
  const parts = cleaned.split(/,\s*/);
  if (parts.length >= 2) {
    const city = parts[0].trim();
    const stPart = parts[1].trim().toUpperCase().slice(0, 2);
    return { city, state: stPart, zip: "" };
  }

  // Just a city name
  return { city: cleaned, state: "", zip: "" };
}

// Search NPI Registry (free, no API key)
async function searchNpiRegistry(
  condition: string,
  location: string,
  specialty: string
): Promise<DoctorResult[]> {
  try {
    const { city, state, zip } = parseLocation(location);
    const taxonomy = getNpiTaxonomy(specialty);

    const params: Record<string, string | number> = {
      version: "2.1",
      limit: 10,
      taxonomy_description: taxonomy,
      enumeration_type: "NPI-1", // individual providers only
    };

    if (zip) {
      params.postal_code = zip;
    } else {
      if (state) params.state = state;
      if (city) params.city = city;
    }

    console.log(`[Doctors] NPI Registry query: ${JSON.stringify(params)}`);

    const response = await axios.get<{ result_count: number; results: NpiResult[] }>(
      "https://npiregistry.cms.hhs.gov/api/",
      { params, timeout: 12000 }
    );

    const results = response.data.results || [];
    if (results.length === 0) {
      console.log("[Doctors] NPI returned 0 results, trying broader state-only query");
      // Retry with just the state
      if (state && city) {
        const fallbackParams: Record<string, string | number> = { ...params, limit: 10 };
        delete fallbackParams.city;
        const retry = await axios.get<{ result_count: number; results: NpiResult[] }>(
          "https://npiregistry.cms.hhs.gov/api/",
          { params: fallbackParams, timeout: 12000 }
        );
        return mapNpiResults(retry.data.results || [], specialty);
      }
      return [];
    }

    return mapNpiResults(results, specialty);
  } catch (err) {
    console.error("[Doctors] NPI Registry search failed:", err);
    return [];
  }
}

function mapNpiResults(results: NpiResult[], specialty: string): DoctorResult[] {
  return results
    .map((r, idx): DoctorResult | null => {
      const basic = r.basic || {};
      const locAddr =
        r.addresses?.find((a) => a.address_purpose === "LOCATION") ||
        r.addresses?.[0] ||
        {};
      const taxonomy =
        r.taxonomies?.find((t) => t.primary) ||
        r.taxonomies?.[0] ||
        {};

      // Build name — handle both individual and org providers
      let name = "";
      if (basic.first_name || basic.last_name) {
        const parts = [basic.name_prefix, basic.first_name, basic.middle_name, basic.last_name]
          .filter(Boolean)
          .join(" ");
        const cred = basic.credential ? `, ${basic.credential}` : "";
        name = `${parts}${cred}`;
      } else if (basic.organization_name) {
        name = basic.organization_name;
      } else {
        return null; // skip if no name
      }

      const address = [
        locAddr.address_1,
        locAddr.address_2,
        locAddr.city,
        locAddr.state,
        locAddr.postal_code?.slice(0, 5),
      ]
        .filter(Boolean)
        .join(", ");

      const rawPhone = locAddr.telephone_number || "";
      const phone = rawPhone
        ? rawPhone.replace(/[^\d]/g, "").replace(/^1?(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3")
        : "";

      return {
        id: r.number || `npi-${idx}`,
        name,
        specialty: taxonomy.desc || specialty,
        address,
        phone,
        accepting_patients: basic.status === "A",
        distance: locAddr.city ? `${locAddr.city}, ${locAddr.state}` : "Nearby",
        source: "npi_registry",
      };
    })
    .filter((d): d is DoctorResult => d !== null && Boolean(d.name))
    .slice(0, 8);
}

function inferSpecialty(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("diabetes") || c.includes("diabetic") || c.includes("endocrin") || c.includes("thyroid") || c.includes("adrenal")) return "Endocrinologist";
  if (c.includes("cancer") || c.includes("tumor") || c.includes("carcinoma") || c.includes("lymphoma") || c.includes("leukemia") || c.includes("oncolog")) return "Oncologist";
  if (c.includes("heart") || c.includes("cardiac") || c.includes("cardio") || c.includes("coronary") || c.includes("atrial")) return "Cardiologist";
  if (c.includes("kidney") || c.includes("renal") || c.includes("nephro")) return "Nephrologist";
  if (c.includes("lung") || c.includes("pulmonary") || c.includes("asthma") || c.includes("copd") || c.includes("respiratory")) return "Pulmonologist";
  if (c.includes("neuro") || c.includes("brain") || c.includes("stroke") || c.includes("parkinson") || c.includes("alzheimer")) return "Neurologist";
  if (c.includes("rheumat") || c.includes("lupus") || c.includes("arthritis") || c.includes("autoimmune")) return "Rheumatologist";
  if (c.includes("gastro") || c.includes("liver") || c.includes("hepat") || c.includes("bowel") || c.includes("crohn")) return "Gastroenterologist";
  if (c.includes("infect") || c.includes("hiv") || c.includes("hepatitis")) return "Infectious Disease Specialist";
  if (c.includes("psych") || c.includes("depression") || c.includes("anxiety") || c.includes("bipolar")) return "Psychiatrist";
  return "Internal Medicine Specialist";
}

export async function searchDoctorsNearby(
  condition: string,
  location: string,
  context?: PatientContext
): Promise<DoctorResult[]> {
  const specialty = inferSpecialty(condition);

  // 1. Try NPI Registry first — free, no key, real data
  const npiResults = await searchNpiRegistry(condition, location, specialty);
  if (npiResults.length > 0) {
    console.log(`[Doctors] NPI returned ${npiResults.length} providers`);
    return npiResults;
  }

  // 2. Try SerpAPI if key is available
  const apiKey = process.env.SERPAPI_KEY ?? "";
  const hasRealSerpKey =
    apiKey.length > 0 &&
    !apiKey.includes("your_") &&
    (apiKey.startsWith("sk-") || apiKey.length >= 32);

  if (hasRealSerpKey) {
    try {
      const query = `${specialty} ${condition} specialist near ${location} accepting new patients`;
      console.log(`[Doctors] SerpAPI searching: "${query}"`);

      const response = await axios.get<{
        local_results?: SerpLocalResult[];
        error?: string;
      }>("https://serpapi.com/search", {
        params: { engine: "google", q: query, api_key: apiKey, num: 10, gl: "us", hl: "en" },
        timeout: 12000,
      });

      const local = response.data.local_results ?? [];
      if (local.length > 0) {
        return local.slice(0, 6).map((r, idx): DoctorResult => ({
          id: r.place_id ?? `doc-${idx}`,
          name: r.title ?? "Unknown Provider",
          specialty: r.type ?? specialty,
          address: r.address ?? location,
          phone: r.phone ?? "",
          rating: r.rating,
          reviews: r.reviews,
          website: r.website,
          accepting_patients: r.hours?.current_status !== "Closed",
          distance: r.distance,
          source: "google_local",
        }));
      }
    } catch (err) {
      console.error("[Doctors] SerpAPI failed:", err);
    }
  }

  // 3. Try OpenStreetMap Overpass (global, free, no API key)
  const osmResults = await searchOverpassApi(location, specialty);
  if (osmResults.length > 0) {
    console.log(`[Doctors] Overpass returned ${osmResults.length} providers`);
    return osmResults;
  }

  // 4. Try Groq LLM generation
  if (isGroqReady()) {
    const groqDoctors = await getGroqDoctors(condition, location, specialty, context);
    if (groqDoctors.length > 0) return groqDoctors;
  }

  // 5. Hard fallback — return empty so UI shows "no results" rather than fake data
  console.warn("[Doctors] All sources exhausted — returning empty");
  return [];
}

// OpenStreetMap amenity tags most likely to return specialist clinics/doctors
function getOsmAmenityTags(specialty: string): string[] {
  const s = specialty.toLowerCase();
  if (s.includes("oncolog") || s.includes("cancer")) return ["amenity=hospital", "healthcare=hospital"];
  if (s.includes("cardio")) return ["amenity=hospital", "healthcare=doctor", "amenity=clinic"];
  if (s.includes("psychiat")) return ["amenity=clinic", "healthcare=doctor", "healthcare=psychiatrist"];
  return ["amenity=doctors", "healthcare=doctor", "amenity=clinic", "healthcare=clinic"];
}

async function searchOverpassApi(location: string, specialty: string): Promise<DoctorResult[]> {
  try {
    // Step 1: Geocode location with Nominatim
    const geocodeResp = await axios.get<Array<{ lat: string; lon: string; display_name: string }>>(
      "https://nominatim.openstreetmap.org/search",
      {
        params: { q: location, format: "json", limit: 1 },
        headers: { "User-Agent": "ClinIQ/1.0 (health-platform)" },
        timeout: 8000,
      }
    );

    const geo = geocodeResp.data?.[0];
    if (!geo) {
      console.log(`[Doctors] Nominatim could not geocode: "${location}"`);
      return [];
    }

    const lat = parseFloat(geo.lat);
    const lon = parseFloat(geo.lon);
    console.log(`[Doctors] Nominatim geocoded "${location}" → (${lat}, ${lon})`);

    // Step 2: Overpass QL query — 5 km radius, multiple healthcare node types
    const radius = 5000;
    const tags = getOsmAmenityTags(specialty);
    const unionParts = tags.map((t) => {
      const [k, v] = t.split("=");
      return `node["${k}"="${v}"](around:${radius},${lat},${lon});`;
    }).join("\n");

    const overpassQuery = `[out:json][timeout:20];
(
${unionParts}
);
out body 20;`;

    const overpassResp = await axios.post<{
      elements: Array<{
        id: number;
        lat: number;
        lon: number;
        tags?: {
          name?: string;
          "addr:street"?: string;
          "addr:housenumber"?: string;
          "addr:city"?: string;
          "addr:postcode"?: string;
          "addr:country"?: string;
          phone?: string;
          "contact:phone"?: string;
          website?: string;
          "contact:website"?: string;
          opening_hours?: string;
          healthcare?: string;
          amenity?: string;
          speciality?: string;
        };
      }>;
    }>(
      "https://overpass-api.de/api/interpreter",
      `data=${encodeURIComponent(overpassQuery)}`,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 25000,
      }
    );

    const elements = overpassResp.data?.elements || [];
    if (elements.length === 0) {
      console.log("[Doctors] Overpass returned 0 elements");
      return [];
    }

    return elements
      .filter((el) => el.tags?.name)
      .slice(0, 8)
      .map((el, idx): DoctorResult => {
        const tags = el.tags || {};
        const addressParts = [
          tags["addr:housenumber"] && tags["addr:street"]
            ? `${tags["addr:housenumber"]} ${tags["addr:street"]}`
            : tags["addr:street"],
          tags["addr:city"],
          tags["addr:postcode"],
          tags["addr:country"],
        ].filter(Boolean);

        const phone = tags.phone || tags["contact:phone"] || "";
        const website = tags.website || tags["contact:website"] || "";

        // Rough distance in km from search center
        const dLat = el.lat - lat;
        const dLon = el.lon - lon;
        const distKm = Math.sqrt(dLat * dLat + dLon * dLon) * 111;

        return {
          id: `osm-${el.id}`,
          name: tags.name!,
          specialty: tags.speciality || specialty,
          address: addressParts.length > 0 ? addressParts.join(", ") : geo.display_name.split(",").slice(0, 3).join(","),
          phone: phone.replace(/\s+/g, " ").trim(),
          website: website || undefined,
          accepting_patients: true,
          distance: `${distKm.toFixed(1)} km`,
          source: "openstreetmap",
        };
      })
      .filter((d) => d.name);
  } catch (err) {
    console.error("[Doctors] Overpass search failed:", err);
    return [];
  }
}

async function getGroqDoctors(
  condition: string,
  location: string,
  specialty: string,
  context?: PatientContext
): Promise<DoctorResult[]> {
  try {
    const doctors = await groqDoctorFallback(condition, location, specialty, context);
    if (!doctors || doctors.length === 0) return [];
    return doctors.map((doc, idx) => {
      const raw = doc as Partial<DoctorResult>;
      return {
        id: raw.id || `groq-doc-${idx}`,
        name: raw.name || "ClinIQ Care Partner",
        specialty: raw.specialty || specialty,
        address: raw.address || location,
        phone: raw.phone || "",
        rating: raw.rating,
        reviews: raw.reviews,
        website: raw.website,
        email: raw.email,
        accepting_patients: raw.accepting_patients ?? true,
        distance: raw.distance || "Nearby",
        source: "groq_llm",
      };
    });
  } catch (error) {
    console.error("[Doctors] Groq fallback failed", error);
    return [];
  }
}
