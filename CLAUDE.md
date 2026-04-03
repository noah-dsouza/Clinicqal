# CLAUDE.md — ClinIQ Development Context

This file provides context for Claude Code (or any AI coding assistant) working on the ClinIQ codebase. Read this before making any changes.

---

## Project Overview

ClinIQ is an AI-powered clinical trial matching and digital twin health platform. Patients input their health profile, and the system searches multiple clinical trial registries, analyzes eligibility using an LLM, and explains results in plain English.

**PRD:** See `ClinIQ_PRD_v2.md` in the project root for the full product requirements document.

---

## AI SDK Notes (v6)

This project uses **Vercel AI SDK v6** (`ai@6`, `@ai-sdk/anthropic@3`, `@ai-sdk/react@3`). Key differences from earlier SDK versions:

- `parameters` in `tool()` → renamed to `inputSchema`
- `maxSteps` in `streamText` → replaced by `stopWhen: stepCountIs(N)`
- `toDataStreamResponse()` → renamed to `toUIMessageStreamResponse()`
- `maxTokens` → renamed to `maxOutputTokens`
- `useChat` from `@ai-sdk/react` — uses `sendMessage()` + `status` instead of `handleSubmit` + `isLoading`
- `useChat` transport configured via `new DefaultChatTransport({ api, body })` — no direct `api` option

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Agent / LLM | Vercel AI SDK (`ai`, `@ai-sdk/anthropic`) with Claude Sonnet 4.6 |
| Trial Data (primary) | ClinicalTrials.gov API v2 |
| Trial Data (Canada) | Health Canada CTA API |
| Trial Data (global) | WHO ICTRP via SerpAPI Google Search scraping |
| Academic Research | SerpAPI Google Scholar engine |
| Drug Data | OpenFDA API |
| Provider Data | NPI Registry (CMS) |
| Canadian Health Data | Health Infobase Canada API |
| Bulk Data | HealthData.gov (Socrata) for offline indexing |
| 3D Visualization | Interactive 3D body model (custom implementation) |
| Deployment | Vercel |

---

## Project Structure

```
cliniq/
├── app/
│   ├── api/
│   │   └── agent/
│   │       ├── analyze/route.ts    # Main trial search + eligibility analysis (streamText)
│   │       ├── score/route.ts      # Structured eligibility scoring (generateObject)
│   │       ├── chat/route.ts       # Follow-up questions (streamText with history)
│   │       └── reanalyze/route.ts  # Scenario Builder re-assessment (generateObject)
│   ├── dashboard/
│   │   └── page.tsx                # Main dashboard view
│   ├── intake/
│   │   └── page.tsx                # Patient intake form
│   ├── layout.tsx
│   └── page.tsx                    # Landing page
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── dashboard/                  # Dashboard-specific components
│   │   ├── VitalCard.tsx
│   │   ├── BiomarkerCard.tsx
│   │   ├── HealthScoreGauge.tsx
│   │   ├── BodyVisualization.tsx
│   │   ├── ScenarioBuilder.tsx
│   │   └── TrialCard.tsx
│   └── intake/                     # Intake form components
├── lib/
│   ├── ai/
│   │   ├── provider.ts             # Anthropic model configuration
│   │   ├── tools.ts                # All Vercel AI SDK tool definitions
│   │   ├── prompts.ts              # System prompts for different agent flows
│   │   └── schemas.ts              # Zod schemas for structured output
│   ├── api/
│   │   ├── clinicaltrials.ts       # ClinicalTrials.gov API client
│   │   ├── health-canada.ts        # Health Canada CTA API client
│   │   ├── serpapi.ts              # SerpAPI client (Google Search + Scholar)
│   │   ├── openfda.ts              # OpenFDA API client
│   │   ├── npi.ts                  # NPI Registry API client
│   │   └── health-infobase.ts      # Health Infobase Canada API client
│   ├── digital-twin/
│   │   ├── schema.ts               # Digital twin TypeScript types and Zod schemas
│   │   ├── compute.ts              # Computed fields: Health Score, ECOG, Comorbidity Index
│   │   └── normalize.ts            # Intake data → digital twin normalization
│   └── utils/
│       ├── trial-schema.ts         # Unified trial schema (cross-registry)
│       └── deduplication.ts        # Cross-registry trial deduplication logic
├── .env.local                      # Environment variables (not committed)
├── CLAUDE.md                       # This file
├── ClinIQ_PRD_v2.md               # Product requirements document
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Environment Variables

Required in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...        # Claude Sonnet 4.6 via Vercel AI SDK
SERPAPI_API_KEY=...                  # Google Search + Google Scholar
OPENFDA_API_KEY=...                 # Optional for dev (40 req/min without)
SOCRATA_APP_TOKEN=...               # For HealthData.gov bulk data
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Or Vercel deployment URL
```

**Do NOT add Botpress variables.** They are no longer used.

---

## Agent Architecture Rules

### Route Handler Patterns

All agent endpoints live under `app/api/agent/`. Follow these patterns:

**Streaming responses (for progressive UI):**
```typescript
import { streamText } from 'ai';
import { cliniqModel } from '@/lib/ai/provider';
import { allTools } from '@/lib/ai/tools';

export async function POST(req: Request) {
  const body = await req.json();
  const result = streamText({
    model: cliniqModel,
    system: SYSTEM_PROMPT,
    messages: body.messages,
    tools: allTools,
    maxSteps: 10,
  });
  return result.toDataStreamResponse();
}
```

**Structured output (for typed JSON):**
```typescript
import { generateObject } from 'ai';
import { cliniqModel } from '@/lib/ai/provider';
import { MySchema } from '@/lib/ai/schemas';

export async function POST(req: Request) {
  const body = await req.json();
  const { object } = await generateObject({
    model: cliniqModel,
    schema: MySchema,
    prompt: `...`,
  });
  return Response.json(object);
}
```

### Tool Definition Rules

- Every tool MUST have a `description` that tells Claude when and why to use it.
- Every tool MUST use Zod schemas for parameters — no `any` types.
- Every tool's `execute` function MUST normalize external API responses into our internal schema before returning. Claude should never see raw, inconsistent API responses.
- Tools should handle errors gracefully and return error objects rather than throwing — Claude needs to see the error to decide what to do next.
- Keep tool descriptions concise but specific. Claude uses them to decide tool invocation order.

### System Prompt Rules

- System prompts live in `lib/ai/prompts.ts` as exported constants.
- The main analysis prompt MUST include: the eligibility analysis protocol, the plain-English explanation format, the confidence scoring rubric, and explicit instructions to cite specific trial criteria in assessments.
- Never hardcode system prompts inside Route Handlers — always import from `lib/ai/prompts.ts`.

### Structured Output Rules

- Zod schemas for `generateObject` live in `lib/ai/schemas.ts`.
- Always use `.describe()` on Zod fields to help Claude understand what each field expects.
- The eligibility score schema is canonical — do not create alternative scoring formats.

---

## API Client Rules

All external API clients live in `lib/api/`. Follow these conventions:

- Each file exports async functions that take typed parameters and return typed responses.
- Each client handles its own error cases and returns `null` or an error object on failure.
- API clients are called from inside tool `execute` functions, NOT directly from Route Handlers or components.
- Use `fetch` for HTTP requests (not axios) — it's available natively in Node.js 18+ and Next.js.
- Cache API responses where appropriate using in-memory Maps with TTLs (for trial data that doesn't change often).
- Respect rate limits: ClinicalTrials.gov at 10 req/sec, OpenFDA at 40 req/min (240 with key), SerpAPI per plan tier.

---

## Digital Twin Rules

- The digital twin schema is defined in `lib/digital-twin/schema.ts` using TypeScript interfaces AND Zod schemas (for runtime validation of intake form data).
- Computed fields (Health Score, ECOG estimate, Comorbidity Index) are derived in `lib/digital-twin/compute.ts`. These are pure functions — no side effects, no API calls.
- The Health Score formula is a weighted composite. Document any changes to weights in code comments.
- The digital twin is passed as JSON in Route Handler request bodies. It is NOT stored in a database for MVP — session-only persistence via React state.

---

## Frontend Rules

- Use shadcn/ui components as the base. Custom components go in `components/dashboard/` or `components/intake/`.
- The dark theme uses the color system from the Figma mock: navy/charcoal backgrounds (#0F172A range), teal/emerald accents for positive states, amber/orange for warnings, red/pink for critical.
- Use `useChat` from `ai/react` for any component that consumes a streaming agent response.
- Trial result cards should render progressively as the stream arrives — do not wait for the full response before showing anything.
- The Scenario Builder sliders update local React state and recompute the Health Score client-side. A debounced call to `/api/agent/reanalyze` updates eligibility impact.

---

## Testing

- Test tools individually by calling their `execute` functions with mock parameters.
- Test Route Handlers using the Next.js dev server and curl/Postman.
- For LLM-dependent tests, use recorded API responses to avoid burning tokens.
- Critical path to test: intake form → digital twin construction → trial search → eligibility analysis → result display.

---

## Common Pitfalls

1. **Don't call `streamText` from client components.** It runs server-side only. Use `useChat` on the client to connect to a Route Handler that calls `streamText`.
2. **Don't forget `maxSteps` in `streamText`.** Without it, Claude makes one tool call and stops. ClinIQ needs up to 10 steps for multi-registry search + analysis.
3. **Don't return raw API responses from tools.** Always normalize into the unified trial schema. Claude's analysis quality depends on consistent input format.
4. **Don't put API keys in client-side code.** All API calls happen in Route Handlers (server-side). Environment variables without `NEXT_PUBLIC_` prefix are server-only.
5. **Don't use `generateText` when you need streaming.** Use `streamText` for any response that should render progressively in the UI.
6. **Don't create new agent endpoints without updating this file.** Keep the project structure section current.

---

## Deployment

- Deploy to Vercel via `git push` to the connected repository.
- All environment variables must be set in Vercel's project settings (Settings > Environment Variables).
- The free Vercel Hobby plan is sufficient for hackathon. Edge functions and CRON jobs require the Pro plan ($20/mo) at scale.
- Vercel automatically builds and deploys on push to `main`.

---

## Key Dependencies

```json
{
  "ai": "latest",
  "@ai-sdk/anthropic": "latest",
  "zod": "^3.22",
  "next": "^14",
  "react": "^18",
  "tailwindcss": "^3.4",
  "@radix-ui/react-*": "shadcn/ui peer deps"
}
```

Run `npm install ai @ai-sdk/anthropic zod` if these are not yet in the project.
