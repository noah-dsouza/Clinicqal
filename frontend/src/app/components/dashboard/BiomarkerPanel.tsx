import React, { useState } from "react";
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
      <div className="py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-sm text-[#9CA3AF]">No laboratory results recorded</p>
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
      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filter === "all"
              ? "bg-[rgba(13,148,136,0.1)] text-[#0D9488] border border-[rgba(13,148,136,0.25)]"
              : "text-[#9CA3AF] hover:text-[#6B7280]"
          }`}
        >
          All ({labs.length})
        </button>
        <button
          onClick={() => setFilter("abnormal")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filter === "abnormal"
              ? "bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.25)]"
              : "text-[#9CA3AF] hover:text-[#6B7280]"
          }`}
        >
          Abnormal ({abnormalLabs.length})
        </button>
      </div>

      {displayLabs.length === 0 ? (
        <p className="text-sm text-[#9CA3AF] text-center py-4">
          No {filter === "abnormal" ? "abnormal" : ""} lab results to display
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 w-full py-2 text-xs text-[#6B7280] hover:text-[#0D9488] border border-[#E5E7EB] hover:border-[rgba(13,148,136,0.3)] rounded-lg transition-colors"
            >
              {showAll ? "Show less" : `Show all ${displayLabs.length} results`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
