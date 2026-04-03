import { useState, useCallback } from "react";
import { IntakeFormData, defaultIntakeFormData } from "../types/intake";
import { submitIntake } from "../lib/api";
import { useDigitalTwin } from "../context/DigitalTwinContext";

export type IntakeStep = 1 | 2 | 3 | 4 | 5 | 6;

const TOTAL_STEPS: IntakeStep = 6;

interface UseIntakeFormReturn {
  formData: IntakeFormData;
  currentStep: IntakeStep;
  totalSteps: IntakeStep;
  isSubmitting: boolean;
  error: string | null;
  updateFormData: (updates: Partial<IntakeFormData>) => void;
  updateDemographics: (updates: Partial<IntakeFormData["demographics"]>) => void;
  updateDiagnosis: (updates: Partial<IntakeFormData["diagnosis"]>) => void;
  updateVitals: (updates: Partial<IntakeFormData["vitals"]>) => void;
  updateLifestyle: (updates: Partial<IntakeFormData["lifestyle"]>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: IntakeStep) => void;
  submitForm: () => Promise<void>;
  resetForm: () => void;
}

export function useIntakeForm(onSuccess?: () => void): UseIntakeFormReturn {
  const [formData, setFormData] = useState<IntakeFormData>(
    structuredClone(defaultIntakeFormData)
  );
  const [currentStep, setCurrentStep] = useState<IntakeStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setTwin } = useDigitalTwin();

  const updateFormData = useCallback((updates: Partial<IntakeFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateDemographics = useCallback((updates: Partial<IntakeFormData["demographics"]>) => {
    setFormData((prev) => ({
      ...prev,
      demographics: { ...prev.demographics, ...updates },
    }));
  }, []);

  const updateDiagnosis = useCallback((updates: Partial<IntakeFormData["diagnosis"]>) => {
    setFormData((prev) => ({
      ...prev,
      diagnosis: { ...prev.diagnosis, ...updates },
    }));
  }, []);

  const updateVitals = useCallback((updates: Partial<IntakeFormData["vitals"]>) => {
    setFormData((prev) => ({
      ...prev,
      vitals: { ...prev.vitals, ...updates },
    }));
  }, []);

  const updateLifestyle = useCallback((updates: Partial<IntakeFormData["lifestyle"]>) => {
    setFormData((prev) => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, ...updates },
    }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS) as IntakeStep);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as IntakeStep);
  }, []);

  const goToStep = useCallback((step: IntakeStep) => {
    setCurrentStep(step);
  }, []);

  const submitForm = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await submitIntake(formData);
      setTwin(response.twin);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit intake form");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, setTwin, onSuccess]);

  const resetForm = useCallback(() => {
    setFormData(structuredClone(defaultIntakeFormData));
    setCurrentStep(1);
    setError(null);
  }, []);

  return {
    formData,
    currentStep,
    totalSteps: TOTAL_STEPS,
    isSubmitting,
    error,
    updateFormData,
    updateDemographics,
    updateDiagnosis,
    updateVitals,
    updateLifestyle,
    nextStep,
    prevStep,
    goToStep,
    submitForm,
    resetForm,
  };
}
