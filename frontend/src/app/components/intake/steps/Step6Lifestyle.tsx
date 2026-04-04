import { IntakeFormData } from "../../../../types/intake";

interface Props {
  lifestyle: IntakeFormData["lifestyle"];
  onChange: (updates: Partial<IntakeFormData["lifestyle"]>) => void;
}

interface OptionGroup<T extends string> {
  value: T;
  label: string;
  description: string;
  color: string;
}

const SMOKING_OPTIONS: OptionGroup<"never" | "former" | "current">[] = [
  { value: "never", label: "Never Smoked", description: "No history of tobacco use", color: "#3D8B4E" },
  { value: "former", label: "Former Smoker", description: "Quit more than 12 months ago", color: "#B8860B" },
  { value: "current", label: "Current Smoker", description: "Active tobacco use", color: "#B83232" },
];

const ALCOHOL_OPTIONS: OptionGroup<"none" | "moderate" | "heavy">[] = [
  { value: "none", label: "None", description: "No alcohol consumption", color: "#3D8B4E" },
  { value: "moderate", label: "Moderate", description: "1-2 drinks/day or <14/week", color: "#B8860B" },
  { value: "heavy", label: "Heavy", description: ">2 drinks/day or ≥14/week", color: "#B83232" },
];

const ACTIVITY_OPTIONS: OptionGroup<"sedentary" | "light" | "moderate" | "active">[] = [
  { value: "sedentary", label: "Sedentary", description: "Little to no regular exercise", color: "#B83232" },
  { value: "light", label: "Light", description: "Walking, light activities 1-3x/week", color: "#B8860B" },
  { value: "moderate", label: "Moderate", description: "Exercise 3-5x/week, moderate intensity", color: "#3D8B4E" },
  { value: "active", label: "Active", description: "Daily vigorous exercise", color: "#2E6B3E" },
];

const DIET_OPTIONS: OptionGroup<"poor" | "average" | "good">[] = [
  { value: "poor", label: "Poor", description: "Mostly processed foods, few vegetables", color: "#B83232" },
  { value: "average", label: "Average", description: "Mixed diet, some healthy choices", color: "#B8860B" },
  { value: "good", label: "Good", description: "Mostly whole foods, vegetables, balanced", color: "#3D8B4E" },
];

function OptionSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: OptionGroup<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[#6B7F6A] mb-2 uppercase tracking-wide">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`p-3 rounded-lg border text-left transition-all duration-150 ${
                isSelected
                  ? "border-current bg-[rgba(47,62,52,0.04)]"
                  : "border-[rgba(47,62,52,0.12)] hover:border-[rgba(47,62,52,0.3)] hover:bg-[rgba(47,62,52,0.03)]"
              }`}
              style={
                isSelected
                  ? {
                      borderColor: opt.color,
                      boxShadow: `0 0 12px ${opt.color}15`,
                    }
                  : {}
              }
            >
              <div
                className="text-sm font-semibold mb-0.5"
                style={{ color: isSelected ? opt.color : "#4B5563" }}
              >
                {opt.label}
              </div>
              <div className="text-xs text-[#8B7765] leading-tight">{opt.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Step6Lifestyle({ lifestyle, onChange }: Props) {
  return (
    <div className="fade-in-up">
      <h2 className="text-xl font-bold text-[#2F3E34] mb-1">Lifestyle Factors</h2>
      <p className="text-sm text-[#8B7765] mb-6">
        Lifestyle data affects your health score and many trial eligibility criteria.
      </p>

      <div className="space-y-6">
        <OptionSelector
          label="Smoking Status"
          options={SMOKING_OPTIONS}
          value={lifestyle.smoking_status}
          onChange={(v) => onChange({ smoking_status: v })}
        />

        <OptionSelector
          label="Alcohol Use"
          options={ALCOHOL_OPTIONS}
          value={lifestyle.alcohol_use}
          onChange={(v) => onChange({ alcohol_use: v })}
        />

        <OptionSelector
          label="Physical Activity Level"
          options={ACTIVITY_OPTIONS}
          value={lifestyle.physical_activity}
          onChange={(v) => onChange({ physical_activity: v })}
        />

        <OptionSelector
          label="Diet Quality"
          options={DIET_OPTIONS}
          value={lifestyle.diet_quality}
          onChange={(v) => onChange({ diet_quality: v })}
        />
      </div>

      <div className="mt-6 p-4 bg-[rgba(13,148,136,0.06)] rounded-xl border border-[rgba(13,148,136,0.15)]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[rgba(13,148,136,0.12)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="#0D9488"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[#2F3E34]">You're almost ready!</p>
            <p className="text-xs text-[#8B7765] mt-1">
              Click "Build My Digital Twin" to create your personalized health profile. We'll analyze
              your data and match you with active clinical trials. This process takes a few seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
