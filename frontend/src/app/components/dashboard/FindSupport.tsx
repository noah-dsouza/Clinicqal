import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useDigitalTwin } from "../../../context/DigitalTwinContext";
import { DigitalTwin } from "../../../types/digitalTwin";

// ─── Types ─────────────────────────────────────────────────────────────────

interface TrialMatch {
  id: string;
  title: string;
  condition: string;
  phase: string;
  sponsor: string;
  location: string;
  status: "Recruiting" | "Not yet recruiting" | "Active, not recruiting";
  matchScore: number;
  matchReason: string;
  tags: string[];
  description: string;
  whyQualified: string;
  exclusionFactors: string[];
  studyType: string;
  contact: string;
  eligibilityHighlights: string[];
  url: string;
}

interface ProviderMatch {
  id: string;
  name: string;
  specialty: string;
  credentials: string;
  location: string;
  distance: string;
  matchReason: string;
  tags: string[];
  telehealth: boolean;
  acceptingPatients: boolean;
  phone: string;
  address: string;
  focus: string[];
  relevanceNote: string;
  insuranceAccepted: string[];
}

type FilterCategory = "all" | "high" | "medium" | "low";

// ─── Mock data generators ────────────────────────────────────────────────

function generateTrials(twin: DigitalTwin): TrialMatch[] {
  const condition = twin.intake.diagnosis.primary_condition;
  const stage = twin.intake.diagnosis.stage;
  const labs = twin.intake.labs;
  const age = twin.intake.demographics.age;

  const hba1c = labs.find((l) => l.name.toLowerCase().includes("hba1c") || l.name.toLowerCase().includes("hemoglobin a1c"));
  const creatinine = labs.find((l) => l.name.toLowerCase().includes("creatinine"));

  const conditionLower = condition.toLowerCase();
  const isCancer = conditionLower.includes("cancer") || conditionLower.includes("carcinoma") || conditionLower.includes("lymphoma") || conditionLower.includes("leukemia") || conditionLower.includes("melanoma") || conditionLower.includes("tumor");
  const isDiabetes = conditionLower.includes("diabetes") || conditionLower.includes("diabetic") || (hba1c && hba1c.value > 6.5);
  const isCardiac = conditionLower.includes("cardiac") || conditionLower.includes("heart") || conditionLower.includes("coronary") || conditionLower.includes("atrial");
  const isKidney = conditionLower.includes("kidney") || conditionLower.includes("renal") || conditionLower.includes("nephro") || (creatinine && creatinine.value > 1.4);

  const trials: TrialMatch[] = [];

  if (isCancer) {
    trials.push(
      {
        id: "NCT05234891",
        title: `Pembrolizumab Plus Chemotherapy in Advanced ${condition} — KEYNOTE-C34`,
        condition,
        phase: "Phase 3",
        sponsor: "Merck Sharp & Dohme LLC",
        location: "Memorial Sloan Kettering Cancer Center, New York, NY",
        status: "Recruiting",
        matchScore: stage && stage.toLowerCase().includes("iii") ? 87 : stage && stage.toLowerCase().includes("iv") ? 91 : 78,
        matchReason: `${condition} diagnosis with matching stage criteria`,
        tags: [`Matched: ${condition}`, stage ? `Stage ${stage}` : "Stage applicable", "Immunotherapy trial"],
        description: "A randomized, double-blind, placebo-controlled Phase 3 study evaluating pembrolizumab (MK-3475) in combination with standard chemotherapy as first-line therapy for participants with advanced or metastatic disease. The study aims to determine if combination immunotherapy improves overall survival compared to chemotherapy alone.",
        whyQualified: `Your diagnosis of ${condition}${stage ? ` at ${stage}` : ""} and ECOG status of ${twin.ecog_estimate} (${twin.ecog_estimate <= 1 ? "meets eligibility" : "may need review"}) aligns with the enrollment criteria. Age ${age} falls within the target range.`,
        exclusionFactors: twin.ecog_estimate > 2 ? ["ECOG performance status > 2 may exclude eligibility — your score is " + twin.ecog_estimate] : ["Review prior immunotherapy history", "Active autoimmune conditions"],
        studyType: "Interventional (randomized)",
        contact: "trials@mskcc.org · (212) 639-2000",
        eligibilityHighlights: ["Age 18+", `ECOG 0–${twin.ecog_estimate <= 1 ? "1 ✓" : "2 (verify)"}`, "Histologically confirmed diagnosis", "No prior systemic therapy"],
        url: "https://clinicaltrials.gov",
      },
      {
        id: "NCT04892341",
        title: `Targeted Therapy with Biomarker-Driven Selection for ${condition}`,
        condition,
        phase: "Phase 2",
        sponsor: "National Cancer Institute (NCI)",
        location: "MD Anderson Cancer Center, Houston, TX",
        status: "Recruiting",
        matchScore: 74,
        matchReason: "Biomarker profile may qualify — molecular testing recommended",
        tags: ["Biomarker-driven", "Targeted therapy", "NCI sponsored"],
        description: "An open-label Phase 2 basket trial examining the efficacy of targeted agents matched to tumor molecular profiles across multiple solid tumor types. Participants undergo next-generation sequencing and receive matched therapy based on actionable genomic alterations.",
        whyQualified: "Your condition and health profile suggest you may harbor actionable mutations. Molecular profiling would confirm eligibility. ECOG and age criteria appear compatible.",
        exclusionFactors: ["Molecular profiling required before enrollment", "Prior targeted therapy may disqualify"],
        studyType: "Interventional (open-label)",
        contact: "ctrefer@mdanderson.org · (877) 632-6789",
        eligibilityHighlights: ["Solid tumor diagnosis", "Adequate organ function", "No prior targeted therapy for same alteration"],
        url: "https://clinicaltrials.gov",
      }
    );
  }

  if (isDiabetes) {
    trials.push(
      {
        id: "NCT05112938",
        title: "Tirzepatide vs. Semaglutide for Glycemic Control and Cardiovascular Outcomes",
        condition: "Type 2 Diabetes Mellitus",
        phase: "Phase 3",
        sponsor: "Eli Lilly and Company",
        location: "Joslin Diabetes Center, Boston, MA",
        status: "Recruiting",
        matchScore: hba1c && hba1c.value > 7.5 ? 89 : 76,
        matchReason: hba1c ? `HbA1c of ${hba1c.value}% suggests suboptimal control — study targets this population` : "Diabetes diagnosis matches inclusion criteria",
        tags: [hba1c ? `HbA1c ${hba1c.value}%` : "Diabetes match", "GLP-1 therapy", "Cardiovascular outcomes"],
        description: "SURPASS-CVOT is a landmark cardiovascular outcomes trial comparing the efficacy and safety of tirzepatide versus semaglutide in reducing major adverse cardiovascular events (MACE) in adults with type 2 diabetes and established cardiovascular disease or high risk.",
        whyQualified: `${hba1c ? `Your HbA1c of ${hba1c.value}% indicates suboptimal glycemic control matching the target population. ` : ""}Your diabetes diagnosis and age (${age}) are consistent with eligibility.`,
        exclusionFactors: ["eGFR < 15 mL/min/1.73m² may exclude", "Prior GLP-1 use within 90 days"],
        studyType: "Interventional (active comparator)",
        contact: "diabetes.trials@joslin.harvard.edu · (617) 309-2400",
        eligibilityHighlights: ["Type 2 diabetes ≥ 1 year", `HbA1c 7.5–11% ${hba1c && hba1c.value >= 7.5 ? "✓" : ""}`, "Age 18–80", "BMI 25–50"],
        url: "https://clinicaltrials.gov",
      }
    );
  }

  if (isCardiac) {
    trials.push(
      {
        id: "NCT05001893",
        title: "CARDIA-AI: Machine Learning–Guided Antiarrhythmic Therapy Optimization",
        condition: "Cardiac Arrhythmia",
        phase: "Phase 2",
        sponsor: "American Heart Association / Stanford Cardiovascular",
        location: "Stanford Medical Center, Palo Alto, CA",
        status: "Recruiting",
        matchScore: 81,
        matchReason: "Cardiac condition with appropriate age and health profile",
        tags: ["Cardiac match", "AI-guided therapy", "Arrhythmia focus"],
        description: "A prospective cohort study using continuous wearable monitoring and ML algorithms to personalize antiarrhythmic drug selection. Participants wear a study device for 90 days while the AI system analyzes rhythm patterns and recommends optimized therapy adjustments.",
        whyQualified: "Your cardiac diagnosis and vitals profile are consistent with the study's target population. The non-interventional nature makes this accessible regardless of comorbidities.",
        exclusionFactors: ["Permanent pacemaker users may be excluded", "Recent cardiac surgery within 3 months"],
        studyType: "Observational + Interventional hybrid",
        contact: "cardiatrials@stanford.edu · (650) 736-1111",
        eligibilityHighlights: ["Documented arrhythmia", "Not on class I/III antiarrhythmics currently", "Willing to wear monitor"],
        url: "https://clinicaltrials.gov",
      }
    );
  }

  if (isKidney) {
    trials.push(
      {
        id: "NCT04823104",
        title: "FIDELIO-DKD Extension: Finerenone in Chronic Kidney Disease",
        condition: "Chronic Kidney Disease",
        phase: "Phase 3 Extension",
        sponsor: "Bayer AG",
        location: "Cleveland Clinic, Cleveland, OH",
        status: "Recruiting",
        matchScore: creatinine && creatinine.value > 1.4 ? 85 : 72,
        matchReason: creatinine ? `Creatinine ${creatinine.value} ${creatinine.unit} suggests reduced kidney function matching study criteria` : "Kidney condition matches enrollment",
        tags: [creatinine ? `Creatinine ${creatinine.value}` : "Kidney match", "Nephrology", "Cardio-renal protection"],
        description: "Extension study of the landmark FIDELIO-DKD trial evaluating the long-term safety and efficacy of finerenone (a novel non-steroidal mineralocorticoid receptor antagonist) in slowing CKD progression and reducing cardiovascular events in patients with CKD and type 2 diabetes.",
        whyQualified: `${creatinine ? `Your creatinine level of ${creatinine.value} ${creatinine.unit} suggests kidney function that matches the study's target eGFR range. ` : ""}The combination of kidney disease markers aligns with eligibility.`,
        exclusionFactors: ["eGFR < 25 mL/min/1.73m² (extension phase)", "Potassium > 5.0 mEq/L at screening"],
        studyType: "Interventional (randomized extension)",
        contact: "kidneytrials@ccf.org · (800) 223-2273",
        eligibilityHighlights: ["CKD Stage 2–4", "Albuminuria ≥ 30 mg/g", "Stable ACE/ARB therapy"],
        url: "https://clinicaltrials.gov",
      }
    );
  }

  // Generic wellness/lifestyle trial always added
  trials.push({
    id: "NCT05445621",
    title: "Precision Digital Health Intervention for Chronic Disease Self-Management",
    condition: condition,
    phase: "Phase 2",
    sponsor: "NIH National Institute on Aging",
    location: "Multiple sites — telehealth enrollment available",
    status: "Recruiting",
    matchScore: 69,
    matchReason: "Multi-condition digital health study — broad eligibility",
    tags: ["Digital health", "Telehealth", "Self-management", "Lifestyle"],
    description: "A multi-site randomized trial testing a personalized AI-driven digital health platform to improve self-management of chronic conditions through tailored lifestyle coaching, real-time health monitoring, and clinical decision support. Remote participation available nationwide.",
    whyQualified: `Your health profile and diagnosis of ${condition} qualify you for this broad-eligibility digital health intervention. Remote participation means no travel required.`,
    exclusionFactors: ["Active enrollment in conflicting study"],
    studyType: "Interventional (digital, remote)",
    contact: "digitalhealth@nia.nih.gov · (800) 222-2225",
    eligibilityHighlights: ["Age 18+", "Smartphone access", "1+ chronic condition", "English or Spanish speaking"],
    url: "https://clinicaltrials.gov",
  });

  return trials;
}

function generateProviders(twin: DigitalTwin): ProviderMatch[] {
  const condition = twin.intake.diagnosis.primary_condition;
  const conditionLower = condition.toLowerCase();

  const isCancer = conditionLower.includes("cancer") || conditionLower.includes("carcinoma") || conditionLower.includes("lymphoma") || conditionLower.includes("leukemia") || conditionLower.includes("melanoma");
  const isDiabetes = conditionLower.includes("diabetes") || conditionLower.includes("diabetic");
  const isCardiac = conditionLower.includes("cardiac") || conditionLower.includes("heart") || conditionLower.includes("coronary");
  const isKidney = conditionLower.includes("kidney") || conditionLower.includes("renal") || conditionLower.includes("nephro");

  const providers: ProviderMatch[] = [];

  // Always include PCP
  providers.push({
    id: "p-001",
    name: "Dr. Sarah Chen, MD",
    specialty: "Internal Medicine / Primary Care",
    credentials: "MD, FACP — Board Certified Internal Medicine",
    location: "CareFirst Medical Group",
    distance: "2.1 mi",
    matchReason: `Coordinates holistic care for ${condition} and comorbidities`,
    tags: ["Primary care", "Care coordinator", "Preventive medicine"],
    telehealth: true,
    acceptingPatients: true,
    phone: "(555) 482-0100",
    address: "1240 Medical Plaza Dr, Suite 201",
    focus: ["Chronic disease management", "Preventive care", "Lab monitoring", "Medication management"],
    relevanceNote: "Ideal as your primary care coordinator — can manage referrals, labs, and medication adjustments across all your conditions.",
    insuranceAccepted: ["Blue Cross", "Aetna", "UnitedHealth", "Cigna", "Medicare"],
  });

  if (isCancer) {
    providers.push(
      {
        id: "p-c01",
        name: "Dr. Marcus Webb, MD, PhD",
        specialty: "Medical Oncology",
        credentials: "MD, PhD, FASCO — Board Certified Medical Oncology",
        location: "University Cancer Center",
        distance: "4.8 mi",
        matchReason: `Specializes in ${condition} — trial enrollment coordinator`,
        tags: [`${condition} specialist`, "Clinical trial coordinator", "Immunotherapy"],
        telehealth: true,
        acceptingPatients: true,
        phone: "(555) 628-4400",
        address: "800 University Medical Drive, Oncology Pavilion",
        focus: ["Solid tumor oncology", "Immunotherapy", "Clinical trial matching", "Second opinions"],
        relevanceNote: "Highly relevant — specializes in your diagnosis and actively enrolls patients in the trials matched above. Can review trial eligibility in-depth.",
        insuranceAccepted: ["Blue Cross", "Aetna", "Medicare", "Medicaid"],
      },
      {
        id: "p-c02",
        name: "Dr. Priya Sharma, MD",
        specialty: "Hematology / Oncology",
        credentials: "MD — Board Certified Hematology & Medical Oncology",
        location: "Regional Cancer Alliance",
        distance: "7.2 mi",
        matchReason: "Oncology second opinion specialist — complex case review",
        tags: ["Second opinion", "Molecular oncology", "Hematologic malignancies"],
        telehealth: false,
        acceptingPatients: true,
        phone: "(555) 301-7700",
        address: "2200 Oncology Way, Cancer Care Center",
        focus: ["Molecular profiling interpretation", "Treatment planning", "Second opinion consultations"],
        relevanceNote: "Recommended for a second opinion on treatment or trial eligibility. Expertise in molecular markers may unlock additional trial options.",
        insuranceAccepted: ["Most major insurers", "Medicare"],
      }
    );
  }

  if (isDiabetes) {
    providers.push(
      {
        id: "p-d01",
        name: "Dr. James Okafor, MD",
        specialty: "Endocrinology & Metabolism",
        credentials: "MD — Board Certified Endocrinology, Diabetes & Metabolism",
        location: "Diabetes & Endocrine Associates",
        distance: "3.3 mi",
        matchReason: "Endocrinologist specializing in complex diabetes management",
        tags: ["Diabetes specialist", "HbA1c optimization", "Insulin management"],
        telehealth: true,
        acceptingPatients: true,
        phone: "(555) 554-2200",
        address: "445 Health Sciences Blvd, Suite 310",
        focus: ["Type 1 & Type 2 diabetes", "CGM setup", "Insulin pump management", "Thyroid disorders"],
        relevanceNote: "Ideal for optimizing your glucose control — particularly relevant given your lab values. Can also facilitate enrollment in diabetes trials.",
        insuranceAccepted: ["Blue Cross", "Cigna", "Aetna", "UnitedHealth"],
      },
      {
        id: "p-d02",
        name: "Rachel Torres, RDN, CDCES",
        specialty: "Registered Dietitian / Diabetes Educator",
        credentials: "RDN, CDCES — Certified Diabetes Care & Education Specialist",
        location: "Integrative Health Partners",
        distance: "1.9 mi",
        matchReason: "Nutrition and lifestyle optimization for diabetes management",
        tags: ["Medical nutrition therapy", "Diabetes education", "Lifestyle coach"],
        telehealth: true,
        acceptingPatients: true,
        phone: "(555) 218-9900",
        address: "88 Wellness Court, Suite 105",
        focus: ["Carbohydrate management", "Meal planning for glycemic control", "Behavioral nutrition counseling"],
        relevanceNote: "Highly recommended — diet quality improvements are among the highest-impact interventions for your health markers.",
        insuranceAccepted: ["Most major insurers", "Medicare Part B"],
      }
    );
  }

  if (isCardiac) {
    providers.push({
      id: "p-h01",
      name: "Dr. Angela Foster, MD, FACC",
      specialty: "Cardiology",
      credentials: "MD, FACC — Board Certified Cardiology & Electrophysiology",
      location: "Heart & Vascular Institute",
      distance: "5.1 mi",
      matchReason: "Cardiologist with expertise in your cardiac condition",
      tags: ["Cardiology", "Electrophysiology", "Cardiac rehab"],
      telehealth: true,
      acceptingPatients: true,
      phone: "(555) 740-6600",
      address: "1100 Heart Center Drive",
      focus: ["Arrhythmia management", "Heart failure", "Cardiac imaging", "Preventive cardiology"],
      relevanceNote: "Direct specialty match for your cardiac diagnosis. Can provide comprehensive evaluation, manage medications, and assess for trial eligibility.",
      insuranceAccepted: ["Blue Cross", "Aetna", "Medicare", "UnitedHealth"],
    });
  }

  if (isKidney) {
    providers.push({
      id: "p-k01",
      name: "Dr. Robert Nkemdirim, MD",
      specialty: "Nephrology",
      credentials: "MD — Board Certified Nephrology",
      location: "Kidney Care Specialists",
      distance: "6.4 mi",
      matchReason: "Nephrologist matching your kidney function markers",
      tags: ["Nephrology", "CKD management", "Dialysis planning"],
      telehealth: false,
      acceptingPatients: true,
      phone: "(555) 391-5500",
      address: "700 Nephrology Center Pkwy",
      focus: ["CKD progression management", "Hypertension in kidney disease", "Pre-dialysis planning", "Kidney transplant evaluation"],
      relevanceNote: "Essential if your creatinine/eGFR indicates meaningful kidney function decline. Also a gateway to the kidney-related trials matched above.",
      insuranceAccepted: ["Most major insurers", "Medicare", "Medicaid"],
    });
  }

  // Mental health / support always suggested if any conditions
  providers.push({
    id: "p-mh01",
    name: "Dr. Leila Nazari, PsyD",
    specialty: "Health Psychology / Oncology Support",
    credentials: "PsyD — Licensed Clinical Psychologist, Health Psychology Specialty",
    location: "Mind & Body Wellness Center",
    distance: "Telehealth available",
    matchReason: "Psychological support for chronic illness and care navigation",
    tags: ["Mental health", "Chronic illness support", "Care navigation"],
    telehealth: true,
    acceptingPatients: true,
    phone: "(555) 119-4400",
    address: "Telehealth — nationwide",
    focus: ["Adjustment to chronic illness", "Anxiety and depression related to health", "Health-related decision support", "Caregiver support"],
    relevanceNote: "Highly recommended alongside medical care — mental health support is a critical and often overlooked component of managing complex health conditions.",
    insuranceAccepted: ["Blue Cross", "Aetna", "Cigna", "Self-pay sliding scale"],
  });

  return providers.slice(0, 6);
}

// ─── Score helpers ──────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return "#34D399";
  if (score >= 60) return "#FBBF24";
  return "#F87171";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "High Match";
  if (score >= 60) return "Good Match";
  return "Possible Match";
}

// ─── ScoreRing ──────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const color = scoreColor(score);
  const radius = (size - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
        {score}
      </div>
    </div>
  );
}

// ─── Tag chip ───────────────────────────────────────────────────────────────

function Tag({ label, color = "#14B8A6" }: { label: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {label}
    </span>
  );
}

// ─── Expandable Trial Card ──────────────────────────────────────────────────

function TrialMatchCard({ trial, expanded, onToggle }: { trial: TrialMatch; expanded: boolean; onToggle: () => void }) {
  const color = scoreColor(trial.matchScore);
  const label = scoreLabel(trial.matchScore);

  return (
    <div
      className="rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden"
      style={{
        background: expanded ? "#1a2744" : "#1E293B",
        borderColor: expanded ? `${color}50` : "rgba(255,255,255,0.07)",
        boxShadow: expanded ? `0 0 24px ${color}18` : "none",
      }}
      onClick={onToggle}
    >
      {/* Summary row */}
      <div className="p-4 flex items-start gap-3">
        <ScoreRing score={trial.matchScore} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
            >
              {label}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[rgba(96,165,250,0.12)] text-[#60A5FA] border border-[rgba(96,165,250,0.2)]">
              {trial.phase}
            </span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: trial.status === "Recruiting" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)",
                color: trial.status === "Recruiting" ? "#34D399" : "#FBBF24",
                border: `1px solid ${trial.status === "Recruiting" ? "rgba(52,211,153,0.25)" : "rgba(251,191,36,0.25)"}`,
              }}
            >
              {trial.status}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[#F1F5F9] leading-snug line-clamp-2 mb-1">
            {trial.title}
          </h3>
          <p className="text-xs text-[#64748B] mb-2">{trial.sponsor}</p>
          <div className="flex items-center gap-1.5 mb-2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#64748B" strokeWidth="2" />
              <circle cx="12" cy="10" r="3" stroke="#64748B" strokeWidth="2" />
            </svg>
            <span className="text-[10px] text-[#64748B]">{trial.location}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {trial.tags.slice(0, 3).map((t, i) => (
              <Tag key={i} label={t} color="#14B8A6" />
            ))}
          </div>
        </div>
        <div
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300"
          style={{ background: "rgba(255,255,255,0.05)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Expanded detail */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? "1200px" : "0px", opacity: expanded ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pb-5 border-t border-[rgba(255,255,255,0.06)] pt-4 space-y-4">
          <div>
            <h4 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">About This Trial</h4>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">{trial.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl p-3 bg-[rgba(52,211,153,0.06)] border border-[rgba(52,211,153,0.15)]">
              <h4 className="text-[10px] font-semibold text-[#34D399] uppercase tracking-wider mb-1.5">Why You May Qualify</h4>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">{trial.whyQualified}</p>
            </div>
            {trial.exclusionFactors.length > 0 && (
              <div className="rounded-xl p-3 bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.15)]">
                <h4 className="text-[10px] font-semibold text-[#FBBF24] uppercase tracking-wider mb-1.5">Potential Exclusion Factors</h4>
                <ul className="space-y-1">
                  {trial.exclusionFactors.map((f, i) => (
                    <li key={i} className="text-xs text-[#CBD5E1] flex items-start gap-1.5">
                      <span className="text-[#FBBF24] mt-0.5">⚠</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Eligibility Highlights</h4>
            <div className="flex flex-wrap gap-1.5">
              {trial.eligibilityHighlights.map((e, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-[rgba(255,255,255,0.05)] text-[#94A3B8] border border-[rgba(255,255,255,0.08)]">{e}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Study Type</span>
              <p className="text-[#CBD5E1] mt-0.5">{trial.studyType}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Contact</span>
              <p className="text-[#CBD5E1] mt-0.5">{trial.contact}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <a
              href={trial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-center transition-all"
              style={{ background: "rgba(20,184,166,0.12)", color: "#14B8A6", border: "1px solid rgba(20,184,166,0.25)" }}
              onClick={(e) => e.stopPropagation()}
            >
              View on ClinicalTrials.gov ↗
            </a>
            <button
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.25)" }}
              onClick={(e) => { e.stopPropagation(); }}
            >
              Ask AI About This Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Expandable Provider Card ───────────────────────────────────────────────

function ProviderMatchCard({ provider, expanded, onToggle }: { provider: ProviderMatch; expanded: boolean; onToggle: () => void }) {
  return (
    <div
      className="rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden"
      style={{
        background: expanded ? "#1a2744" : "#1E293B",
        borderColor: expanded ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.07)",
        boxShadow: expanded ? "0 0 24px rgba(20,184,166,0.1)" : "none",
      }}
      onClick={onToggle}
    >
      {/* Summary row */}
      <div className="p-4 flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-lg font-bold"
          style={{ background: "rgba(20,184,166,0.12)", color: "#14B8A6", border: "1px solid rgba(20,184,166,0.2)" }}
        >
          {provider.name.charAt(3)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#F1F5F9] mb-0.5">{provider.name}</h3>
          <p className="text-xs text-[#14B8A6] mb-1">{provider.specialty}</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#64748B" strokeWidth="2" />
                <circle cx="12" cy="10" r="3" stroke="#64748B" strokeWidth="2" />
              </svg>
              <span className="text-[10px] text-[#64748B]">{provider.distance}</span>
            </div>
            {provider.telehealth && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(96,165,250,0.1)] text-[#60A5FA] border border-[rgba(96,165,250,0.2)]">Telehealth</span>
            )}
            {provider.acceptingPatients && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(52,211,153,0.1)] text-[#34D399] border border-[rgba(52,211,153,0.2)]">Accepting</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {provider.tags.slice(0, 3).map((t, i) => (
              <Tag key={i} label={t} color="#60A5FA" />
            ))}
          </div>
        </div>
        <div
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300"
          style={{ background: "rgba(255,255,255,0.05)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Expanded detail */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? "1200px" : "0px", opacity: expanded ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pb-5 border-t border-[rgba(255,255,255,0.06)] pt-4 space-y-4">
          <div className="rounded-xl p-3 bg-[rgba(20,184,166,0.06)] border border-[rgba(20,184,166,0.15)]">
            <h4 className="text-[10px] font-semibold text-[#14B8A6] uppercase tracking-wider mb-1">Why This Match</h4>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">{provider.relevanceNote}</p>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Care Focus Areas</h4>
            <div className="flex flex-wrap gap-1.5">
              {provider.focus.map((f, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-[rgba(255,255,255,0.05)] text-[#94A3B8] border border-[rgba(255,255,255,0.08)]">{f}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Credentials</span>
              <p className="text-[#CBD5E1] mt-0.5">{provider.credentials}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Address</span>
              <p className="text-[#CBD5E1] mt-0.5">{provider.address}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Phone</span>
              <p className="text-[#14B8A6] mt-0.5">{provider.phone}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Insurance</span>
              <p className="text-[#CBD5E1] mt-0.5">{provider.insuranceAccepted.slice(0, 3).join(", ")}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(20,184,166,0.12)", color: "#14B8A6", border: "1px solid rgba(20,184,166,0.25)" }}
            >
              Request Appointment
            </button>
            <button
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.25)" }}
            >
              Ask AI About This Provider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI Assistant Panel ──────────────────────────────────────────────────────

const AI_STARTERS = [
  "Why are these trials recommended for me?",
  "What questions should I ask a trial coordinator?",
  "Which specialist should I see first?",
  "How can I improve my trial eligibility?",
  "What do my lab results mean for these matches?",
];

function getAIResponse(question: string, twin: DigitalTwin): string {
  const cond = twin.intake.diagnosis.primary_condition;
  const q = question.toLowerCase();
  if (q.includes("trial") && q.includes("recommend")) {
    return `These trials were matched based on your diagnosis of **${cond}**, your ECOG performance status of **${twin.ecog_estimate}**, and your current lab values. The matching algorithm considers inclusion criteria like age, diagnosis stage, organ function, and prior treatments. Higher match scores indicate more criteria aligned with your profile.`;
  }
  if (q.includes("questions") && (q.includes("trial") || q.includes("coordinator"))) {
    return `Great question. When speaking with a trial coordinator, ask: (1) What are the study visits and time commitment? (2) Is travel reimbursed? (3) What happens if I need to stop the trial? (4) Will my regular doctor be kept informed? (5) What are the most common side effects? (6) Is there a placebo group, and what are my chances of receiving active treatment?`;
  }
  if (q.includes("specialist") || q.includes("doctor") || q.includes("first")) {
    return `Based on your profile, I'd suggest starting with your **primary care physician** for a referral coordination plan. For your specific condition (${cond}), an early appointment with the matched specialist would be most impactful. Bring your lab results, medication list, and any imaging reports to the first visit.`;
  }
  if (q.includes("eligibility") || q.includes("improve")) {
    return `Your trial eligibility can improve by: optimizing your ECOG performance status through light exercise, stabilizing any abnormal lab values (especially renal and hepatic function), and ensuring adequate wash-out periods from recent treatments. Speak with your oncologist before making any medication changes specifically for trial eligibility.`;
  }
  if (q.includes("lab") || q.includes("result")) {
    const labs = twin.intake.labs;
    if (labs.length === 0) return "No labs are on file yet. Upload or enter your lab results so I can give you a more specific analysis of how they affect your trial eligibility.";
    const abnormal = labs.filter(l => (l.reference_low !== undefined && l.value < l.reference_low) || (l.reference_high !== undefined && l.value > l.reference_high));
    if (abnormal.length > 0) {
      return `You have ${abnormal.length} lab value(s) outside the reference range: ${abnormal.map(l => `**${l.name}** (${l.value} ${l.unit})`).join(", ")}. These can affect trial eligibility, particularly for organ function criteria. I recommend discussing these with your specialist before applying to trials.`;
    }
    return `Your recorded lab values appear within acceptable ranges. This is favorable for most trials — many require adequate organ function (renal, hepatic, hematologic) as a baseline. Continue monitoring and bring recent results to any trial screening appointment.`;
  }
  return `Based on your health profile for **${cond}**, I can help you navigate your options. The trials and providers shown were matched specifically to your data. Would you like me to explain any specific trial or provider recommendation in more detail? You can also ask about next steps, questions to ask your doctor, or how to prepare for a trial screening.`;
}

function AIAssistantPanel({ twin, onClose }: { twin: DigitalTwin; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    {
      role: "ai",
      text: `Hi! I'm your care navigator. I can explain why specific trials or providers were matched to you, help you prepare for appointments, and guide your next steps. What would you like to know about your matches?`,
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg = { role: "user" as const, text };
    const aiMsg = { role: "ai" as const, text: getAIResponse(text, twin) };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  return (
    <div
      className="fixed right-0 top-0 h-full w-full sm:w-[380px] z-50 flex flex-col"
      style={{ background: "#0F172A", borderLeft: "1px solid rgba(167,139,250,0.2)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[rgba(255,255,255,0.06)]"
        style={{ background: "rgba(167,139,250,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" stroke="#A78BFA" strokeWidth="1.5" />
              <path d="M12 16v-4M12 8h.01" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F1F5F9]">Care Navigator AI</p>
            <p className="text-[10px] text-[#64748B]">Explains your matches & next steps</p>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#F1F5F9] hover:bg-[rgba(255,255,255,0.06)] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed"
              style={
                m.role === "user"
                  ? { background: "rgba(20,184,166,0.15)", color: "#CBD5E1", border: "1px solid rgba(20,184,166,0.25)", borderBottomRightRadius: 4 }
                  : { background: "rgba(167,139,250,0.08)", color: "#CBD5E1", border: "1px solid rgba(167,139,250,0.15)", borderBottomLeftRadius: 4 }
              }
            >
              {m.text.split("**").map((part, j) =>
                j % 2 === 1 ? <strong key={j} style={{ color: "#F1F5F9" }}>{part}</strong> : part
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Starters */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-[#64748B] mb-2 uppercase tracking-wider">Quick questions</p>
          <div className="flex flex-col gap-1.5">
            {AI_STARTERS.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="text-left px-3 py-2 rounded-xl text-xs text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)]">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your matches..."
            className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[rgba(167,139,250,0.4)] transition-colors"
          />
          <button
            type="submit"
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.3)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function FindSupport() {
  const { twin } = useDigitalTwin();
  const [activeSection, setActiveSection] = useState<"trials" | "care">("trials");
  const [expandedTrial, setExpandedTrial] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [aiOpen, setAiOpen] = useState(false);

  if (!twin) return null;

  const trials = generateTrials(twin);
  const providers = generateProviders(twin);

  const filteredTrials = trials.filter((t) => {
    if (filter === "high") return t.matchScore >= 80;
    if (filter === "medium") return t.matchScore >= 60 && t.matchScore < 80;
    if (filter === "low") return t.matchScore < 60;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: "#0F172A" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#F1F5F9]">Find Support</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Matched trials & care providers based on your health profile
              </p>
            </div>
            <button
              onClick={() => setAiOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.25)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Care Navigator AI
            </button>
          </div>

          {/* Health summary strip */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Condition", value: twin.intake.diagnosis.primary_condition.split(" ").slice(0, 3).join(" "), color: "#14B8A6" },
              { label: "ECOG Status", value: `${twin.ecog_estimate} — ${["Fully active", "Light work", "Self-care only", "Limited self-care", "Bedridden"][twin.ecog_estimate] ?? "—"}`, color: twin.ecog_estimate <= 1 ? "#34D399" : twin.ecog_estimate <= 2 ? "#FBBF24" : "#F87171" },
              { label: "Trial Matches", value: `${trials.length} found`, color: "#60A5FA" },
              { label: "Care Matches", value: `${providers.length} providers`, color: "#A78BFA" },
            ].map((chip, i) => (
              <div
                key={i}
                className="rounded-xl px-3 py-2.5 border"
                style={{ background: `${chip.color}0d`, borderColor: `${chip.color}20` }}
              >
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: `${chip.color}99` }}>{chip.label}</p>
                <p className="text-xs font-bold truncate" style={{ color: chip.color }}>{chip.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {[
            { id: "trials" as const, label: "Clinical Trial Matches", count: filteredTrials.length },
            { id: "care" as const, label: "Care Team Matches", count: providers.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={
                activeSection === tab.id
                  ? { background: tab.id === "trials" ? "rgba(96,165,250,0.15)" : "rgba(20,184,166,0.15)", color: tab.id === "trials" ? "#60A5FA" : "#14B8A6", border: `1px solid ${tab.id === "trials" ? "rgba(96,165,250,0.3)" : "rgba(20,184,166,0.3)"}` }
                  : { color: "#64748B" }
              }
            >
              {tab.label}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.08)", color: activeSection === tab.id ? "inherit" : "#64748B" }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters (trials only) */}
        {activeSection === "trials" && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Filter:</span>
            {(["all", "high", "medium", "low"] as FilterCategory[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1 rounded-full text-[10px] font-semibold transition-all"
                style={
                  filter === f
                    ? { background: f === "all" ? "rgba(96,165,250,0.2)" : f === "high" ? "rgba(52,211,153,0.2)" : f === "medium" ? "rgba(251,191,36,0.2)" : "rgba(248,113,113,0.2)", color: f === "all" ? "#60A5FA" : f === "high" ? "#34D399" : f === "medium" ? "#FBBF24" : "#F87171", border: `1px solid ${f === "all" ? "rgba(96,165,250,0.4)" : f === "high" ? "rgba(52,211,153,0.4)" : f === "medium" ? "rgba(251,191,36,0.4)" : "rgba(248,113,113,0.4)"}` }
                    : { background: "rgba(255,255,255,0.04)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {f === "all" ? "All Matches" : f === "high" ? "High Match (80+)" : f === "medium" ? "Good Match (60–79)" : "Possible (< 60)"}
              </button>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mb-4 px-3 py-2.5 rounded-xl" style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.12)" }}>
          <p className="text-[10px] text-[#94A3B8] leading-relaxed">
            <span className="text-[#F87171] font-semibold">Disclaimer: </span>
            These recommendations are for informational and research support purposes only. They do not constitute medical advice. Always consult a qualified healthcare provider before making decisions about trials or treatment.
          </p>
        </div>

        {/* Trial Cards */}
        {activeSection === "trials" && (
          <div className="space-y-3">
            {filteredTrials.length === 0 ? (
              <div className="py-16 text-center text-[#64748B] text-sm">
                No trials match this filter. Try "All Matches".
              </div>
            ) : (
              filteredTrials.map((trial, i) => (
                <motion.div
                  key={trial.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                >
                  <TrialMatchCard
                    trial={trial}
                    expanded={expandedTrial === trial.id}
                    onToggle={() => setExpandedTrial(expandedTrial === trial.id ? null : trial.id)}
                  />
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Provider Cards */}
        {activeSection === "care" && (
          <div className="space-y-3">
            {providers.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              >
                <ProviderMatchCard
                  provider={p}
                  expanded={expandedProvider === p.id}
                  onToggle={() => setExpandedProvider(expandedProvider === p.id ? null : p.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* AI Panel overlay */}
      {aiOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setAiOpen(false)} />
          <AIAssistantPanel twin={twin} onClose={() => setAiOpen(false)} />
        </>
      )}
    </div>
  );
}
