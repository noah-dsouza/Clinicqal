"use client";

import { IntakeFormData } from "@/lib/digital-twin/schema";

type Lab = IntakeFormData["labs"][number];

interface Props {
  labs: Lab[];
  onChange: (labs: Lab[]) => void;
}

const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[rgba(13,148,136,0.2)] transition-colors";

const COMMON_LABS = [
  { name: "Hemoglobin", unit: "g/dL", reference_low: 12, reference_high: 17 },
  { name: "WBC", unit: "K/uL", reference_low: 4.5, reference_high: 11 },
  { name: "Platelets", unit: "K/uL", reference_low: 150, reference_high: 400 },
  { name: "Creatinine", unit: "mg/dL", reference_low: 0.6, reference_high: 1.2 },
  { name: "eGFR", unit: "mL/min/1.73m²", reference_low: 60 },
  { name: "ALT", unit: "U/L", reference_high: 40 },
  { name: "AST", unit: "U/L", reference_high: 40 },
  { name: "Glucose (fasting)", unit: "mg/dL", reference_low: 70, reference_high: 100 },
  { name: "HbA1c", unit: "%", reference_high: 5.7 },
  { name: "Total Cholesterol", unit: "mg/dL", reference_high: 200 },
  { name: "LDL", unit: "mg/dL", reference_high: 100 },
  { name: "TSH", unit: "mIU/L", reference_low: 0.4, reference_high: 4.0 },
];

export function Step4Labs({ labs, onChange }: Props) {
  const addLab = (preset?: typeof COMMON_LABS[0]) => {
    onChange([...labs, { name: preset?.name || "", value: 0, unit: preset?.unit || "", reference_low: preset?.reference_low, reference_high: preset?.reference_high }]);
  };

  const updateLab = (idx: number, field: keyof Lab, value: string | number) => {
    onChange(labs.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  return (
    <div className="fade-in-up">
      <h2 className="text-xl font-bold text-foreground mb-1">Laboratory Results</h2>
      <p className="text-sm text-muted-foreground mb-6">Enter recent lab values. Include reference ranges when available.</p>

      <div className="mb-5">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Common labs (click to add)</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_LABS.map((lab) => (
            <button key={lab.name} onClick={() => { if (!labs.some((l) => l.name === lab.name)) addLab(lab); }}
              className="px-3 py-1.5 text-xs rounded-full border border-border text-muted-foreground hover:border-[rgba(13,148,136,0.35)] hover:text-[#0D9488] hover:bg-[rgba(13,148,136,0.06)] transition-all">
              + {lab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {labs.map((lab, idx) => (
          <div key={idx} className="p-3 bg-muted/40 rounded-lg border border-border">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-12 md:col-span-4">
                <input type="text" className={inputCls} placeholder="Lab name *"
                  value={lab.name} onChange={(e) => updateLab(idx, "name", e.target.value)} />
              </div>
              <div className="col-span-4 md:col-span-2">
                <input type="number" className={inputCls} placeholder="Value *" step={0.01}
                  value={lab.value || ""} onChange={(e) => updateLab(idx, "value", parseFloat(e.target.value) || 0)} />
              </div>
              <div className="col-span-4 md:col-span-2">
                <input type="text" className={inputCls} placeholder="Unit"
                  value={lab.unit} onChange={(e) => updateLab(idx, "unit", e.target.value)} />
              </div>
              <div className="col-span-4 md:col-span-2">
                <input type="number" className={inputCls} placeholder="Low" step={0.01}
                  value={lab.reference_low ?? ""} onChange={(e) => updateLab(idx, "reference_low", e.target.value ? parseFloat(e.target.value) : "")} />
              </div>
              <div className="col-span-4 md:col-span-1">
                <input type="number" className={inputCls} placeholder="High" step={0.01}
                  value={lab.reference_high ?? ""} onChange={(e) => updateLab(idx, "reference_high", e.target.value ? parseFloat(e.target.value) : "")} />
              </div>
              <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                <button onClick={() => onChange(labs.filter((_, i) => i !== idx))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(239,68,68,0.2)] text-destructive hover:bg-[rgba(239,68,68,0.08)] transition-colors">
                  ×
                </button>
              </div>
            </div>
            {lab.value > 0 && (lab.reference_low !== undefined || lab.reference_high !== undefined) && (
              <div className="mt-2">
                {lab.reference_low !== undefined && lab.value < lab.reference_low
                  ? <span className="text-xs text-[#F59E0B] bg-[rgba(245,158,11,0.08)] px-2 py-0.5 rounded-full">↓ Below reference</span>
                  : lab.reference_high !== undefined && lab.value > lab.reference_high
                  ? <span className="text-xs text-destructive bg-[rgba(239,68,68,0.08)] px-2 py-0.5 rounded-full">↑ Above reference</span>
                  : <span className="text-xs text-[#22C55E] bg-[rgba(34,197,94,0.08)] px-2 py-0.5 rounded-full">✓ Within range</span>}
              </div>
            )}
          </div>
        ))}

        {labs.length === 0 && (
          <div className="py-8 text-center border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground text-sm">No lab results added yet</p>
          </div>
        )}
      </div>

      <button onClick={() => addLab()}
        className="mt-4 w-full py-2.5 rounded-lg border border-dashed border-[rgba(13,148,136,0.25)] text-[#0D9488] text-sm font-medium hover:bg-[rgba(13,148,136,0.06)] transition-colors">
        + Add Custom Lab Result
      </button>
    </div>
  );
}
