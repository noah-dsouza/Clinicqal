import React from "react";
import { IntakeFormData } from "../../../../types/intake";

type Medication = IntakeFormData["medications"][number];

interface Props {
  medications: Medication[];
  onChange: (meds: Medication[]) => void;
}

const inputCls =
  "w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[rgba(20,184,166,0.4)] transition-colors";

export function Step3Medications({ medications, onChange }: Props) {
  const addMedication = () => {
    onChange([...medications, { name: "", dosage: "", frequency: "" }]);
  };

  const updateMedication = (idx: number, field: keyof Medication, value: string) => {
    const updated = medications.map((m, i) =>
      i === idx ? { ...m, [field]: value } : m
    );
    onChange(updated);
  };

  const removeMedication = (idx: number) => {
    onChange(medications.filter((_, i) => i !== idx));
  };

  const commonMedications = [
    "Metformin",
    "Lisinopril",
    "Atorvastatin",
    "Amlodipine",
    "Metoprolol",
    "Omeprazole",
    "Levothyroxine",
    "Aspirin",
  ];

  return (
    <div className="fade-in-up">
      <h2 className="text-xl font-bold text-[#F1F5F9] mb-1">Current Medications</h2>
      <p className="text-sm text-[#64748B] mb-6">
        List all medications you are currently taking. This is critical for eligibility screening.
      </p>

      {/* Quick add */}
      <div className="mb-4">
        <p className="text-xs text-[#64748B] mb-2 uppercase tracking-wide">Common medications (click to add)</p>
        <div className="flex flex-wrap gap-2">
          {commonMedications.map((med) => (
            <button
              key={med}
              onClick={() => {
                if (!medications.some((m) => m.name === med)) {
                  onChange([...medications, { name: med, dosage: "", frequency: "" }]);
                }
              }}
              className="px-3 py-1.5 text-xs rounded-full border border-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:border-[rgba(13,148,136,0.35)] hover:text-[#0D9488] hover:bg-[rgba(13,148,136,0.06)] transition-all"
            >
              + {med}
            </button>
          ))}
        </div>
      </div>

      {/* Medication list */}
      <div className="space-y-3">
        {medications.map((med, idx) => (
          <div
            key={idx}
            className="p-3 bg-[rgba(255,255,255,0.04)] rounded-lg border border-[rgba(255,255,255,0.08)]"
          >
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 md:col-span-5">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Medication name *"
                  value={med.name}
                  onChange={(e) => updateMedication(idx, "name", e.target.value)}
                />
              </div>
              <div className="col-span-5 md:col-span-3">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Dosage (e.g. 10mg)"
                  value={med.dosage || ""}
                  onChange={(e) => updateMedication(idx, "dosage", e.target.value)}
                />
              </div>
              <div className="col-span-5 md:col-span-3">
                <select
                  className={inputCls}
                  value={med.frequency || ""}
                  onChange={(e) => updateMedication(idx, "frequency", e.target.value)}
                >
                  <option value="">Frequency</option>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Four times daily">Four times daily</option>
                  <option value="Every other day">Every other day</option>
                  <option value="Weekly">Weekly</option>
                  <option value="As needed">As needed (PRN)</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1 flex justify-end">
                <button
                  onClick={() => removeMedication(idx)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(239,68,68,0.2)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}

        {medications.length === 0 && (
          <div className="py-8 text-center border border-dashed border-[rgba(255,255,255,0.08)] rounded-lg">
            <p className="text-[#64748B] text-sm">No medications added yet</p>
            <p className="text-[#94A3B8] text-xs mt-1">Click below to add your first medication</p>
          </div>
        )}
      </div>

      <button
        onClick={addMedication}
        className="mt-4 w-full py-2.5 rounded-lg border border-dashed border-[rgba(13,148,136,0.25)] text-[#0D9488] text-sm font-medium hover:bg-[rgba(13,148,136,0.06)] transition-colors"
      >
        + Add Medication
      </button>

      <p className="mt-3 text-xs text-[#64748B]">
        If you take no medications, click Continue to skip this step.
      </p>
    </div>
  );
}
