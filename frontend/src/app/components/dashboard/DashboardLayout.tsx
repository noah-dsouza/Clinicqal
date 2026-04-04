import React, { useState } from "react";
import { motion } from "framer-motion";
import { NavBar } from "./NavBar";
import { HealthScoreGauge } from "./HealthScoreGauge";
import { BodyVisualization } from "./BodyVisualization";
import { VitalSignGrid } from "./VitalSignGrid";
import { BiomarkerPanel } from "./BiomarkerPanel";
import { TrialList } from "./TrialList";
import { FindSupport } from "./FindSupport";
import { AIChatButton } from "./AIChatButton";
import { useDigitalTwin } from "../../../context/DigitalTwinContext";
import { getEcogLabel } from "../../../lib/utils";
import { HealthDocumentUpload } from "../shared/HealthDocumentUpload";
import { brandGradient } from "../../../lib/theme";

type Tab = "overview" | "trials" | "support";

interface DashboardLayoutProps {
  onRetakeIntake: () => void;
}

export function DashboardLayout({ onRetakeIntake }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { twin } = useDigitalTwin();

  if (!twin) return null;

  return (
    <div className="min-h-screen" style={{ background: "#F6F3ED" }}>
      <NavBar
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as Tab)}
        onRetakeIntake={onRetakeIntake}
      />

      <main className={activeTab === "support" ? "" : "max-w-7xl mx-auto px-4 sm:px-6 py-6"}>

        {/* ── Overview ─────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-5">

            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <SummaryChip label="ECOG STATUS" value={`${twin.ecog_estimate} — ${getEcogLabel(twin.ecog_estimate)}`} color="#2F3E34" />
              <SummaryChip label="CHARLSON INDEX" value={String(twin.charlson_index)} color="#6B7F6A" />
              <SummaryChip label="BMI" value={twin.bmi.toFixed(1)} color="#C1843A" />
              <SummaryChip label="ACTIVE MEDS" value={String(twin.active_medication_names.length)} color="#A3AE95" />
            </div>

            {/* Row 1: Score + Diagnosis + Body Systems side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Health Score */}
              <LightCard title="Health Score" accent="#2F3E34">
                <HealthScoreGauge
                  score={twin.health_score.overall}
                  size={190}
                  showSubScores
                  cardiovascular={twin.health_score.cardiovascular}
                  metabolic={twin.health_score.metabolic}
                  functional={twin.health_score.functional}
                />
                {twin.health_score.breakdown_notes && (
                  <p className="mt-3 pt-3 border-t border-[rgba(47,62,52,0.08)] text-[10px] text-[#B1A79F] leading-relaxed">
                    {twin.health_score.breakdown_notes}
                  </p>
                )}
              </LightCard>

              {/* Diagnosis */}
              <LightCard title="Diagnosis" accent="#6B7F6A">
                <p className="text-sm font-semibold text-[#2F3E34] mb-1">{twin.intake.diagnosis.primary_condition}</p>
                {twin.intake.diagnosis.icd10_code && (
                  <p className="text-xs text-[#B1A79F] mb-2">ICD-10: {twin.intake.diagnosis.icd10_code}</p>
                )}
                {twin.intake.diagnosis.stage && (
                  <span className="inline-block px-2 py-0.5 rounded text-xs mb-3" style={{ background: "rgba(47,62,52,0.08)", color: "#2F3E34", border: "1px solid rgba(47,62,52,0.15)" }}>
                    {twin.intake.diagnosis.stage}
                  </span>
                )}
                {twin.intake.diagnosis.secondary_conditions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[rgba(47,62,52,0.08)]">
                    <p className="text-[10px] text-[#B1A79F] mb-2 uppercase tracking-wider">Comorbidities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {twin.intake.diagnosis.secondary_conditions.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px]" style={{ background: "rgba(47,62,52,0.05)", color: "#8B7765", border: "1px solid rgba(47,62,52,0.1)" }}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {twin.active_medication_names.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[rgba(47,62,52,0.08)]">
                    <p className="text-[10px] text-[#B1A79F] mb-2 uppercase tracking-wider">Medications</p>
                    <div className="space-y-1">
                      {twin.active_medication_names.slice(0, 5).map((med, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#6B7F6A" }} />
                          <span className="text-xs text-[#8B7765]">{med}</span>
                        </div>
                      ))}
                      {twin.active_medication_names.length > 5 && (
                        <p className="text-[10px] text-[#B1A79F] mt-1">+{twin.active_medication_names.length - 5} more</p>
                      )}
                    </div>
                  </div>
                )}
              </LightCard>

              {/* Body Systems */}
              <LightCard title="Body Systems" accent="#8B7765">
                {twin.body_systems.length > 0 ? (
                  <div className="space-y-2">
                    {twin.body_systems.map((sys, i) => <SystemRow key={i} system={sys} />)}
                  </div>
                ) : (
                  <p className="text-xs text-[#B1A79F]">No body system data recorded.</p>
                )}
              </LightCard>
            </div>

            {/* Row 2: 3D Body Visualization */}
            <LightCard title="3D Body Model">
              <BodyVisualization bodySystems={twin.body_systems ?? []} />
            </LightCard>

            {/* Row 3: Vitals */}
            <LightCard title="Vital Signs" glow={false}>
              <VitalSignGrid vitals={twin.intake.vitals} />
            </LightCard>

            {/* Row 4: Labs */}
            <LightCard title="Lab Results" glow={false}>
              <BiomarkerPanel labs={twin.intake.labs} />
            </LightCard>

            {/* Row 5: Lifestyle */}
            <LightCard title="Lifestyle" glow={false}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <LifestyleChip label="Smoking" value={twin.intake.lifestyle.smoking_status} good={twin.intake.lifestyle.smoking_status === "never"} bad={twin.intake.lifestyle.smoking_status === "current"} />
                <LifestyleChip label="Alcohol" value={twin.intake.lifestyle.alcohol_use} good={twin.intake.lifestyle.alcohol_use === "none"} bad={twin.intake.lifestyle.alcohol_use === "heavy"} />
                <LifestyleChip label="Activity" value={twin.intake.lifestyle.physical_activity} good={["active", "moderate"].includes(twin.intake.lifestyle.physical_activity)} bad={twin.intake.lifestyle.physical_activity === "sedentary"} />
                <LifestyleChip label="Diet" value={twin.intake.lifestyle.diet_quality} good={twin.intake.lifestyle.diet_quality === "good"} bad={twin.intake.lifestyle.diet_quality === "poor"} />
              </div>
            </LightCard>

            {/* Actions + Disclaimer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                onClick={() => setShowUploadModal(true)}
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(47,62,52,0.1)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="py-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                style={{ background: "rgba(47,62,52,0.07)", color: "#2F3E34", border: "1px solid rgba(47,62,52,0.15)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                Upload Document
              </motion.button>
              <motion.button
                onClick={() => setActiveTab("trials")}
                whileHover={{ scale: 1.02, boxShadow: "0 0 28px rgba(47,62,52,0.25)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                style={{ background: brandGradient, color: "#fff", boxShadow: "0 0 16px rgba(47,62,52,0.18)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2" /></svg>
                Find Trials
              </motion.button>
            </div>

            <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(169,90,63,0.05)", border: "1px solid rgba(169,90,63,0.12)" }}>
              <p className="text-[10px] text-[#8B7765] leading-relaxed">
                <span className="font-semibold" style={{ color: "#A95A3F" }}>Disclaimer: </span>
                ClinIQ is informational only. Always consult a qualified healthcare provider before making medical decisions.
              </p>
            </div>
          </div>
        )}

        {/* ── Clinical Trials ────────────────────────────────────── */}
        {activeTab === "trials" && (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-[#2F3E34] mb-1">Clinical Trials</h2>
              <p className="text-xs text-[#8B7765]">
                AI-powered matching from ClinicalTrials.gov based on your health profile.
              </p>
            </div>
            <TrialList />
          </div>
        )}

        {/* ── Find Support ─────────────────────────────────────── */}
        {activeTab === "support" && <FindSupport />}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl border w-full max-w-lg relative" style={{ background: "#FFFFFF", borderColor: "rgba(47,62,52,0.12)" }}>
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
              style={{ color: "#8B7765" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="p-6">
              <h2 className="text-base font-semibold text-[#2F3E34] mb-1">Upload Health Document</h2>
              <p className="text-xs text-[#8B7765] mb-4">
                Upload a lab report, discharge summary, or health record to auto-fill your profile.
              </p>
              <HealthDocumentUpload onClose={() => setShowUploadModal(false)} />
            </div>
          </div>
        </div>
      )}

      <AIChatButton />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function LightCard({ title, children, accent = "#2F3E34", glow = true }: { title: string; children: React.ReactNode; accent?: string; glow?: boolean }) {
  return (
    <motion.div
      className="relative rounded-2xl border overflow-hidden group"
      style={{ background: "#FFFFFF", borderColor: "rgba(47,62,52,0.1)" }}
      whileHover={{
        borderColor: "rgba(134,239,172,0.55)",
        boxShadow: glow ? "0 20px 50px rgba(134,239,172,0.18), 0 0 20px rgba(134,239,172,0.1)" : "none",
        y: -4,
      }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      {glow && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-60 transition-opacity duration-300"
          style={{ background: "radial-gradient(circle at 30% 0%, rgba(134,239,172,0.18), transparent 65%)" }}
        />
      )}
      <div className="relative p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#B1A79F" }}>{title}</h3>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        </div>
        {children}
      </div>
    </motion.div>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <motion.div
      className="rounded-xl p-3 border"
      style={{ background: `${color}0d`, borderColor: `${color}20` }}
      whileHover={{ scale: 1.04, y: -2, boxShadow: `0 8px 20px ${color}12`, borderColor: `${color}40` }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: `${color}99` }}>{label}</p>
      <p className="text-xs font-bold truncate" style={{ color }}>{value}</p>
    </motion.div>
  );
}

function LifestyleChip({ label, value, good, bad }: { label: string; value: string; good: boolean; bad: boolean }) {
  const color = good ? "#6B7F6A" : bad ? "#A95A3F" : "#C1843A";
  return (
    <motion.div
      className="rounded-lg px-3 py-2.5 border"
      style={{ background: `${color}0d`, borderColor: `${color}20` }}
      whileHover={{ scale: 1.04, y: -2, boxShadow: `0 6px 16px ${color}12`, borderColor: `${color}40` }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: `${color}80` }}>{label}</p>
      <p className="text-xs font-semibold capitalize" style={{ color }}>{value.replace(/_/g, " ")}</p>
    </motion.div>
  );
}

interface BodySystem {
  system: string;
  status: "normal" | "abnormal" | "critical" | "unknown";
  findings: string[];
  relevant_labs: string[];
}

function SystemRow({ system }: { system: BodySystem }) {
  const statusColors = { normal: "#6B7F6A", abnormal: "#C1843A", critical: "#A95A3F", unknown: "#B1A79F" };
  const color = statusColors[system.status];
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-[rgba(47,62,52,0.06)] last:border-0">
      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#5C524A] capitalize">{system.system.replace(/_/g, " ")}</span>
          <span className="text-[10px] font-semibold capitalize" style={{ color }}>{system.status}</span>
        </div>
        {system.findings.length > 0 && (
          <p className="text-[10px] text-[#B1A79F] mt-0.5 truncate">{system.findings.slice(0, 2).join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
