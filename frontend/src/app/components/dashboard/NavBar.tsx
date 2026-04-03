import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDigitalTwin } from "../../../context/DigitalTwinContext";
import { LogoMark } from "../shared/LogoMark";

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
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b"
      style={{ background: "rgba(246,243,237,0.95)", borderColor: "rgba(47,62,52,0.1)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2.5 cursor-default"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <LogoMark size={28} showWordmark={true} />
          </motion.div>

          {/* Tabs */}
          <nav ref={containerRef} className="hidden md:flex items-center gap-1 relative">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  className="relative px-4 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: isActive ? "rgba(47,62,52,0.1)" : "transparent",
                    color: isActive ? "#2F3E34" : "#8B7765",
                    border: isActive ? "1px solid rgba(47,62,52,0.2)" : "1px solid transparent",
                    boxShadow: isActive ? "0 0 12px rgba(47,62,52,0.08)" : "none",
                    transition: "color 0.2s, background 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "#5C524A";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "#8B7765";
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-glow"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "rgba(47,62,52,0.06)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* Patient info + actions */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {twin && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                  style={{ background: "rgba(47,62,52,0.06)", border: "1px solid rgba(47,62,52,0.1)" }}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(47,62,52,0.12)", color: "#2F3E34" }}>
                    {twin.intake.demographics.age}
                  </div>
                  <span className="text-[10px] text-[#8B7765]">
                    {twin.intake.demographics.sex.charAt(0).toUpperCase() + twin.intake.demographics.sex.slice(1)}
                    {" · "}
                    {twin.intake.diagnosis.primary_condition.split(" ").slice(0, 3).join(" ")}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              onClick={onRetakeIntake}
              whileHover={{ scale: 1.05, color: "#5C524A" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="px-3 py-1.5 text-[10px] font-medium rounded-lg"
              style={{ background: "rgba(47,62,52,0.06)", color: "#8B7765", border: "1px solid rgba(47,62,52,0.1)" }}
            >
              Retake Intake
            </motion.button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1 pb-2 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap"
                style={{
                  background: isActive ? "rgba(47,62,52,0.1)" : "transparent",
                  color: isActive ? "#2F3E34" : "#8B7765",
                }}
              >
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
