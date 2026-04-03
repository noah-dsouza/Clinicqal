"use client";

import { IntakeFormData } from "@/lib/digital-twin/schema";

type Medication = IntakeFormData["medications"][number];

interface Props {
  medications: Medication[];
  onChange: (meds: Medication[]) => void;
}

const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[rgba(13,148,136,0.2)] transition-colors";

const commonMedications = ["Metformin", "Lisinopril", "Atorvastatin", "Amlodipine", "Metoprolol", "Omeprazole", "Levothyroxine", "Aspirin"];

export function Step3Medications({ medications, onChange }: Props) {
  const addMedication = () => onChange([...medications, { name: "", dosage: "", frequency: "" }]);

  const updateMedication = (idx: number, field: keyof Medication, value: string) => {
    onChange(medications.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  return (
    <div className="fade-in-up">
      <h2 className="text-xl font-bold text-foreground mb-1">Current Medications</h2>
      <p className="text-sm text-muted-foreground mb-6">List all medications you are currently taking. This is critical for eligibility screening.</p>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Common medications (click to add)</p>
        <div className="flex flex-wrap gap-2">
          {commonMedications.map((med) => (
            <button key={med} onClick={() => { if (!medications.some((m) => m.name === med)) onChange([...medications, { name: med, dosage: "", frequency: "" }]); }}
              className="px-3 py-1.5 text-xs rounded-full border border-border text-muted-foreground hover:border-[rgba(13,148,136,0.35)] hover:text-[#0D9488] hover:bg-[rgba(13,148,136,0.06)] transition-all">
              + {med}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {medications.map((med, idx) => (
          <div key={idx} className="p-3 bg-muted/40 rounded-lg border border-border">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 md:col-span-5">
                <input type="text" className={inputCls} placeholder="Medication name *"
                  value={med.name} onChange={(e) => updateMedication(idx, "name", e.target.value)} />
              </div>
              <div className="col-span-5 md:col-span-3">
                <input type="text" className={inputCls} placeholder="Dosage (e.g. 10mg)"
                  value={med.dosage || ""} onChange={(e) => updateMedication(idx, "dosage", e.target.value)} />
              </div>
              <div className="col-span-5 md:col-span-3">
                <select className={inputCls} value={med.frequency || ""} onChange={(e) => updateMedication(idx, "frequency", e.target.value)}>
                  <option value="">Frequency</option>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Every other day">Every other day</option>
                  <option value="Weekly">Weekly</option>
                  <option value="As needed">As needed (PRN)</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1 flex justify-end">
                <button onClick={() => onChange(medications.filter((_, i) => i !== idx))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(239,68,68,0.2)] text-destructive hover:bg-[rgba(239,68,68,0.08)] transition-colors">
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}

        {medications.length === 0 && (
          <div className="py-8 text-center border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground text-sm">No medications added yet</p>
          </div>
        )}
      </div>

      <button onClick={addMedication}
        className="mt-4 w-full py-2.5 rounded-lg border border-dashed border-[rgba(13,148,136,0.25)] text-[#0D9488] text-sm font-medium hover:bg-[rgba(13,148,136,0.06)] transition-colors">
        + Add Medication
      </button>
    </div>
  );
}
