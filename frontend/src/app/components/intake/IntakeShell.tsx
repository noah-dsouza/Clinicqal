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
  const [showUploadModal, setShowUploadModal] = useState(false);

  const stepNumbers: IntakeStep[] = [1, 2, 3, 4, 5, 6];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start bg-[#F9FAFB]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 20% 20%, rgba(13, 148, 136, 0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(34, 197, 94, 0.04) 0%, transparent 50%)",
      }}
    >
      {/* Header */}
      <div className="w-full max-w-3xl px-4 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-[rgba(13,148,136,0.1)] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7l9 5 9-5-9-5z"
                stroke="#0D9488"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 12l9 5 9-5"
                stroke="#0D9488"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 17l9 5 9-5"
                stroke="#22C55E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-[#111827]">ClinIQ</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(13,148,136,0.1)] text-[#0D9488] border border-[rgba(13,148,136,0.2)]">
            Patient Intake
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[#111827] mt-4">
          Build Your Health Profile
        </h1>
        <p className="text-[#6B7280] mt-2 text-base">
          Complete this 6-step intake form to generate your AI-powered digital twin and discover matching clinical trials.
        </p>

        {/* Upload shortcut */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "rgba(34,197,94,0.08)",
              color: "#22C55E",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Or upload health documents
          </button>
          <span className="text-xs text-[#9CA3AF]">Auto-fills your profile with AI</span>
        </div>

        {/* Step Progress */}
        <div className="mt-6">
          {/* Step dots */}
          <div className="flex items-center gap-2">
            {stepNumbers.map((step) => {
              const isActive = step === form.currentStep;
              const isComplete = step < form.currentStep;
              return (
                <React.Fragment key={step}>
                  <button
                    onClick={() => isComplete && form.goToStep(step)}
                    className={`flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? "w-8 h-8 bg-[#0D9488] text-white shadow-[0_0_12px_rgba(13,148,136,0.4)]"
                        : isComplete
                        ? "w-7 h-7 bg-[rgba(34,197,94,0.15)] text-[#22C55E] border border-[rgba(34,197,94,0.35)] cursor-pointer hover:bg-[rgba(34,197,94,0.25)]"
                        : "w-7 h-7 bg-white text-[#9CA3AF] border border-[#E5E7EB]"
                    }`}
                  >
                    {isComplete ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="#22C55E"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      step
                    )}
                  </button>
                  {step < 6 && (
                    <div
                      className={`flex-1 h-0.5 rounded transition-all duration-500 ${
                        step < form.currentStep ? "bg-[#22C55E]" : "bg-[#E5E7EB]"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {/* Step labels */}
          <div className="flex items-center mt-2">
            {stepNumbers.map((step) => (
              <div
                key={step}
                className={`text-xs transition-colors duration-200 ${
                  step === form.currentStep
                    ? "text-[#0D9488] font-medium"
                    : step < form.currentStep
                    ? "text-[#22C55E]"
                    : "text-[#9CA3AF]"
                }`}
                style={{ width: `${100 / 6}%` }}
              >
                {step === form.currentStep && STEP_LABELS[step]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-3xl px-4 pb-12">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          {/* Step Content */}
          <div className="p-6 md:p-8">
            {form.currentStep === 1 && (
              <Step1Demographics
                data={form.formData.demographics}
                onChange={form.updateDemographics}
              />
            )}
            {form.currentStep === 2 && (
              <Step2Diagnosis
                data={form.formData.diagnosis}
                onChange={form.updateDiagnosis}
              />
            )}
            {form.currentStep === 3 && (
              <Step3Medications
                medications={form.formData.medications}
                onChange={(meds) => form.updateFormData({ medications: meds })}
              />
            )}
            {form.currentStep === 4 && (
              <Step4Labs
                labs={form.formData.labs}
                onChange={(labs) => form.updateFormData({ labs })}
              />
            )}
            {form.currentStep === 5 && (
              <Step5Vitals
                vitals={form.formData.vitals}
                onChange={form.updateVitals}
              />
            )}
            {form.currentStep === 6 && (
              <Step6Lifestyle
                lifestyle={form.formData.lifestyle}
                onChange={form.updateLifestyle}
              />
            )}
          </div>

          {/* Error */}
          {form.error && (
            <div className="mx-6 mb-4 px-4 py-3 rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] text-[#EF4444] text-sm">
              {form.error}
            </div>
          )}

          {/* Navigation */}
          <div className="px-6 md:px-8 pb-6 md:pb-8 flex items-center justify-between border-t border-[#E5E7EB] pt-5">
            <button
              onClick={form.prevStep}
              disabled={form.currentStep === 1}
              className="px-5 py-2.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] text-sm font-medium transition-all hover:bg-[#F3F4F6] hover:text-[#111827] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Back
            </button>

            <span className="text-xs text-[#9CA3AF]">
              Step {form.currentStep} of {form.totalSteps}
            </span>

            {form.currentStep < form.totalSteps ? (
              <button
                onClick={form.nextStep}
                className="px-6 py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-semibold transition-all hover:bg-[#0f766e] shadow-[0_0_15px_rgba(13,148,136,0.25)] hover:shadow-[0_0_25px_rgba(13,148,136,0.4)]"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={form.submitForm}
                disabled={form.isSubmitting}
                className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#22C55E] text-white text-sm font-semibold transition-all hover:opacity-90 shadow-[0_0_20px_rgba(13,148,136,0.25)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {form.isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    Building Digital Twin...
                  </>
                ) : (
                  "Build My Digital Twin →"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-lg relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-[#111827] mb-1">Upload Health Document</h2>
              <p className="text-sm text-[#6B7280] mb-4">
                Upload a lab report, discharge summary, or health record to automatically extract and apply your health data.
              </p>
              <HealthDocumentUpload onClose={() => setShowUploadModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
