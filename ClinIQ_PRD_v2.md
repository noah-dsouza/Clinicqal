# PRODUCT REQUIREMENTS DOCUMENT

## ClinIQ

*AI-Powered Clinical Trial Matching & Digital Twin Health Platform*

| Field | Value |
|---|---|
| **Version:** | 2.0 |
| **Date:** | April 2, 2026 |
| **Status:** | Draft — Updated: Botpress ADK replaced with Vercel AI SDK; Next.js 14 added to frontend stack |
| **Classification:** | Internal / Confidential |

---

## Changelog (v1.1 → v2.0)

- **BREAKING: Agent layer migrated from Botpress ADK to Vercel AI SDK.** All agent orchestration, tool calling, and LLM interaction now runs natively inside Next.js Route Handlers. No external agent platform dependency. Botpress-related environment variables, CLI tooling, and deployment steps have been removed.
- **Frontend stack updated from "React + Tailwind CSS" to "Next.js 14 (App Router) + React + Tailwind CSS + shadcn/ui."** This was an omission in v1.1 — the project was already scaffolded with Next.js but it was not reflected in the PRD.
- All references to "the Botpress agent" throughout the document have been replaced with "the ClinIQ agent" or "the Vercel AI SDK agent layer."
- Appendix A.1 (Botpress ADK Setup) has been fully replaced with Appendix A.1 (Vercel AI SDK Setup) including installation, tool definitions, streaming implementation, and migration notes for existing code.
- Environment Variables Summary updated to remove Botpress variables and add Anthropic API key.

---

## 1. Executive Summary

ClinIQ is an AI-powered clinical trial matching and digital health platform designed to close the gap between patients seeking treatment options and the clinical trials that could help them. Today, fewer than 5% of eligible patients ever enroll in a clinical trial, largely because the discovery and eligibility-assessment process is opaque, manual, and deeply intimidating. ClinIQ changes that.

The platform ingests a patient's diagnosis, medications, medical history, and relevant biomarkers through an intuitive intake form. It then searches multiple global trial registries — including ClinicalTrials.gov, the WHO ICTRP, and Health Canada CTA — to surface trials that may be a good fit. An LLM-powered agent (orchestrated via the Vercel AI SDK within Next.js Route Handlers) interprets complex eligibility criteria, ranks results by relevance, and explains each trial in plain English: what it involves, where it's located, potential risks, and a personalized assessment of why the patient may or may not qualify. SerpAPI (with Google Search and Google Scholar engines) supplements structured API results with web and academic research context.

A lightweight digital twin layer structures each patient's health profile so the platform can deliver more context-aware matches and help users visualize what each trial is actually targeting in their condition, using interactive 3D anatomy visualizations.

---

## 2. Problem Statement

### 2.1 The Clinical Trial Discovery Gap

Clinical trials represent the frontier of medical treatment, yet the vast majority of patients who could benefit from them never participate. The core barriers are:

- **Discoverability:** Over 480,000 studies are registered on ClinicalTrials.gov alone. Patients and even clinicians lack the tools to efficiently search and filter this corpus against a specific patient profile.
- **Eligibility Complexity:** Inclusion/exclusion criteria are written in dense clinical language with compound logical conditions. A single trial may have 30+ criteria referencing lab values, prior treatments, comorbidities, and staging systems that vary by specialty.
- **Information Asymmetry:** Patients cannot easily understand what a trial involves, what the risks are, or whether it's logistically feasible (location, visit frequency, required procedures).
- **Lack of Personalization:** Existing trial search tools offer keyword matching at best. They cannot reason about a patient's complete medical context to determine likely eligibility.

### 2.2 Who This Affects

- Patients with serious or rare diagnoses who have exhausted standard-of-care options
- Caregivers navigating treatment decisions on behalf of a loved one
- Oncology and rare-disease clinicians looking to refer patients to relevant studies
- Clinical research organizations struggling with under-enrollment

---

## 3. Product Vision & Goals

### 3.1 Vision

Make clinical trial participation as accessible as searching for a flight — personalized, transparent, and actionable — while giving patients a living digital model of their health that grows with them.

### 3.2 Strategic Goals

1. Reduce time-to-match from weeks of manual research to under 2 minutes of automated, AI-driven search and analysis.
2. Achieve >85% eligibility-assessment accuracy as validated against manual clinician review on a benchmark dataset.
3. Deliver plain-English explanations for every matched trial, covering protocol summary, location logistics, risk profile, and personalized eligibility rationale.
4. Build a structured digital twin profile for each patient that persists across sessions and improves match quality over time.
5. Support multi-registry search across ClinicalTrials.gov, WHO ICTRP, and Health Canada CTA, supplemented by SerpAPI Google Scholar for academic research context.

### 3.3 Success Metrics (KPIs)

| Metric | Target | Measurement |
|---|---|---|
| Time to first matched results | < 120 seconds | P95 latency from form submission to results render |
| Eligibility accuracy | > 85% | Agreement rate with clinician panel on 200-trial benchmark |
| User comprehension score | > 4.2 / 5 | Post-session survey on trial explanation clarity |
| Trial coverage | > 95% of active interventional trials | Registry audit comparing indexed vs. total active studies |
| Return usage rate | > 40% within 30 days | Cohort retention analytics |
| Patient-to-trial click-through | > 25% | Ratio of users who click through to registry detail page |

---

## 4. Target Users & Personas

| Persona | Description | Primary Need |
|---|---|---|
| The Informed Patient | Adult diagnosed with a serious condition (e.g., Stage III NSCLC), digitally literate, actively researching treatment options | Find trials I qualify for, explained so I can discuss them with my oncologist |
| The Caregiver | Family member managing care for a patient with limited digital access or cognitive capacity | Quickly identify the best trial options and understand logistics (travel, visit frequency) |
| The Referring Clinician | Oncologist or specialist at a community practice without a dedicated research coordinator | Screen my patient against active trials in under 5 minutes during a clinic visit |
| The Research Coordinator | CRO or site-level coordinator responsible for enrollment targets | Understand which patient profiles are searching for trials like ours to improve recruitment strategy |

---

## 5. System Architecture

### 5.1 High-Level Architecture

ClinIQ follows a modular, agent-driven architecture with clear separation between the patient-facing frontend, the AI agent orchestration layer, and the data integration backend. All layers run within a single Next.js 14 application deployed to Vercel.

#### 5.1.1 Architecture Layers

- **Presentation Layer:** Next.js 14 App Router with React, Tailwind CSS, and shadcn/ui. Futuristic dark-themed healthcare dashboard with interactive 3D body visualization, vital sign cards, scenario builder panel, and multi-tab navigation (Dashboard, Weekly Tracking, Diagnostic Aid, Symptoms, Providers, Health Reports).

- **Agent Orchestration Layer (Vercel AI SDK):** The core intelligence layer that replaces the previous Botpress ADK. Runs entirely within Next.js Route Handlers (`app/api/agent/*/route.ts`). Uses the Vercel AI SDK's `streamText` and `generateObject` functions with Claude Sonnet 4.6 as the LLM. Defines tools for each external API (ClinicalTrials.gov, WHO ICTRP, Health Canada CTA, SerpAPI, OpenFDA, NPI Registry) that Claude can invoke during a multi-step reasoning process. Manages patient intake state via React state on the client and structured JSON payloads on the server. No external platform dependency — the agent is TypeScript functions in the codebase.

- **LLM Analysis Engine:** Claude Sonnet 4.6 via the Anthropic API, accessed through the Vercel AI SDK's `@ai-sdk/anthropic` provider. Receives structured patient profiles and raw trial eligibility criteria; performs semantic matching, eligibility scoring, and generates human-readable trial summaries with personalized qualification rationale. Supports both streaming (for progressive UI updates) and structured output (for typed JSON responses like eligibility scores).

- **Data Integration Layer:** Next.js Route Handlers that normalize responses from ClinicalTrials.gov, WHO ICTRP, Health Canada CTA, SerpAPI (Google Search + Google Scholar engines), NPI Registry, OpenFDA, and Health Infobase Canada. Each API integration is implemented as a Vercel AI SDK tool that Claude can invoke.

- **Digital Twin Engine:** Maintains a structured, versioned patient health profile (vitals, biomarkers, medications, diagnoses, procedures) that enriches every search with longitudinal context.

- **Visualization Layer:** 3D anatomy rendering that maps trial targets and patient conditions onto an interactive human body model.

### 5.2 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | **Next.js 14 (App Router)** | **Full-stack React framework; server components, Route Handlers for API logic, Vercel deployment** |
| **Agent Orchestration** | **Vercel AI SDK (`ai` + `@ai-sdk/anthropic`)** | **LLM interaction, tool calling, streaming responses, structured output generation. Replaces Botpress ADK.** |
| **LLM** | **Claude Sonnet 4.6 (Anthropic API)** | **Eligibility analysis, plain-English explanations, patient intake NLP, triage reasoning** |
| Frontend | React + Tailwind CSS + shadcn/ui | Dark-themed futuristic dashboard UI matching the Figma design system |
| Trial Data — Primary | ClinicalTrials.gov Data API | U.S. trial registry; structured study data, eligibility criteria, locations, status |
| Trial Data — Canada | Health Canada CTA API | Canadian clinical trial applications and authorizations |
| Trial Data — Global | WHO ICTRP (TrialSearch) | International trial registry portal aggregating 17 national registries |
| Trial Data — Bulk | HealthData.gov ClinicalTrials.gov Dataset | Bulk dataset for offline indexing, analytics, and pre-computation |
| Web Scraping + Scholar | SerpAPI (Google Search + Google Scholar engines) | Fallback web scraping via Google engine; academic paper discovery via Google Scholar engine |
| Provider Directory | NPI Registry (CMS) | U.S. healthcare provider lookup for referral and location matching |
| Drug & Device Data | OpenFDA API | FDA drug labels, adverse events, recalls for medication cross-referencing |
| Canadian Health Data | Health Infobase Canada API | Canadian public health datasets for regional health context |
| 3D Visualization | Interactive 3D body model | Condition and trial target visualization |
| Deployment | Vercel | Frontend + API routes + CRON jobs, edge network |

### 5.3 Agent Orchestration Layer — Detailed Architecture

This section provides the detailed technical specification for the Vercel AI SDK integration, which is the most significant architectural change from v1.1.

#### 5.3.1 Why Vercel AI SDK (Migration Rationale)

The previous architecture used Botpress ADK as an external conversational AI platform. This created several issues for ClinIQ:

1. **Deployment dependency:** The agent lived in Botpress Cloud, separate from the Next.js app. Debugging required switching between two systems.
2. **State management friction:** Patient intake state had to be synchronized between Botpress's conversation state and the Next.js frontend.
3. **Tool calling indirection:** Every API call (ClinicalTrials.gov, SerpAPI, etc.) had to be proxied through Botpress's webhook system rather than called directly from the codebase.
4. **Unnecessary abstraction:** ClinIQ's agent is not a chatbot — it is a multi-step orchestration pipeline. Botpress's conversation-flow model (designed for customer support) added complexity without matching the actual interaction pattern.

The Vercel AI SDK eliminates all of these issues. The agent runs as TypeScript code inside Next.js Route Handlers. Tools are async functions. State is managed in React or passed as JSON payloads. Streaming responses render progressively in the UI. Everything deploys with `git push` to Vercel.

#### 5.3.2 Core Concepts

**`streamText`**: The primary function for agent interactions. Sends a prompt (with the patient's digital twin and system instructions) to Claude, along with tool definitions. Claude can invoke tools (API calls) mid-response, receive results, and continue generating. The response streams to the frontend for progressive rendering.

**`generateObject`**: Used when the agent needs to produce structured, typed JSON output — for example, the eligibility score object `{ score: number, confidence: string, criteria: CriterionAssessment[] }`. Uses Zod schemas for runtime type validation.

**`tool()`**: Defines an external capability that Claude can invoke. Each tool has a description (so Claude knows when to use it), a Zod parameter schema, and an `execute` function (an async function that calls the external API and returns results). ClinIQ defines one tool per external API integration.

**`useChat` (client-side)**: React hook from `ai/react` that connects a chat-style UI to a streaming Route Handler. Manages message history, loading states, and progressive response rendering. Used for the conversational intake flow and the trial explanation interaction.

#### 5.3.3 Tool Definitions

The following tools are defined in the agent layer. Each tool is an async function that Claude can invoke during a `streamText` call.

| Tool Name | Description (for Claude) | Parameters (Zod schema) | External API | Returns |
|---|---|---|---|---|
| `search_clinicaltrials` | Search ClinicalTrials.gov for trials matching a patient's condition, location, and status filters | `{ condition: string, location?: string, status?: string, phase?: string, pageSize?: number }` | ClinicalTrials.gov API v2 | Array of normalized trial objects (NCT ID, title, phase, status, eligibility criteria text, locations) |
| `search_who_ictrp` | Search WHO ICTRP for international clinical trials via web scraping | `{ query: string, location?: string }` | SerpAPI Google Search engine (site:trialsearch.who.int) | Array of trial summaries extracted from search results |
| `search_health_canada` | Search Health Canada Clinical Trial Applications for Canadian trials | `{ condition: string, status?: string }` | Health Canada CTA API | Array of Canadian trial authorization records |
| `search_scholar` | Find academic research papers related to a condition or intervention | `{ query: string, yearFrom?: number, yearTo?: number, numResults?: number }` | SerpAPI Google Scholar engine | Array of paper objects (title, authors, snippet, citedBy, link) |
| `lookup_drug` | Look up FDA drug label information, adverse events, or recalls for a medication | `{ drugName: string, lookupType: "label" \| "adverse_events" \| "recalls" }` | OpenFDA API | Drug label data, adverse event reports, or recall notices |
| `lookup_provider` | Look up a healthcare provider by NPI number or name for trial site context | `{ query: string, state?: string }` | NPI Registry API | Provider records (name, specialty, organization, address) |
| `lookup_health_data_canada` | Retrieve Canadian public health datasets for regional context | `{ dataset: string, query: string }` | Health Infobase Canada API | Dataset records relevant to the query |

#### 5.3.4 Agent Interaction Flows

**Flow 1 — Trial Search & Analysis (Primary):**

The frontend sends the patient's complete digital twin JSON to `POST /api/agent/analyze`. The Route Handler calls `streamText` with:
- **System prompt:** Contains the ClinIQ persona, eligibility analysis protocol, plain-English explanation format, and confidence scoring rubric.
- **User message:** The patient's digital twin JSON + instruction to search registries and analyze eligibility.
- **Tools:** All 7 tools defined above.
- **`maxSteps: 10`:** Allows Claude to make up to 10 sequential tool calls (search 3 registries → retrieve drug info → analyze eligibility → generate explanations).

Claude autonomously decides which registries to search based on the patient's location and condition, invokes the tools, receives results, and streams back the eligibility analysis with trial cards. The frontend renders results progressively as the stream arrives using `useChat`.

**Flow 2 — Structured Eligibility Scoring:**

After the streaming analysis, a follow-up call to `POST /api/agent/score` uses `generateObject` with a Zod schema to produce typed eligibility scores for each matched trial. This ensures the scores are machine-parseable for sorting and filtering in the UI.

```
Schema: z.object({
  trials: z.array(z.object({
    nctId: z.string(),
    eligibilityScore: z.number().min(0).max(100),
    confidence: z.enum(["high", "medium", "low"]),
    criteriaAssessments: z.array(z.object({
      criterion: z.string(),
      status: z.enum(["met", "not_met", "uncertain", "not_applicable"]),
      reasoning: z.string()
    }))
  }))
})
```

**Flow 3 — Follow-Up Questions:**

After results are displayed, the patient can ask follow-up questions (e.g., "What does Phase 3 mean?" or "Would I have to stop my current medication?"). These are handled by the same `useChat` hook, which maintains conversation history and sends it to `POST /api/agent/chat`. Claude has access to the same tools for real-time lookups.

**Flow 4 — Scenario Builder Impact:**

When the patient adjusts Scenario Builder sliders (sleep, exercise, diet, medication adherence), the frontend recomputes the digital twin's Health Score locally, then sends the updated twin to `POST /api/agent/reanalyze` for a lightweight re-assessment of how the changes affect eligibility for already-matched trials. This uses `generateObject` for fast structured output without full re-search.

---

## 6. Feature Requirements

### 6.1 Patient Intake & Profile Builder (P0)

A guided, multi-step intake form powered by the ClinIQ agent layer that collects the patient's health profile and constructs a structured digital twin. The intake form is a React component rendered by Next.js; the agent (via Vercel AI SDK) assists with NLP-powered field parsing and validation.

#### 6.1.1 Required Data Fields

| Category | Fields | Input Method |
|---|---|---|
| Demographics | Age, sex, ethnicity, location (postal/ZIP code) | Form fields with auto-complete |
| Primary Diagnosis | Condition name, ICD-10 code, stage/grade, date of diagnosis | NLP-assisted free text + structured dropdowns |
| Medical History | Comorbidities, prior surgeries, hospitalizations | Multi-select with free-text fallback |
| Medications | Current medications, dosages, start dates; prior treatments tried | Drug name auto-complete via OpenFDA |
| Lab Results / Biomarkers | Recent blood work, tumor markers, genetic mutations (e.g., EGFR, BRCA) | Manual entry with unit validation |
| Vital Signs | Heart rate, blood pressure, BMI, O2 saturation | Manual entry or device sync (future) |
| Lifestyle Factors | Smoking status, alcohol use, exercise level, diet quality | Scenario Builder sliders (per dashboard UI) |
| Preferences | Max travel distance, language, trial phase preference, willingness for placebo | Preference panel with toggles and sliders |

#### 6.1.2 Digital Twin Construction

- All intake data is normalized into a structured JSON patient profile (the "digital twin") stored per-session with optional persistence for returning users.
- The twin includes computed fields: estimated ECOG performance status, Charlson Comorbidity Index, and body system impact mapping (Cardio, Respiratory, Nervous, Digestive — as shown in the dashboard's filter chips).
- The Health Score (displayed prominently on the dashboard as a radial gauge) is computed from a weighted composite of vitals, biomarkers, lifestyle factors, and disease severity.
- The Scenario Builder panel (right sidebar in the UI) allows users to adjust lifestyle parameters (sleep, exercise, diet, alcohol, medication adherence) and see real-time impact on their Health Score and trial eligibility.

### 6.2 Multi-Registry Trial Search (P0)

The core search engine that queries multiple trial registries in parallel, normalizes results into a unified schema, and deduplicates cross-listed studies.

#### 6.2.1 Search Pipeline

1. **Query Construction:** The Vercel AI SDK agent converts the patient's digital twin into optimized API queries for each registry. Queries include condition terms (MeSH-mapped), intervention types, geographic filters, and status filters (recruiting only by default). This happens inside the `streamText` call — Claude reads the digital twin and decides which `search_*` tools to invoke with what parameters.

2. **Parallel API Dispatch:** Claude invokes `search_clinicaltrials`, `search_who_ictrp`, and `search_health_canada` tools. The Vercel AI SDK executes tool calls as they are emitted by the model. SerpAPI Google Scholar queries are dispatched concurrently for academic context via the `search_scholar` tool.

3. **Response Normalization:** Each tool's `execute` function normalizes the raw API response into the unified trial schema before returning results to Claude. This means Claude always receives consistently structured data regardless of which registry it came from.

4. **Deduplication:** Cross-registry matching via NCT ID, WHO Universal Trial Number (UTN), or fuzzy title matching to merge duplicates and retain the richest data version. Implemented in the `search_clinicaltrials` tool's post-processing.

5. **Pre-Ranking:** Initial relevance scoring based on condition match, geographic proximity, trial phase, and recruitment status. Claude then performs deep eligibility analysis on the top candidates.

### 6.3 AI-Powered Eligibility Analysis (P0)

The LLM engine that interprets complex eligibility criteria against the patient's digital twin to produce personalized match assessments. Powered by Claude Sonnet 4.6 via the Vercel AI SDK.

#### 6.3.1 Analysis Pipeline

- **Criteria Parsing:** Claude decomposes each trial's inclusion/exclusion criteria into discrete, evaluable conditions (e.g., "Age ≥ 18", "No prior immunotherapy", "ECOG 0-1").
- **Profile Matching:** Each parsed criterion is evaluated against the patient's digital twin. Results are classified as: Met, Not Met, Uncertain (insufficient data), or Not Applicable.
- **Eligibility Score:** A composite score (0–100) reflecting the proportion of criteria met, weighted by criterion importance (hard exclusions vs. preferred characteristics). Generated via `generateObject` with a Zod schema for type safety.
- **Confidence Rating:** Each match assessment includes a confidence level (High / Medium / Low) based on data completeness and criterion ambiguity.

#### 6.3.2 Plain-English Trial Explanation

For each matched trial, Claude generates a structured explanation covering:

- **What This Trial Is:** One-paragraph summary of the study's purpose, intervention, and design (e.g., randomized, double-blind, Phase III).
- **What Participation Involves:** Visit schedule, procedures, duration, and any required washout periods.
- **Where It's Located:** Participating sites with distance from the patient's location, mapped via the NPI Registry for provider context.
- **Potential Risks:** Key adverse events from the protocol, contextualized against the patient's existing conditions and medications (enhanced by `lookup_drug` tool results).
- **Why You May/May Not Qualify:** Criterion-by-criterion walkthrough showing which criteria the patient meets, which they don't, and which need further data from their clinician.

### 6.4 Interactive Health Dashboard (P0)

The primary patient-facing interface, built with Next.js 14, React, Tailwind CSS, and shadcn/ui. Designed as a futuristic dark-themed healthcare dashboard (per the attached Figma mock).

#### 6.4.1 Dashboard Components

| Component | Description | Data Source |
|---|---|---|
| Navigation Bar | Tabbed navigation: Dashboard, Weekly Tracking, Diagnostic Aid, Symptoms, Providers, Health Reports | Next.js App Router |
| Body System Filters | Chip-style toggles: Cardio, Respiratory, Nervous, Digestive — filter vitals and biomarkers by system | Digital twin body-system mapping |
| Vital Signs Cards | Teal-bordered cards showing Heart Rate (bpm), Blood Pressure (mmHg) with trend indicators and mini sparklines | Patient intake / device sync |
| Blood Biomarker Cards | Cards for Glucose (mg/dL), LDL Cholesterol (mg/dL), and additional markers with trend arrows | Patient intake / lab upload |
| Health Score Gauge | Large radial progress indicator (0–100) with color-coded segments (red/orange/green) and qualitative label (e.g., "Fair") | Computed from digital twin composite |
| 3D Body Visualization | Interactive human body outline in the center of the dashboard; highlights affected systems and trial target areas | 3D visualization engine |
| Scenario Builder | Right sidebar panel with sliders for Sleep Quality, Exercise, Diet Quality, Alcohol, and a Medication toggle (e.g., Statin therapy) | User-adjustable; feeds back into Health Score |
| Input Your Data CTA | Prominent button to launch the patient intake flow | Navigation trigger |

### 6.5 3D Anatomy Visualization (P1)

An interactive 3D human body model that provides visual context for the patient's condition and trial targets.

- Render a stylized or anatomically accurate 3D human body in the dashboard's central panel.
- Highlight affected body systems based on the patient's diagnosis (e.g., pulsing heart for cardiac conditions, highlighted lungs for respiratory).
- When a trial is selected from results, overlay the trial's target area on the body model.
- Support zoom, rotate, and click-to-inspect interactions. Clicking a highlighted region shows a tooltip with the relevant condition or trial information.

### 6.6 Provider & Location Intelligence (P1)

- For each matched trial's participating sites, query the NPI Registry to surface the principal investigator's profile, affiliated institution, and specialty.
- Calculate driving distance and estimated travel time from the patient's location to each site.
- Cross-reference trial medications with OpenFDA for label information, known adverse events, and any active recalls.
- Surface relevant Canadian health data from Health Infobase Canada for patients located in Canada.

### 6.7 Health Reports & Export (P2)

- Generate a downloadable PDF report summarizing: patient profile, top matched trials, eligibility assessments, and recommended next steps.
- Include a "Talk to Your Doctor" section with a structured summary designed for the patient to bring to their next appointment.
- Export trial shortlist as a shareable link or CSV for clinician review.

---

## 7. Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| Performance | End-to-end search + analysis latency | P95 < 120 seconds for 3-registry search + SerpAPI Scholar + LLM analysis |
| Performance | Dashboard initial load | < 3 seconds on 4G connection |
| Performance | 3D visualization frame rate | > 30 FPS on mid-range devices |
| Scalability | Concurrent users | Support 10,000 concurrent sessions at launch |
| Availability | Uptime SLA | 99.5% monthly uptime |
| Security | Data encryption | TLS 1.3 in transit; AES-256 at rest |
| Security | Authentication | OAuth 2.0 / SSO; optional guest mode with session-only data |
| Compliance | Health data regulations | HIPAA-compliant architecture (U.S.); PIPEDA-aligned (Canada); GDPR-aware for EU users |
| Compliance | Medical disclaimer | Prominent disclaimers that ClinIQ does not provide medical advice; results are informational only |
| Accessibility | WCAG compliance | WCAG 2.1 AA for all patient-facing interfaces |
| Localization | Language support | English (launch); French Canadian (P2) |

---

## 8. Core Data Flow

1. Patient opens the dashboard and clicks "Input Your Data." The multi-step intake form (React component) begins collecting data.
2. The form collects demographics, diagnosis, medications, labs, vitals, and lifestyle factors through guided steps with NLP-assisted free text and structured inputs.
3. Collected data is normalized into the Digital Twin JSON schema. Computed fields (Health Score, ECOG estimate, Comorbidity Index, body system mapping) are derived.
4. The digital twin is rendered on the dashboard: vital sign cards, biomarker cards, Health Score gauge, 3D body visualization with highlighted affected systems, and Scenario Builder sliders pre-set to reported values.
5. The patient triggers the trial search. The frontend sends the digital twin JSON to `POST /api/agent/analyze`. The Vercel AI SDK `streamText` call gives Claude the twin and access to all tools.
6. Claude constructs registry-specific search queries and invokes `search_clinicaltrials`, `search_who_ictrp`, `search_health_canada`, and `search_scholar` tools. Results are normalized by each tool's execute function.
7. Claude evaluates each trial's eligibility criteria against the twin, computes eligibility scores and confidence ratings, and generates plain-English explanations. Results stream to the frontend progressively.
8. A follow-up `generateObject` call to `POST /api/agent/score` produces typed eligibility score objects for UI sorting and filtering.
9. Ranked results are displayed as interactive trial cards. Selecting a trial updates the 3D body model to highlight the trial's target area and shows the full explanation panel.
10. The user can adjust Scenario Builder parameters to see how lifestyle changes affect their Health Score and potentially their eligibility for certain trials.
11. The user can export a PDF health report or shareable trial shortlist for discussion with their healthcare provider.

---

## 9. API Integration Specifications

| API | Endpoint / Reference | Auth Method | Rate Limits / Notes |
|---|---|---|---|
| ClinicalTrials.gov | https://clinicaltrials.gov/data-api/api | None (public) | No published rate limit; implement client-side throttling at 10 req/sec |
| Health Canada CTA | https://health-products.canada.ca/api/documentation/cta-documentation-en.html | None (public) | Canadian trial authorizations; supplement with ClinicalTrials.gov for full data |
| HealthData.gov Dataset | https://healthdata.gov/NIH/ClinicalTrials-gov/mfxe-bas8/about_data | Socrata API token | Bulk dataset; use for offline indexing and pre-computation, not real-time queries |
| NLM Technical Bulletin | https://www.nlm.nih.gov/pubs/techbull/ma24/ma24_clinicaltrials_api.html | N/A (reference) | API changelog and migration guide; monitor for breaking changes |
| WHO ICTRP | https://trialsearch.who.int/ | Scraping via SerpAPI | No structured API; use SerpAPI Google engine for search result extraction |
| SerpAPI — Google Search | https://serpapi.com/search.json?engine=google | API key (confirmed) | Google engine for web scraping; supports location, language, device params |
| SerpAPI — Google Scholar | https://serpapi.com/search.json?engine=google_scholar | API key (confirmed) | Scholar engine for academic paper discovery; supports cites, date filtering, pagination |
| NPI Registry | https://npiregistry.cms.hhs.gov/search | None (public) | U.S. provider lookup; 200 results per query max |
| OpenFDA | https://api.fda.gov/drug/event.json | API key (optional) | Drug adverse events, labels, recalls; 240 req/min with key, 40 without |
| Health Infobase Canada | https://health-infobase.canada.ca/api/ | None (public) | Canadian public health datasets |
| **Anthropic API (Claude)** | **https://api.anthropic.com/v1/messages** | **API key (x-api-key)** | **Claude Sonnet 4.6; $3/$15 per MTok input/output; accessed via Vercel AI SDK** |

---

## 10. UI/UX Design References

### 10.1 Figma Prototype

The primary design reference is the Figma prototype: [Futuristic Healthcare Dashboard](https://www.figma.com/make/YsEicDR3GPrHdTIEKgJWrz/Futuristic-Healthcare-Dashboard)

Key design characteristics from the mock:

- **Dark Theme:** Deep navy/charcoal background (#0F172A range) with high-contrast data elements.
- **Accent Colors:** Teal/emerald for positive indicators and vitals, purple/violet for scores and navigation highlights, amber/orange for warning states, red/pink for critical alerts.
- **Card System:** Rounded-corner cards with subtle border glows (teal for vitals, amber for out-of-range biomarkers) containing metric label, large numeric value, unit, and trend sparkline.
- **Central Visualization:** Stylized human body outline with glowing highlights on affected systems, flanked by vital cards (left) and scenario controls (right).
- **Scenario Builder:** Dark card with slider controls for lifestyle factors, each with an icon, label, current value badge, and continuous slider.
- **Typography:** Clean sans-serif (system or Inter/DM Sans), large numeric displays for key metrics, muted labels in all-caps.

---

## 11. Risks & Mitigations

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| LLM hallucination in eligibility assessment | High | Medium | Implement citation-grounded generation; every eligibility statement must reference a specific criterion from the trial record. Add confidence scores and flag low-confidence assessments for clinician review. |
| API rate limiting or downtime from registries | Medium | High | Multi-registry fallback strategy; local caching of frequently accessed trials; bulk dataset pre-indexing for ClinicalTrials.gov. |
| Patient misinterprets results as medical advice | High | Medium | Prominent disclaimers on every results page; mandatory "I understand" acknowledgment during onboarding; language review by medical communications specialist. |
| HIPAA/PIPEDA compliance gaps | High | Low | Engage healthcare compliance counsel pre-launch; implement BAA-ready infrastructure; minimize PHI retention; offer guest mode with no persistence. |
| 3D visualization performance on low-end devices | Medium | Medium | Progressive enhancement: fallback to 2D SVG body diagram on devices that cannot sustain 30 FPS WebGL rendering. |
| SerpAPI cost escalation at scale | Medium | Medium | Monitor API spend weekly; implement query caching and result TTLs; use SerpAPI's no_cache=false for free cached results; negotiate volume pricing pre-scale. |
| Vercel AI SDK tool call latency | Medium | Medium | Implement parallel tool execution where possible; cache API responses in-memory during a session; use `maxSteps` judiciously to limit unnecessary LLM round-trips. |

---

## 12. Release Plan & Prioritization

| Priority | Scope | Target |
|---|---|---|
| P0 — MVP | Patient intake form, ClinicalTrials.gov search, LLM eligibility analysis via Vercel AI SDK, plain-English explanations, basic dashboard with vital cards and Health Score, digital twin (session-only) | Q3 2026 |
| P1 — Enhanced | Multi-registry search (WHO ICTRP, Health Canada CTA), SerpAPI Google Scholar integration, 3D body visualization, provider/location intelligence (NPI + OpenFDA), persistent digital twin with user accounts | Q4 2026 |
| P2 — Full Platform | Health Reports PDF export, Weekly Tracking, Diagnostic Aid tab, Scenario Builder with real-time eligibility impact, French Canadian localization, clinician referral workflow | Q1 2027 |
| P3 — Scale | EHR integration (FHIR R4), wearable device sync, CRO-facing recruitment analytics dashboard, API access for partner platforms | Q2 2027+ |

---

## 13. Open Questions

1. Should the agent layer support voice input for accessibility, or is a text-based form sufficient for MVP?
2. How should the platform handle trial results for pediatric patients, given the additional regulatory and ethical considerations?
3. What level of Health Score transparency is appropriate? Should we expose the full weighting algorithm or keep it as a proprietary composite?
4. Should we pursue FDA Software as a Medical Device (SaMD) classification, or position strictly as an informational tool to avoid regulatory burden?
5. Should SerpAPI Google Scholar results be surfaced directly to patients as "Related Research," or used only internally by the LLM for context enrichment?
6. What SerpAPI plan tier is needed at scale? Current key supports development; production volume for WHO ICTRP scraping + Scholar queries needs capacity planning.

---

## Appendix A: Confirmed API Setup Documentation

### A.1 Vercel AI SDK Setup (Replaces Botpress ADK)

The Vercel AI SDK is the agent orchestration backbone of ClinIQ. It provides LLM interaction, tool calling, streaming, and structured output generation — all running natively inside Next.js Route Handlers with zero external platform dependency.

#### A.1.1 Prerequisites

- Node.js v18.0.0 or higher (v20+ recommended)
- Next.js 14 project with App Router
- An Anthropic API key (from platform.claude.com)
- A supported package manager: npm, pnpm, yarn, or bun

#### A.1.2 Installation

Install the core Vercel AI SDK and the Anthropic provider:

```bash
npm install ai @ai-sdk/anthropic zod
```

- `ai` — Core Vercel AI SDK (streamText, generateObject, tool, useChat)
- `@ai-sdk/anthropic` — Anthropic provider for Claude models
- `zod` — Runtime schema validation for tool parameters and structured output

#### A.1.3 Environment Variables

Add to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...your-key-here
```

The `@ai-sdk/anthropic` provider reads `ANTHROPIC_API_KEY` automatically. No additional configuration is needed.

#### A.1.4 Provider Initialization

Create `lib/ai/provider.ts`:

```typescript
import { anthropic } from '@ai-sdk/anthropic';

export const cliniqModel = anthropic('claude-sonnet-4-6-20250218');
```

This model reference is passed to all `streamText` and `generateObject` calls throughout the application.

#### A.1.5 Defining Tools

Create `lib/ai/tools.ts` with all ClinIQ tool definitions. Each tool uses `tool()` from the `ai` package with a Zod parameter schema and an async `execute` function.

Example structure:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const searchClinicalTrials = tool({
  description: 'Search ClinicalTrials.gov for trials matching a patient condition, location, and status filters.',
  parameters: z.object({
    condition: z.string().describe('The medical condition to search for'),
    location: z.string().optional().describe('Geographic location filter'),
    status: z.string().optional().describe('Trial status filter, e.g. RECRUITING'),
    phase: z.string().optional().describe('Trial phase filter, e.g. PHASE3'),
    pageSize: z.number().optional().default(20).describe('Number of results to return'),
  }),
  execute: async ({ condition, location, status, phase, pageSize }) => {
    // Call ClinicalTrials.gov API v2
    // Normalize response into unified trial schema
    // Return array of trial objects
  },
});

// Similarly define: searchWhoIctrp, searchHealthCanada, searchScholar,
// lookupDrug, lookupProvider, lookupHealthDataCanada
```

#### A.1.6 Creating the Agent Route Handler

Create `app/api/agent/analyze/route.ts`:

```typescript
import { streamText } from 'ai';
import { cliniqModel } from '@/lib/ai/provider';
import { searchClinicalTrials, searchWhoIctrp, searchHealthCanada,
         searchScholar, lookupDrug, lookupProvider } from '@/lib/ai/tools';

export async function POST(req: Request) {
  const { digitalTwin } = await req.json();

  const result = streamText({
    model: cliniqModel,
    system: `You are ClinIQ, an AI clinical trial matching agent...
      [full system prompt with eligibility analysis protocol,
       plain-English explanation format, confidence scoring rubric]`,
    messages: [
      {
        role: 'user',
        content: `Analyze the following patient profile and find matching clinical trials:\n\n${JSON.stringify(digitalTwin, null, 2)}`
      }
    ],
    tools: {
      search_clinicaltrials: searchClinicalTrials,
      search_who_ictrp: searchWhoIctrp,
      search_health_canada: searchHealthCanada,
      search_scholar: searchScholar,
      lookup_drug: lookupDrug,
      lookup_provider: lookupProvider,
    },
    maxSteps: 10, // Allow up to 10 sequential tool invocations
  });

  return result.toDataStreamResponse();
}
```

#### A.1.7 Frontend Integration with useChat

In the React component that displays trial results:

```typescript
import { useChat } from 'ai/react';

export function TrialAnalysis({ digitalTwin }) {
  const { messages, isLoading, append } = useChat({
    api: '/api/agent/analyze',
    body: { digitalTwin },
  });

  // Render messages progressively as the stream arrives
  // Parse tool call results to extract trial cards
  // Display loading indicators during tool execution
}
```

#### A.1.8 Structured Output for Eligibility Scores

Create `app/api/agent/score/route.ts`:

```typescript
import { generateObject } from 'ai';
import { cliniqModel } from '@/lib/ai/provider';
import { z } from 'zod';

const EligibilitySchema = z.object({
  trials: z.array(z.object({
    nctId: z.string(),
    eligibilityScore: z.number().min(0).max(100),
    confidence: z.enum(['high', 'medium', 'low']),
    criteriaAssessments: z.array(z.object({
      criterion: z.string(),
      status: z.enum(['met', 'not_met', 'uncertain', 'not_applicable']),
      reasoning: z.string(),
    })),
  })),
});

export async function POST(req: Request) {
  const { digitalTwin, trials } = await req.json();

  const { object } = await generateObject({
    model: cliniqModel,
    schema: EligibilitySchema,
    prompt: `Given this patient profile:\n${JSON.stringify(digitalTwin)}\n\nScore eligibility for these trials:\n${JSON.stringify(trials)}`,
  });

  return Response.json(object);
}
```

#### A.1.9 Migration Notes (Botpress → Vercel AI SDK)

For code already written against the Botpress ADK:

1. **Remove Botpress dependencies:** Uninstall the Botpress ADK CLI and remove any `adk` commands from your workflow. Delete the `botpress.config.ts` or equivalent configuration files.
2. **Move conversation logic to Route Handlers:** Any conversation flows defined in Botpress should be reimplemented as `streamText` calls in Next.js Route Handlers under `app/api/agent/`.
3. **Convert Botpress tool calls to Vercel AI SDK tools:** If you had Botpress "actions" or "hooks" that called external APIs, convert each into a `tool()` definition with Zod schemas.
4. **Replace Botpress state with React state or server-side payloads:** Patient profile state previously managed by Botpress's conversation engine should now be managed by React state (for the intake form) and passed as JSON body to Route Handlers.
5. **Remove Botpress environment variables:** Delete `BOTPRESS_PAT`, `BOTPRESS_WORKSPACE_ID`, and `BOTPRESS_BOT_ID` from `.env.local`.
6. **Add Anthropic API key:** Add `ANTHROPIC_API_KEY` to `.env.local`.

### A.2 SerpAPI Setup

*(Unchanged from v1.1)*

SerpAPI is used for two purposes: (1) Google Search engine for WHO ICTRP scraping and supplementary web results, and (2) Google Scholar engine for academic paper discovery related to patient conditions and interventions.

#### A.2.1 Authentication
API Key: Confirmed and provisioned. Store as environment variable `SERPAPI_API_KEY`. All requests require the `api_key` parameter.

#### A.2.2 Google Search Engine
Endpoint: `https://serpapi.com/search.json?engine=google`

Primary use: Scraping WHO ICTRP search results and supplementary trial information not available via structured APIs.

Key parameters: `q` (search query, required), `location` (geographic bias), `gl` (country code), `hl` (language code), `start` (pagination offset, 0/10/20...), `device` (desktop/mobile/tablet), `no_cache` (force fresh results), `safe` (adult content filter).

#### A.2.3 Google Scholar Engine
Endpoint: `https://serpapi.com/search.json?engine=google_scholar`

Primary use: Discovering academic papers, clinical research, and review articles relevant to a patient's condition or a trial's intervention.

Key parameters: `q` (search query, required; supports `author:` and `source:` helpers), `cites` (trigger Cited By search), `as_ylo` / `as_yhi` (year range filters), `num` (results per page, 1–20), `start` (pagination offset), `as_sdt` (0 to exclude patents, 7 to include), `lr` (language filter).

ClinIQ usage pattern: Query Google Scholar with the patient's primary condition + intervention keywords to surface the most-cited recent research papers. Pass top results to Claude as context for generating evidence-informed trial explanations.

### A.3 OpenFDA API Setup

*(Unchanged from v1.1)*

OpenFDA provides access to FDA drug adverse event reports, drug labels, recalls, and device data.

- Drug Adverse Events: `https://api.fda.gov/drug/event.json`
- Drug Labels: `https://api.fda.gov/drug/label.json`
- Query syntax: `{base_endpoint}?search=field:term&limit=N`
- Rate Limits: Without API key: 40 req/min. With API key: 240 req/min.

### A.4 Environment Variables Summary

| Variable | Service | Required For | Notes |
|---|---|---|---|
| **ANTHROPIC_API_KEY** | **Anthropic (Claude)** | **All LLM calls via Vercel AI SDK** | **$5 free credits on signup; Claude Sonnet 4.6** |
| SERPAPI_API_KEY | SerpAPI | All SerpAPI calls | Confirmed; supports Google Search + Google Scholar engines |
| OPENFDA_API_KEY | OpenFDA | Production rate limits | Optional for dev (40 req/min); required for prod (240 req/min) |
| SOCRATA_APP_TOKEN | HealthData.gov | Bulk dataset access | For ClinicalTrials.gov bulk data pre-indexing |
| NEXT_PUBLIC_APP_URL | Next.js | Client-side API routing | Set to deployment URL (e.g., https://cliniq.vercel.app) |

**Removed from v1.1:** `BOTPRESS_PAT`, `BOTPRESS_WORKSPACE_ID`, `BOTPRESS_BOT_ID` — no longer needed after migration to Vercel AI SDK.

---

*End of Document*
