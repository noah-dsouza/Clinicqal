 ClinIQ

AI-powered clinical trial matching and digital twin health platform.

## What it does

ClinIQ builds a **digital twin** from a patient's health profile — labs, vitals, diagnosis, medications, lifestyle — and uses it to:

- Match patients to real recruiting clinical trials from ClinicalTrials.gov with AI-powered eligibility analysis
- Surface relevant specialist doctors and care teams by location (US via NPI Registry, international via OpenStreetMap)
- Provide a context-aware AI health assistant that knows the patient's actual data
- Generate health scores across cardiovascular, metabolic, and functional domains

## Stack

| Layer | Tech |
|---|---|
| Frontend | React, TypeScript, Vite, Framer Motion, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| AI | Groq (llama-3.3-70b-versatile) |
| Trial Data | ClinicalTrials.gov API |
| Doctor Search | NPI Registry (US) + OpenStreetMap Overpass API (international) |

## Getting started

### 1. Install dependencies
```bash
npm run install:all
2. Set up environment variables

cp .env.example .env
Fill in your .env:


GROQ_API_KEY=your_groq_api_key_here
Get a free Groq API key at console.groq.com

3. Run
In two separate terminals from the repo root:


# Terminal 1 — Backend (port 3001)
npm run dev:backend

# Terminal 2 — Frontend (port 5173)
npm run dev:frontend
Open http://localhost:5173

Features
Digital Twin
Complete health profile built from a 6-step intake form or by uploading a health document (lab reports, discharge summaries). Calculates ECOG performance status, Charlson Comorbidity Index, BMI, and system-level health assessments automatically.

Clinical Trial Matching
Live search against ClinicalTrials.gov. Each trial gets an AI eligibility score based on the patient's actual age, diagnosis, labs, ECOG status, and medications. The eligibility drawer breaks down every inclusion/exclusion criterion with plain-English reasoning.

Find Support
Specialist doctor search by condition and location. US searches hit the NPI Registry (no API key needed). International searches use OpenStreetMap's Overpass API — no key needed, works for any city worldwide.

AI Chat
Groq-powered health assistant with full patient context auto-loaded. Answers questions about the patient's specific labs, scores, medications, and eligibility — not generic responses.

Demo Mode
Hit Demo Mode on the login page to skip intake and load a pre-built patient (58M, Type 2 Diabetes + hypertension + CKD) directly into the dashboard.

Project structure

cliniq/
├── frontend/          # React/Vite app
│   └── src/
│       ├── app/       # Components, pages
│       ├── context/   # DigitalTwinContext
│       ├── hooks/     # useIntakeForm
│       └── types/     # Shared types
├── backend/           # Express API
│   └── src/
│       ├── routes/    # chat, eligibility, trials, doctors, demo
│       ├── services/  # groqService, doctorSearchService, digitalTwinBuilder
│       └── types/     # Shared types
└── .env.example
