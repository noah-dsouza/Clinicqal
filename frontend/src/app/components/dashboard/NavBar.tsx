import { useDigitalTwin } from "../../../context/DigitalTwinContext";

interface NavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRetakeIntake: () => void;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "trials", label: "Clinical Trials" },
  { id: "support", label: "Find Support" },
];

export function NavBar({ activeTab, onTabChange, onRetakeIntake }: NavBarProps) {
  const { twin } = useDigitalTwin();

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b"
      style={{ background: "rgba(15,23,42,0.92)", borderColor: "rgba(255,255,255,0.07)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.25)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7l9 5 9-5-9-5z" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 12l9 5 9-5" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 17l9 5 9-5" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-bold text-[#F1F5F9]">ClinIQ</span>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={
                  activeTab === tab.id
                    ? { background: "rgba(20,184,166,0.12)", color: "#14B8A6", border: "1px solid rgba(20,184,166,0.25)" }
                    : { color: "#64748B", border: "1px solid transparent" }
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Patient info + actions */}
          <div className="flex items-center gap-2">
            {twin && (
              <div
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(20,184,166,0.15)", color: "#14B8A6" }}>
                  {twin.intake.demographics.age}
                </div>
                <span className="text-[10px] text-[#94A3B8]">
                  {twin.intake.demographics.sex.charAt(0).toUpperCase() + twin.intake.demographics.sex.slice(1)}
                  {" · "}
                  {twin.intake.diagnosis.primary_condition.split(" ").slice(0, 3).join(" ")}
                </span>
              </div>
            )}
            <button
              onClick={onRetakeIntake}
              className="px-3 py-1.5 text-[10px] font-medium rounded-lg transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", color: "#64748B", border: "1px solid rgba(255,255,255,0.07)" }}
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
              className="px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all"
              style={
                activeTab === tab.id
                  ? { background: "rgba(20,184,166,0.12)", color: "#14B8A6" }
                  : { color: "#64748B" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
