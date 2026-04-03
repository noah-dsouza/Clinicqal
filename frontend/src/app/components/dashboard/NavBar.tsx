import { useDigitalTwin } from "../../../context/DigitalTwinContext";

interface NavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRetakeIntake: () => void;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "trials", label: "Clinical Trials" },
  { id: "scenario", label: "Scenario Builder" },
];

export function NavBar({ activeTab, onTabChange, onRetakeIntake }: NavBarProps) {
  const { twin } = useDigitalTwin();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(13,148,136,0.1)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
            <span className="text-base font-bold text-[#111827]">ClinIQ</span>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 min-w-[130px] text-center ${
                  activeTab === tab.id
                    ? "bg-[rgba(13,148,136,0.1)] text-[#0D9488] border border-[rgba(13,148,136,0.25)]"
                    : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Patient Info + Actions */}
          <div className="flex items-center gap-3">
            {twin && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="w-6 h-6 rounded-full bg-[rgba(13,148,136,0.15)] flex items-center justify-center">
                  <span className="text-[#0D9488] text-xs font-bold">
                    {twin.intake.demographics.age}
                  </span>
                </div>
                <span className="text-xs text-[#6B7280]">
                  {twin.intake.demographics.sex.charAt(0).toUpperCase() +
                    twin.intake.demographics.sex.slice(1)}{" "}
                  · {twin.intake.diagnosis.primary_condition.split(" ").slice(0, 3).join(" ")}
                </span>
              </div>
            )}

            <button
              onClick={onRetakeIntake}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E7EB] text-[#9CA3AF] hover:text-[#111827] hover:border-[#D1D5DB] transition-colors"
            >
              Retake Intake
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1 pb-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[rgba(13,148,136,0.1)] text-[#0D9488]"
                  : "text-[#6B7280]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
