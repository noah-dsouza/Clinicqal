import { useState } from "react";
import { motion } from "framer-motion";
import { BiomarkerCard } from "./BiomarkerCard";
import { IntakeFormData } from "../../../types/intake";

interface BiomarkerPanelProps {
  labs: IntakeFormData["labs"];
}

export function BiomarkerPanel({ labs }: BiomarkerPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "abnormal">("all");

  if (labs.length === 0) {
    return (
      <div className="py-6 text-center">
        <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: "rgba(255,255,255,0.05)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-xs text-[#64748B]">No laboratory results recorded</p>
      </div>
    );
  }

  const abnormalLabs = labs.filter((lab) => {
    const isLow = lab.reference_low !== undefined && lab.value < lab.reference_low;
    const isHigh = lab.reference_high !== undefined && lab.value > lab.reference_high;
    return isLow || isHigh;
  });

  const displayLabs = filter === "abnormal" ? abnormalLabs : labs;
  const visibleLabs = showAll ? displayLabs : displayLabs.slice(0, 9);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <motion.button
          onClick={() => setFilter("all")}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="px-3 py-1 text-[10px] font-medium rounded-lg"
          style={
            filter === "all"
              ? { background: "rgba(20,184,166,0.12)", color: "#14B8A6", border: "1px solid rgba(20,184,166,0.25)" }
              : { color: "#64748B", border: "1px solid transparent" }
          }
        >
          All ({labs.length})
        </motion.button>
        <motion.button
          onClick={() => setFilter("abnormal")}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="px-3 py-1 text-[10px] font-medium rounded-lg"
          style={
            filter === "abnormal"
              ? { background: "rgba(248,113,113,0.12)", color: "#F87171", border: "1px solid rgba(248,113,113,0.25)" }
              : { color: "#64748B", border: "1px solid transparent" }
          }
        >
          Abnormal ({abnormalLabs.length})
        </motion.button>
      </div>

      {displayLabs.length === 0 ? (
        <p className="text-xs text-[#64748B] py-3 text-center">No {filter === "abnormal" ? "abnormal " : ""}lab results</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {visibleLabs.map((lab, idx) => (
              <BiomarkerCard
                key={idx}
                name={lab.name}
                value={lab.value}
                unit={lab.unit}
                referenceLow={lab.reference_low}
                referenceHigh={lab.reference_high}
                date={lab.date}
              />
            ))}
          </div>
          {displayLabs.length > 9 && (
            <motion.button
              onClick={() => setShowAll(!showAll)}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="mt-3 w-full py-2 text-[10px] rounded-lg"
              style={{ color: "#94A3B8", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {showAll ? "Show less" : `Show all ${displayLabs.length} results`}
            </motion.button>
          )}
        </>
      )}
    </div>
  );
}
