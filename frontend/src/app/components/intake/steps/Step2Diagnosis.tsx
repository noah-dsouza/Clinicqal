import { useState } from "react";
import { IntakeFormData } from "../../../../types/intake";

interface Props {
  data: IntakeFormData["diagnosis"];
  onChange: (updates: Partial<IntakeFormData["diagnosis"]>) => void;
}

const inputCls =
  "w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] rounded-lg px-4 py-2.5 text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[rgba(20,184,166,0.4)] transition-colors";

const labelCls = "block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wide";

export function Step2Diagnosis({ data, onChange }: Props) {
  const [secInput, setSecInput] = useState("");

  const addSecondaryCondition = () => {
    const val = secInput.trim();
    if (val && !data.secondary_conditions.includes(val)) {
      onChange({ secondary_conditions: [...data.secondary_conditions, val] });
    }
    setSecInput("");
  };

  const removeSecondary = (idx: number) => {
    onChange({
      secondary_conditions: data.secondary_conditions.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="fade-in-up">
      <h2 className="text-xl font-bold text-[#F1F5F9] mb-1">Diagnosis & Conditions</h2>
      <p className="text-sm text-[#64748B] mb-6">
        Your diagnosis drives which clinical trials are surfaced.
      </p>

      <div className="space-y-4">
        {/* Primary Condition */}
        <div>
          <label className={labelCls}>Primary Condition *</label>
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Non-Small Cell Lung Cancer, Type 2 Diabetes"
            value={data.primary_condition}
            onChange={(e) => onChange({ primary_condition: e.target.value })}
          />
          <p className="mt-1 text-xs text-[#64748B]">
            Enter your main diagnosis as diagnosed by your physician.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ICD-10 Code */}
          <div>
            <label className={labelCls}>ICD-10 Code (optional)</label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. C34.10"
              value={data.icd10_code || ""}
              onChange={(e) => onChange({ icd10_code: e.target.value.toUpperCase() })}
            />
          </div>

          {/* Stage */}
          <div>
            <label className={labelCls}>Stage (if applicable)</label>
            <select
              className={inputCls}
              value={data.stage || ""}
              onChange={(e) => onChange({ stage: e.target.value })}
            >
              <option value="">Not applicable / Unknown</option>
              <option value="I">Stage I</option>
              <option value="IA">Stage IA</option>
              <option value="IB">Stage IB</option>
              <option value="II">Stage II</option>
              <option value="IIA">Stage IIA</option>
              <option value="IIB">Stage IIB</option>
              <option value="III">Stage III</option>
              <option value="IIIA">Stage IIIA</option>
              <option value="IIIB">Stage IIIB</option>
              <option value="IV">Stage IV (Metastatic)</option>
              <option value="Recurrent">Recurrent</option>
              <option value="Remission">In Remission</option>
            </select>
          </div>

          {/* Diagnosis Date */}
          <div className="md:col-span-2">
            <label className={labelCls}>Diagnosis Date (optional)</label>
            <input
              type="date"
              className={inputCls}
              value={data.diagnosis_date || ""}
              onChange={(e) => onChange({ diagnosis_date: e.target.value })}
            />
          </div>
        </div>

        {/* Secondary Conditions */}
        <div>
          <label className={labelCls}>Secondary Conditions / Comorbidities</label>
          <div className="flex gap-2">
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Hypertension, Type 2 Diabetes"
              value={secInput}
              onChange={(e) => setSecInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSecondaryCondition();
                }
              }}
            />
            <button
              type="button"
              onClick={addSecondaryCondition}
              className="px-4 py-2.5 rounded-lg bg-[rgba(13,148,136,0.1)] text-[#0D9488] border border-[rgba(13,148,136,0.2)] text-sm font-medium hover:bg-[rgba(13,148,136,0.18)] transition-colors whitespace-nowrap"
            >
              + Add
            </button>
          </div>
          <p className="mt-1 text-xs text-[#64748B]">Press Enter or click Add after each condition.</p>

          {data.secondary_conditions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.secondary_conditions.map((cond, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(13,148,136,0.08)] border border-[rgba(13,148,136,0.15)] text-[#0D9488] text-xs"
                >
                  {cond}
                  <button
                    onClick={() => removeSecondary(idx)}
                    className="hover:text-[#EF4444] transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
