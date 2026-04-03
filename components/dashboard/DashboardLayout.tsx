"use client";

import { useState } from "react";
import { NavBar } from "./NavBar";
import { HealthScoreGauge } from "./HealthScoreGauge";
import { BodyVisualization } from "./BodyVisualization";
import { VitalSignGrid } from "./VitalSignGrid";
import { BiomarkerPanel } from "./BiomarkerPanel";
import { ScenarioBuilder } from "./ScenarioBuilder";
import { TrialList } from "./TrialList";
import { HealthChat } from "./HealthChat";
import { useDigitalTwin } from "@/context/DigitalTwinContext";
import { getEcogLabel } from "@/lib/utils";
import { HealthDocumentUpload } from "@/components/shared/HealthDocumentUpload";
import { BodySystem } from "@/lib/digital-twin/schema";

type Tab = "overview" | "trials" | "scenario";

interface DashboardLayoutProps {
  onRetakeIntake: () => void;
}

export function DashboardLayout({ onRetakeIntake }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { twin } = useDigitalTwin();

  if (!twin) return null;

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as Tab)}
        onRetakeIntake={onRetakeIntake}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryChip label="ECOG STATUS" value={`${twin.ecog_estimate} — ${getEcogLabel(twin.ecog_estimate)}`} color="#0D9488" />
              <SummaryChip label="CHARLSON INDEX" value={String(twin.charlson_index)} color="#22C55E" />
              <SummaryChip label="BMI" value={twin.bmi.toFixed(1)} color="#F59E0B" />
              <SummaryChip label="ACTIVE MEDS" value={String(twin.active_medication_names.length)} color="#22C55E" />
            </div>

            {/* 5-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left col (3/5) */}
              <div className="lg:col-span-3 space-y-5">
                <BodyVisualization bodySystems={twin.body_systems ?? []} />
                <VitalSignGrid vitals={twin.intake.vitals} />
                <BiomarkerPanel labs={twin.intake.labs} />

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-xl border border-border p-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lifestyle</h3>
                    <div className="space-y-2">
                      <LifestyleChip label="Smoking" value={twin.intake.lifestyle.smoking_status} good={twin.intake.lifestyle.smoking_status === "never"} bad={twin.intake.lifestyle.smoking_status === "current"} />
                      <LifestyleChip label="Alcohol" value={twin.intake.lifestyle.alcohol_use} good={twin.intake.lifestyle.alcohol_use === "none"} bad={twin.intake.lifestyle.alcohol_use === "heavy"} />
                      <LifestyleChip label="Activity" value={twin.intake.lifestyle.physical_activity} good={twin.intake.lifestyle.physical_activity === "active" || twin.intake.lifestyle.physical_activity === "moderate"} bad={twin.intake.lifestyle.physical_activity === "sedentary"} />
                      <LifestyleChip label="Diet" value={twin.intake.lifestyle.diet_quality} good={twin.intake.lifestyle.diet_quality === "good"} bad={twin.intake.lifestyle.diet_quality === "poor"} />
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Medications</h3>
                    {twin.active_medication_names.length > 0 ? (
                      <div className="space-y-1.5">
                        {twin.active_medication_names.map((med, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] flex-shrink-0" />
                            <span className="text-xs text-foreground">{med}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No medications recorded</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2"
                    style={{ background: "rgba(13,148,136,0.08)", color: "#0D9488", border: "1px solid rgba(13,148,136,0.25)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Upload Document
                  </button>
                  <button
                    onClick={() => setActiveTab("trials")}
                    className="py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #0D9488, #22C55E)", color: "#fff", boxShadow: "0 0 16px rgba(13,148,136,0.3)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
                      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Find Trials
                  </button>
                </div>

                <div className="px-4 py-3 rounded-xl bg-[rgba(239,68,68,0.04)] border border-[rgba(239,68,68,0.12)]">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-destructive font-semibold">Disclaimer: </span>
                    ClinIQ is informational only. Always consult a qualified healthcare provider.
                  </p>
                </div>
              </div>

              {/* Right col (2/5) */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-card rounded-xl border border-border p-5 flex flex-col items-center">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 self-start">Health Score</h3>
                  <HealthScoreGauge
                    score={twin.health_score.overall}
                    size={220}
                    showSubScores
                    cardiovascular={twin.health_score.cardiovascular}
                    metabolic={twin.health_score.metabolic}
                    functional={twin.health_score.functional}
                  />
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Score Breakdown</h3>
                  <div className="space-y-3">
                    <ScoreBar label="Cardiovascular" value={twin.health_score.cardiovascular} color="#EF4444" />
                    <ScoreBar label="Metabolic" value={twin.health_score.metabolic} color="#F59E0B" />
                    <ScoreBar label="Functional" value={twin.health_score.functional} color="#22C55E" />
                  </div>
                  {twin.health_score.breakdown_notes && (
                    <p className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground leading-relaxed">{twin.health_score.breakdown_notes}</p>
                  )}
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Diagnosis</h3>
                  <p className="text-sm font-semibold text-foreground mb-1">{twin.intake.diagnosis.primary_condition}</p>
                  {twin.intake.diagnosis.icd10_code && <p className="text-xs text-muted-foreground mb-2">ICD-10: {twin.intake.diagnosis.icd10_code}</p>}
                  {twin.intake.diagnosis.stage && (
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-[rgba(13,148,136,0.1)] text-[#0D9488] border border-[rgba(13,148,136,0.2)]">{twin.intake.diagnosis.stage}</span>
                  )}
                  {twin.intake.diagnosis.secondary_conditions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Comorbidities</p>
                      <div className="flex flex-wrap gap-1.5">
                        {twin.intake.diagnosis.secondary_conditions.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {twin.body_systems.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Body Systems</h3>
                    <div className="space-y-2">
                      {twin.body_systems.map((sys, i) => <SystemRow key={i} system={sys} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trials Tab */}
        {activeTab === "trials" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">Clinical Trials</h2>
              <p className="text-sm text-muted-foreground">
                AI-powered matching from multiple registries based on your health profile. Click "Analyze Eligibility" for a detailed assessment.
              </p>
            </div>
            <TrialList />
          </div>
        )}

        {/* Scenario Builder Tab */}
        {activeTab === "scenario" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">Scenario Builder</h2>
              <p className="text-sm text-muted-foreground">
                Adjust lifestyle parameters to see how changes might affect your health score and trial eligibility.
              </p>
            </div>
            <ScenarioBuilder />
          </div>
        )}
      </main>

      {/* Upload modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Upload Health Document</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a lab report, discharge summary, or health record to automatically extract and apply your health data.
              </p>
              <HealthDocumentUpload onClose={() => setShowUploadModal(false)} />
            </div>
          </div>
        </div>
      )}

      <HealthChat />
    </div>
  );
}

// ---- Sub-components ----

function SummaryChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-3 border" style={{ background: `${color}10`, borderColor: `${color}25` }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: `${color}99` }}>{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold" style={{ color }}>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
    </div>
  );
}

function LifestyleChip({ label, value, good, bad }: { label: string; value: string; good: boolean; bad: boolean }) {
  const color = good ? "#22C55E" : bad ? "#EF4444" : "#F59E0B";
  return (
    <div className="rounded-lg px-3 py-2 border" style={{ background: `${color}10`, borderColor: `${color}25` }}>
      <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: `${color}99` }}>{label}</p>
      <p className="text-xs font-semibold capitalize" style={{ color }}>{value.replace("_", " ")}</p>
    </div>
  );
}

function SystemRow({ system }: { system: BodySystem }) {
  const statusColors: Record<string, string> = {
    normal: "#22C55E",
    abnormal: "#F59E0B",
    critical: "#EF4444",
    unknown: "#9CA3AF",
  };
  const color = statusColors[system.status] ?? "#9CA3AF";

  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}80` }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-foreground capitalize">{system.system.replace("_", " ")}</span>
          <span className="text-[10px] font-semibold capitalize" style={{ color }}>{system.status}</span>
        </div>
        {system.findings.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{system.findings.slice(0, 2).join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
