import { useState, useRef, useEffect } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useDigitalTwin } from "../../../context/DigitalTwinContext";
import { DigitalTwin } from "../../../types/digitalTwin";

interface DoctorResult {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  rating?: number;
  reviews?: number;
  website?: string;
  accepting_patients: boolean;
  distance?: string;
  source: string;
}

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

// ─── 3D Tilt wrapper ────────────────────────────────────────────────────────

function TiltCard({ children, active, borderColor, bg, shadow }: { children: React.ReactNode; active: boolean; borderColor: string; bg: string; shadow?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rawX = useSpring(0, { stiffness: 300, damping: 30 });
  const rawY = useSpring(0, { stiffness: 300, damping: 30 });
  const scale = useSpring(1, { stiffness: 300, damping: 30 });
  const [hovered, setHovered] = useState(false);

  const rotateX = useTransform(rawY, (v) => `${v}deg`);
  const rotateY = useTransform(rawX, (v) => `${v}deg`);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (active) return; // don't tilt when expanded
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(((e.clientX - rect.left) / rect.width - 0.5) * 16);
    rawY.set(((e.clientY - rect.top) / rect.height - 0.5) * -16);
  };

  const handleMouseEnter = () => { if (!active) { setHovered(true); scale.set(1.02); } };
  const handleMouseLeave = () => { setHovered(false); rawX.set(0); rawY.set(0); scale.set(1); };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: active ? "0deg" : rotateX,
        rotateY: active ? "0deg" : rotateY,
        scale: active ? 1 : scale,
        transformStyle: "preserve-3d",
        transformPerspective: 900,
        borderRadius: 16,
        border: `1px solid ${borderColor}`,
        background: bg,
        boxShadow: shadow ?? "none",
        overflow: "hidden",
        position: "relative",
        transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* gloss highlight */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.055) 0%, transparent 65%)",
          pointerEvents: "none",
          opacity: hovered && !active ? 1 : 0,
          transition: "opacity 0.25s",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}

// ─── Expandable Trial Card ──────────────────────────────────────────────────

function TrialMatchCard({ trial, expanded, onToggle }: { trial: TrialMatch; expanded: boolean; onToggle: () => void }) {
  const color = scoreColor(trial.matchScore);
  const label = scoreLabel(trial.matchScore);

  return (
    <TiltCard
      active={expanded}
      borderColor={expanded ? `${color}50` : "rgba(255,255,255,0.07)"}
      bg={expanded ? "#1a2744" : "#1E293B"}
      shadow={expanded ? `0 0 24px ${color}18` : undefined}
    >
    <div className="cursor-pointer" onClick={onToggle}>
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
    </TiltCard>
  );
}

// ─── Expandable Provider Card ───────────────────────────────────────────────

function ProviderMatchCard({ provider, expanded, onToggle }: { provider: ProviderMatch; expanded: boolean; onToggle: () => void }) {
  return (
    <TiltCard
      active={expanded}
      borderColor={expanded ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.07)"}
      bg={expanded ? "#1a2744" : "#1E293B"}
      shadow={expanded ? "0 0 24px rgba(20,184,166,0.1)" : undefined}
    >
    <div className="cursor-pointer" onClick={onToggle}>
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
    </TiltCard>
  );
}

// ─── Real Doctor Card ─────────────────────────────────────────────────────────

function RealDoctorCard({ doctor }: { doctor: DoctorResult }) {
  return (
    <TiltCard active={false} borderColor="rgba(20,184,166,0.15)" bg="#1E293B">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold"
            style={{ background: "rgba(20,184,166,0.12)", color: "#14B8A6", border: "1px solid rgba(20,184,166,0.2)" }}>
            {doctor.name.split(" ").filter((w: string) => w.startsWith("Dr") || w.length > 1).slice(1, 3).map((w: string) => w[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#F1F5F9] mb-0.5 truncate">{doctor.name}</h3>
            <p className="text-xs text-[#14B8A6] mb-1">{doctor.specialty}</p>
            <div className="flex items-center gap-3 flex-wrap">
              {doctor.rating && (
                <span className="text-[10px] text-[#FBBF24]">★ {doctor.rating.toFixed(1)}{doctor.reviews ? ` (${doctor.reviews})` : ""}</span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: doctor.accepting_patients ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)", color: doctor.accepting_patients ? "#34D399" : "#F87171" }}>
                {doctor.accepting_patients ? "Accepting patients" : "Not accepting"}
              </span>
              {doctor.distance && <span className="text-[10px] text-[#64748B]">{doctor.distance}</span>}
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-[10px] text-[#64748B] flex items-center gap-1.5">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#64748B" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="#64748B" strokeWidth="2"/></svg>
            {doctor.address}
          </p>
          <p className="text-[10px] text-[#94A3B8] flex items-center gap-1.5">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.44 2 2 0 0 1 3.55 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 17" stroke="#94A3B8" strokeWidth="2"/></svg>
            {doctor.phone}
          </p>
        </div>
        <div className="mt-3 flex gap-2">
          {doctor.website ? (
            <a href={doctor.website} target="_blank" rel="noopener noreferrer"
              className="flex-1 py-2 rounded-lg text-[10px] font-semibold text-center transition-all"
              style={{ background: "rgba(20,184,166,0.1)", color: "#14B8A6", border: "1px solid rgba(20,184,166,0.2)" }}>
              View Profile ↗
            </a>
          ) : (
            <div className="flex-1 py-2 rounded-lg text-[10px] font-semibold text-center"
              style={{ background: "rgba(255,255,255,0.04)", color: "#64748B" }}>
              No website
            </div>
          )}
          <div className="flex-1 py-2 rounded-lg text-[10px] font-semibold text-center"
            style={{ background: "rgba(96,165,250,0.1)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.2)" }}>
            {doctor.phone}
          </div>
        </div>
      </div>
    </TiltCard>
  );
}


// ─── Main Page ──────────────────────────────────────────────────────────────

export function FindSupport() {
  const { twin } = useDigitalTwin();
  const [activeSection, setActiveSection] = useState<"trials" | "care">("trials");
  const [expandedTrial, setExpandedTrial] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterCategory>("all");

  // Doctor search state
  const [locationInput, setLocationInput] = useState("");
  const [locationSubmitted, setLocationSubmitted] = useState("");
  const [doctors, setDoctors] = useState<DoctorResult[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);

  if (!twin) return null;

  const trials = generateTrials(twin);

  const filteredTrials = trials.filter((t) => {
    if (filter === "high") return t.matchScore >= 80;
    if (filter === "medium") return t.matchScore >= 60 && t.matchScore < 80;
    if (filter === "low") return t.matchScore < 60;
    return true;
  });

  const searchDoctors = async (loc: string) => {
    if (!loc.trim()) return;
    setDoctorsLoading(true);
    setDoctorsError(null);
    setLocationSubmitted(loc.trim());
    try {
      const params = new URLSearchParams({
        condition: twin.intake.diagnosis.primary_condition,
        location: loc.trim(),
      });
      const res = await fetch(`/api/doctors/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setDoctors(data.doctors ?? []);
    } catch (err) {
      setDoctorsError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setDoctorsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0F172A" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#F1F5F9]">Find Support</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Live trials & real doctor search based on your health profile
          </p>

          {/* Health summary strip */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Condition", value: twin.intake.diagnosis.primary_condition.split(" ").slice(0, 3).join(" "), color: "#14B8A6" },
              { label: "ECOG Status", value: `${twin.ecog_estimate} — ${["Fully active", "Light work", "Self-care only", "Limited self-care", "Bedridden"][twin.ecog_estimate] ?? "—"}`, color: twin.ecog_estimate <= 1 ? "#34D399" : twin.ecog_estimate <= 2 ? "#FBBF24" : "#F87171" },
              { label: "Trial Matches", value: `${trials.length} found`, color: "#60A5FA" },
              { label: "Doctors Found", value: doctors.length > 0 ? `${doctors.length} results` : "Enter location", color: "#A78BFA" },
            ].map((chip, i) => (
              <motion.div
                key={i}
                className="rounded-xl px-3 py-2.5 border"
                style={{ background: `${chip.color}0d`, borderColor: `${chip.color}20` }}
                whileHover={{ scale: 1.03, borderColor: `${chip.color}40` }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: `${chip.color}99` }}>{chip.label}</p>
                <p className="text-xs font-bold truncate" style={{ color: chip.color }}>{chip.value}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {[
            { id: "trials" as const, label: "Clinical Trial Matches", count: filteredTrials.length },
            { id: "care" as const, label: "Find Doctors Near Me", count: doctors.length },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
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
            </motion.button>
          ))}
        </div>

        {/* Filters (trials only) */}
        {activeSection === "trials" && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Filter:</span>
            {(["all", "high", "medium", "low"] as FilterCategory[]).map((f) => (
              <motion.button
                key={f}
                onClick={() => setFilter(f)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="px-3 py-1 rounded-full text-[10px] font-semibold"
                style={
                  filter === f
                    ? { background: f === "all" ? "rgba(96,165,250,0.2)" : f === "high" ? "rgba(52,211,153,0.2)" : f === "medium" ? "rgba(251,191,36,0.2)" : "rgba(248,113,113,0.2)", color: f === "all" ? "#60A5FA" : f === "high" ? "#34D399" : f === "medium" ? "#FBBF24" : "#F87171", border: `1px solid ${f === "all" ? "rgba(96,165,250,0.4)" : f === "high" ? "rgba(52,211,153,0.4)" : f === "medium" ? "rgba(251,191,36,0.4)" : "rgba(248,113,113,0.4)"}` }
                    : { background: "rgba(255,255,255,0.04)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {f === "all" ? "All Matches" : f === "high" ? "High Match (80+)" : f === "medium" ? "Good Match (60–79)" : "Possible (< 60)"}
              </motion.button>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mb-4 px-3 py-2.5 rounded-xl" style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.12)" }}>
          <p className="text-[10px] text-[#94A3B8] leading-relaxed">
            <span className="text-[#F87171] font-semibold">Disclaimer: </span>
            Informational only. Does not constitute medical advice. Always consult a qualified healthcare provider.
          </p>
        </div>

        {/* Trial Cards */}
        {activeSection === "trials" && (
          <div className="space-y-3">
            {filteredTrials.length === 0 ? (
              <div className="py-16 text-center text-[#64748B] text-sm">No trials match this filter.</div>
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

        {/* Doctor Search */}
        {activeSection === "care" && (
          <div>
            {/* Location search bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); searchDoctors(locationInput); }}
              className="flex gap-2 mb-5"
            >
              <div className="flex-1 relative">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#64748B" strokeWidth="2"/>
                  <circle cx="12" cy="10" r="3" stroke="#64748B" strokeWidth="2"/>
                </svg>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder={`Enter city, zip, or address to find ${twin.intake.diagnosis.primary_condition} specialists...`}
                  className="w-full rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
                  style={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <motion.button
                type="submit"
                disabled={doctorsLoading}
                whileHover={!doctorsLoading ? { scale: 1.05, boxShadow: "0 0 16px rgba(20,184,166,0.35)" } : {}}
                whileTap={!doctorsLoading ? { scale: 0.95 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                style={{ background: "#14B8A6", color: "#fff" }}
              >
                {doctorsLoading ? "Searching..." : "Search"}
              </motion.button>
            </form>

            {/* Results */}
            <AnimatePresence mode="wait">
              {doctorsLoading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 text-center">
                  <div className="flex justify-center gap-1 mb-3">
                    {[0,1,2].map((i) => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-[#14B8A6]"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                  <p className="text-xs text-[#64748B]">Searching for specialists near you...</p>
                </motion.div>
              )}

              {doctorsError && !doctorsLoading && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
                  <p className="text-sm text-[#F87171] mb-2">Search error</p>
                  <p className="text-xs text-[#64748B]">{doctorsError}</p>
                </motion.div>
              )}

              {!doctorsLoading && !doctorsError && doctors.length > 0 && (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-[10px] text-[#64748B] mb-3 uppercase tracking-wider">
                    {doctors.length} {twin.intake.diagnosis.primary_condition} specialists near {locationSubmitted}
                  </p>
                  <div className="space-y-3">
                    {doctors.map((doc, i) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <RealDoctorCard doctor={doc} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {!doctorsLoading && !doctorsError && doctors.length === 0 && !locationSubmitted && (
                <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.15)" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#14B8A6" strokeWidth="2"/>
                      <circle cx="12" cy="10" r="3" stroke="#14B8A6" strokeWidth="2"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[#94A3B8] mb-1">Enter your location</p>
                  <p className="text-xs text-[#64748B]">We'll find {twin.intake.diagnosis.primary_condition} specialists accepting new patients near you.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
