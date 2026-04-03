import { IntakeFormData } from "../../../../types/intake";

interface Props {
  data: IntakeFormData["demographics"];
  onChange: (updates: Partial<IntakeFormData["demographics"]>) => void;
}

const inputCls =
  "w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] rounded-lg px-4 py-2.5 text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[rgba(20,184,166,0.4)] transition-colors";

const labelCls = "block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wide";

export function Step1Demographics({ data, onChange }: Props) {
  return (
    <div className="fade-in-up">
      <h2 className="text-xl font-bold text-[#F1F5F9] mb-1">Demographics</h2>
      <p className="text-sm text-[#64748B] mb-6">
        Basic demographic information helps match you with eligible trials.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Age */}
        <div>
          <label className={labelCls}>Age *</label>
          <input
            type="number"
            className={inputCls}
            placeholder="e.g. 45"
            min={0}
            max={130}
            value={data.age || ""}
            onChange={(e) => onChange({ age: parseInt(e.target.value) || 0 })}
          />
        </div>

        {/* Sex */}
        <div>
          <label className={labelCls}>Biological Sex *</label>
          <select
            className={inputCls}
            value={data.sex}
            onChange={(e) => onChange({ sex: e.target.value as "male" | "female" | "other" })}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other / Prefer not to say</option>
          </select>
        </div>

        {/* Ethnicity */}
        <div>
          <label className={labelCls}>Ethnicity</label>
          <select
            className={inputCls}
            value={data.ethnicity}
            onChange={(e) => onChange({ ethnicity: e.target.value })}
          >
            <option value="">Select ethnicity</option>
            <option value="White/Caucasian">White / Caucasian</option>
            <option value="Black/African American">Black / African American</option>
            <option value="Hispanic/Latino">Hispanic / Latino</option>
            <option value="Asian">Asian</option>
            <option value="Native American">Native American</option>
            <option value="Pacific Islander">Pacific Islander</option>
            <option value="Mixed/Multiracial">Mixed / Multiracial</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        {/* ZIP Code */}
        <div>
          <label className={labelCls}>ZIP Code</label>
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. 90210"
            maxLength={10}
            value={data.zip_code}
            onChange={(e) => onChange({ zip_code: e.target.value })}
          />
        </div>

        {/* Weight */}
        <div>
          <label className={labelCls}>Weight (kg) *</label>
          <input
            type="number"
            className={inputCls}
            placeholder="e.g. 75"
            min={1}
            max={500}
            step={0.1}
            value={data.weight_kg || ""}
            onChange={(e) => onChange({ weight_kg: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* Height */}
        <div>
          <label className={labelCls}>Height (cm) *</label>
          <input
            type="number"
            className={inputCls}
            placeholder="e.g. 175"
            min={50}
            max={280}
            value={data.height_cm || ""}
            onChange={(e) => onChange({ height_cm: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      {/* BMI Preview */}
      {data.weight_kg > 0 && data.height_cm > 0 && (
        <div className="mt-4 p-3 bg-[rgba(13,148,136,0.06)] rounded-lg border border-[rgba(13,148,136,0.15)]">
          <span className="text-xs text-[#94A3B8]">Calculated BMI: </span>
          <span className="text-sm font-semibold text-[#0D9488]">
            {(data.weight_kg / Math.pow(data.height_cm / 100, 2)).toFixed(1)} kg/m²
          </span>
        </div>
      )}
    </div>
  );
}
