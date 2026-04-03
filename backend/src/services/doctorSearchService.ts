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

function inferSpecialty(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("diabetes") || c.includes("diabetic") || c.includes("endocrin") || c.includes("thyroid") || c.includes("adrenal")) return "Endocrinologist";
  if (c.includes("cancer") || c.includes("tumor") || c.includes("carcinoma") || c.includes("lymphoma") || c.includes("leukemia") || c.includes("oncolog")) return "Oncologist";
  if (c.includes("heart") || c.includes("cardiac") || c.includes("cardio") || c.includes("coronary") || c.includes("atrial")) return "Cardiologist";
  if (c.includes("kidney") || c.includes("renal") || c.includes("nephro")) return "Nephrologist";
  if (c.includes("lung") || c.includes("pulmonary") || c.includes("asthma") || c.includes("copd") || c.includes("respiratory")) return "Pulmonologist";
  if (c.includes("neuro") || c.includes("brain") || c.includes("stroke") || c.includes("parkinson") || c.includes("alzheimer") || c.includes("multiple sclerosis")) return "Neurologist";
  if (c.includes("rheumat") || c.includes("lupus") || c.includes("arthritis") || c.includes("autoimmune")) return "Rheumatologist";
  if (c.includes("gastro") || c.includes("liver") || c.includes("hepat") || c.includes("bowel") || c.includes("crohn") || c.includes("colitis")) return "Gastroenterologist";
  if (c.includes("infect") || c.includes("hiv") || c.includes("hepatitis")) return "Infectious Disease Specialist";
  if (c.includes("psych") || c.includes("depression") || c.includes("anxiety") || c.includes("bipolar") || c.includes("schizophrenia")) return "Psychiatrist";
  return "Internal Medicine Specialist";
}

export async function searchDoctorsNearby(
  condition: string,
  location: string,
  context?: PatientContext
): Promise<DoctorResult[]> {
  const apiKey = process.env.SERPAPI_KEY ?? "";
  const specialty = inferSpecialty(condition);
  const hasRealSerpKey =
    apiKey.length > 0 &&
    !apiKey.includes("your_") &&
    (apiKey.startsWith("sk-") || apiKey.length >= 32);

  if (!hasRealSerpKey) {
    const groqDoctors = await getGroqDoctors(condition, location, specialty, context);
    if (groqDoctors.length > 0) return groqDoctors;
    return getFallbackDoctors(specialty, condition);
  }

  try {
    const query = `${specialty} ${condition} specialist near ${location} accepting new patients`;
    console.log(`[Doctors] Searching: "${query}"`);

    const response = await axios.get<{
      local_results?: SerpLocalResult[];
      organic_results?: Array<{ title?: string; snippet?: string; link?: string }>;
      error?: string;
    }>("https://serpapi.com/search", {
      params: {
        engine: "google",
        q: query,
        api_key: apiKey,
        num: 10,
        gl: "us",
        hl: "en",
      },
      timeout: 12000,
    });

    if (response.data.error) {
      console.warn("[Doctors] SerpAPI error:", response.data.error);
      const groqDoctors = await getGroqDoctors(condition, location, specialty, context);
      if (groqDoctors.length > 0) return groqDoctors;
      return getFallbackDoctors(specialty, condition);
    }

    const local = response.data.local_results ?? [];
    if (local.length === 0) {
      const groqDoctors = await getGroqDoctors(condition, location, specialty, context);
      if (groqDoctors.length > 0) return groqDoctors;
      return getFallbackDoctors(specialty, condition);
    }

    return local.slice(0, 6).map((r, idx): DoctorResult => {
      const accepting =
        r.hours?.current_status && r.hours.current_status.length > 0
          ? r.hours.current_status !== "Closed"
          : true;
      return {
        id: r.place_id ?? `doc-${idx}`,
        name: r.title ?? "Unknown Provider",
        specialty: r.type ?? specialty,
        address: r.address ?? location,
        phone: r.phone ?? "Call for appointment",
        rating: r.rating,
        reviews: r.reviews,
        website: r.website,
        accepting_patients: accepting,
        distance: r.distance,
        source: "google_local",
      };
    });
  } catch (err) {
    console.error("[Doctors] Search failed:", err);
    const groqDoctors = await getGroqDoctors(condition, location, specialty, context);
    if (groqDoctors.length > 0) return groqDoctors;
    return getFallbackDoctors(specialty, condition);
  }
}

function getFallbackDoctors(specialty: string, condition: string): DoctorResult[] {
  return [
    {
      id: "fb-1",
      name: `Dr. Sarah Chen, MD`,
      specialty: "Internal Medicine / Primary Care",
      address: "123 Medical Center Dr, Suite 200",
      phone: "(555) 234-5678",
      email: "sarah.chen@northwellcare.com",
      rating: 4.8,
      reviews: 312,
      accepting_patients: true,
      distance: "Near you",
      source: "demo",
    },
    {
      id: "fb-2",
      name: `Dr. James Okafor, MD`,
      specialty,
      address: "456 Specialist Blvd, Suite 100",
      phone: "(555) 345-6789",
      email: "care@specialisthealth.com",
      rating: 4.7,
      reviews: 198,
      accepting_patients: true,
      distance: "Near you",
      source: "demo",
    },
    {
      id: "fb-3",
      name: `Dr. Priya Sharma, MD, PhD`,
      specialty: `${specialty} — ${condition} Expert`,
      address: "789 University Health Plaza",
      phone: "(555) 456-7890",
      email: "research@universityhealth.org",
      rating: 4.9,
      reviews: 445,
      accepting_patients: true,
      distance: "Near you",
      source: "demo",
    },
    {
      id: "fb-4",
      name: `Dr. Leila Nazari, PsyD`,
      specialty: "Health Psychology / Chronic Illness Support",
      address: "321 Wellness Center, Suite 50",
      phone: "(555) 567-8901",
      email: "support@wellnessmindcare.com",
      rating: 4.6,
      reviews: 89,
      accepting_patients: true,
      distance: "Telehealth available",
      source: "demo",
    },
  ];
}

async function getGroqDoctors(condition: string, location: string, specialty: string, context?: PatientContext): Promise<DoctorResult[]> {
  if (!isGroqReady()) return [];
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
        phone: raw.phone || "Call clinic for details",
        rating: raw.rating,
        reviews: raw.reviews,
        website: raw.website,
        email: raw.email,
        accepting_patients: raw.accepting_patients ?? true,
        distance: raw.distance || "Near you",
        source: "groq_llm",
      };
    });
  } catch (error) {
    console.error("[Doctors] Groq fallback failed", error);
    return [];
  }
}
