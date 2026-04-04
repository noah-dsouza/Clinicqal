import React, { useState } from "react";
import { useIntakeForm, IntakeStep } from "../../../hooks/useIntakeForm";
import { Step1Demographics } from "./steps/Step1Demographics";
import { Step2Diagnosis } from "./steps/Step2Diagnosis";
import { Step3Medications } from "./steps/Step3Medications";
import { Step4Labs } from "./steps/Step4Labs";
import { Step5Vitals } from "./steps/Step5Vitals";
import { Step6Lifestyle } from "./steps/Step6Lifestyle";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { HealthDocumentUpload } from "../shared/HealthDocumentUpload";
import { useDigitalTwin } from "../../../context/DigitalTwinContext";

interface IntakeShellProps {
  onComplete: () => void;
}

const STEP_LABELS: Record<IntakeStep, string> = {
  1: "Demographics",
  2: "Diagnosis",
  3: "Medications",
  4: "Lab Results",
  5: "Vitals",
  6: "Lifestyle",
};

export function IntakeShell({ onComplete }: IntakeShellProps) {
  const form = useIntakeForm(onComplete);
  const { setTwin } = useDigitalTwin();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const loadDemoPatient = async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch("/api/demo/patient");
      const { twin } = await res.json();
      setTwin(twin);
    } catch {
      // silently ignore
    } finally {
      setLoadingDemo(false);
    }
  };

  const stepNumbers: IntakeStep[] = [1, 2, 3, 4, 5, 6];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start"
      style={{
        background: "#F6F3ED",
        backgroundImage:
          "radial-gradient(ellipse at 20% 20%, rgba(107,127,106,0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(47,62,52,0.04) 0%, transparent 50%)",
      }}
    >
      {/* Header */}
      <div className="w-full max-w-3xl px-4 pt-10 pb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(47,62,52,0.1)", border: "1px solid rgba(47,62,52,0.18)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7l9 5 9-5-9-5z" stroke="#2F3E34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 12l9 5 9-5" stroke="#2F3E34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 17l9 5 9-5" stroke="#6B7F6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-base font-bold text-[#2F3E34]">ClinIQ</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(47,62,52,0.08)", color: "#6B7F6A", border: "1px solid rgba(47,62,52,0.18)" }}>
            Patient Intake
          </span>
        </div>

        <h1 className="text-2xl font-bold text-[#2F3E34] mt-2">Build Your Health Profile</h1>
        <p className="text-sm text-[#8B7765] mt-1.5 leading-relaxed">
          Complete this 6-step intake to generate your AI-powered digital twin and discover matching clinical trials.
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(47,62,52,0.08)", color: "#6B7F6A", border: "1px solid rgba(47,62,52,0.18)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Upload health docs
          </button>
          <span className="text-[10px] text-[#B1A79F]">Auto-fills with AI</span>
          <button
            onClick={loadDemoPatient}
            disabled={loadingDemo}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            style={{ background: "rgba(47,62,52,0.06)", color: "#2F3E34", border: "1px solid rgba(47,62,52,0.15)" }}
          >
            {loadingDemo ? (
              <span className="w-3 h-3 border border-[#6B7F6A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
            )}
            Load Demo Patient
          </button>
        </div>

        {/* Step Progress */}
        <div className="mt-6">
          <div className="flex items-center gap-1.5">
            {stepNumbers.map((step) => {
              const isActive = step === form.currentStep;
              const isComplete = step < form.currentStep;
              return (
                <React.Fragment key={step}>
                  <button
                    onClick={() => isComplete && form.goToStep(step)}
                    className="flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300"
                    style={{
                      width: isActive ? 28 : 24,
                      height: isActive ? 28 : 24,
                      background: isActive ? "#2F3E34" : isComplete ? "rgba(47,62,52,0.12)" : "rgba(47,62,52,0.05)",
                      color: isActive ? "#fff" : isComplete ? "#6B7F6A" : "#B1A79F",
                      border: isActive ? "none" : isComplete ? "1px solid rgba(47,62,52,0.25)" : "1px solid rgba(47,62,52,0.12)",
                      boxShadow: isActive ? "0 0 12px rgba(47,62,52,0.25)" : "none",
                      cursor: isComplete ? "pointer" : "default",
                    }}
                  >
                    {isComplete ? (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#6B7F6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    ) : step}
                  </button>
                  {step < 6 && (
                    <div
                      className="flex-1 h-px rounded transition-all duration-500"
                      style={{ background: step < form.currentStep ? "#6B7F6A" : "rgba(47,62,52,0.1)" }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="flex items-center mt-2">
            {stepNumbers.map((step) => (
              <div
                key={step}
                className="text-[10px] transition-colors duration-200"
                style={{
                  width: `${100 / 6}%`,
                  color: step === form.currentStep ? "#2F3E34" : step < form.currentStep ? "#6B7F6A" : "#B1A79F",
                  fontWeight: step === form.currentStep ? 600 : 400,
                }}
              >
                {step === form.currentStep && STEP_LABELS[step]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-3xl px-4 pb-12">
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "rgba(47,62,52,0.1)" }}>
          <div className="p-6 md:p-8">
            {form.currentStep === 1 && <Step1Demographics data={form.formData.demographics} onChange={form.updateDemographics} />}
            {form.currentStep === 2 && <Step2Diagnosis data={form.formData.diagnosis} onChange={form.updateDiagnosis} />}
            {form.currentStep === 3 && <Step3Medications medications={form.formData.medications} onChange={(meds) => form.updateFormData({ medications: meds })} />}
            {form.currentStep === 4 && <Step4Labs labs={form.formData.labs} onChange={(labs) => form.updateFormData({ labs })} />}
            {form.currentStep === 5 && <Step5Vitals vitals={form.formData.vitals} onChange={form.updateVitals} />}
            {form.currentStep === 6 && <Step6Lifestyle lifestyle={form.formData.lifestyle} onChange={form.updateLifestyle} />}
          </div>

          {form.error && (
            <div className="mx-6 mb-4 px-4 py-3 rounded-lg text-xs" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171" }}>
              {form.error}
            </div>
          )}

          <div className="px-6 md:px-8 pb-6 md:pb-8 flex items-center justify-between border-t pt-5" style={{ borderColor: "rgba(47,62,52,0.08)" }}>
            <button
              onClick={form.prevStep}
              disabled={form.currentStep === 1}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
              style={{ color: "#8B7765", border: "1px solid rgba(47,62,52,0.15)" }}
            >
              ← Back
            </button>
            <span className="text-[10px] text-[#B1A79F]">Step {form.currentStep} of {form.totalSteps}</span>
            {form.currentStep < form.totalSteps ? (
              <button
                onClick={form.nextStep}
                className="px-5 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: "#2F3E34", color: "#fff", boxShadow: "0 0 14px rgba(47,62,52,0.2)" }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={form.submitForm}
                disabled={form.isSubmitting}
                className="px-6 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #0D9488, #22C55E)", color: "#fff", boxShadow: "0 0 18px rgba(13,148,136,0.25)" }}
              >
                {form.isSubmitting ? <><LoadingSpinner size="sm" color="white" />Building Digital Twin...</> : "Build My Digital Twin →"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl border w-full max-w-lg relative" style={{ background: "#FFFFFF", borderColor: "rgba(47,62,52,0.12)" }}>
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
              style={{ color: "#B1A79F" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <div className="p-6">
              <h2 className="text-base font-semibold text-[#2F3E34] mb-1">Upload Health Document</h2>
              <p className="text-xs text-[#8B7765] mb-4">Upload a lab report, discharge summary, or health record to auto-fill your profile.</p>
              <HealthDocumentUpload onClose={() => setShowUploadModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
