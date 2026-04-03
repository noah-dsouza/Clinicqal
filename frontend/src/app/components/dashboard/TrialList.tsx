import React, { useState } from "react";
import { motion } from "framer-motion";
import { ClinicalTrial } from "../../../types/trial";
import { TrialCard } from "./TrialCard";
import { EligibilityDrawer } from "./EligibilityDrawer";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { useTrialSearch } from "../../../hooks/useTrialSearch";

export function TrialList() {
  const { trials, isLoading, isAnalyzing, error, searchCondition, total, runSearch, analyzeTrial } = useTrialSearch();
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const handleAnalyze = async (trial: ClinicalTrial) => {
    const result = await analyzeTrial(trial);
    if (result) setSelectedTrial({ ...trial, match_result: result });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(searchInput || undefined);
  };

  return (
    <div className="relative">
      {/* Search bar */}
      <div className="rounded-xl border p-3.5 mb-5" style={{ background: "#FFFFFF", borderColor: "rgba(47,62,52,0.1)" }}>
        <form onSubmit={handleSearch} className="flex gap-2.5">
          <div className="flex-1 relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" stroke="#B1A79F" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="#B1A79F" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Search trials${searchCondition ? ` (current: "${searchCondition}")` : ""}...`}
              className="w-full rounded-lg pl-8 pr-4 py-2 text-xs text-[#2F3E34] placeholder-[#B1A79F] focus:outline-none transition-colors"
              style={{ background: "rgba(47,62,52,0.04)", border: "1px solid rgba(47,62,52,0.1)" }}
            />
          </div>
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.05, boxShadow: "0 0 16px rgba(47,62,52,0.2)" } : {}}
            whileTap={!isLoading ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
            style={{ background: "#2F3E34", color: "#fff" }}
          >
            Search
          </motion.button>
        </form>
        {(searchCondition || total > 0) && (
          <p className="text-[10px] text-[#B1A79F] mt-2">
            {total} recruiting trials found{searchCondition && <> for <span className="text-[#8B7765]">"{searchCondition}"</span></>}
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" color="#2F3E34" label="Searching ClinicalTrials.gov..." />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="py-8 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(193,132,58,0.1)", border: "1px solid rgba(193,132,58,0.2)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#C1843A" strokeWidth="2" /><line x1="12" y1="8" x2="12" y2="12" stroke="#C1843A" strokeWidth="2" strokeLinecap="round" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#C1843A" strokeWidth="3" strokeLinecap="round" /></svg>
          </div>
          <div className="max-w-sm mx-auto">
            <p className="text-sm font-medium text-[#2F3E34] mb-1">Search failed</p>
            <p className="text-xs text-[#8B7765] mb-3 leading-relaxed">{error}</p>
          </div>
          <motion.button
            onClick={() => runSearch()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="px-4 py-2 text-xs rounded-lg"
            style={{ background: "rgba(47,62,52,0.08)", color: "#2F3E34", border: "1px solid rgba(47,62,52,0.15)" }}
          >
            Try again
          </motion.button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && trials.length === 0 && (
        <div className="py-14 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(47,62,52,0.06)", border: "1px solid rgba(47,62,52,0.1)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="#B1A79F" strokeWidth="2" strokeLinecap="round" />
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="#B1A79F" strokeWidth="2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#8B7765] mb-1">No trials found</p>
          <p className="text-xs text-[#B1A79F] mb-4">Try a different search term or broader condition name</p>
          <motion.button
            onClick={() => runSearch()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="px-4 py-2 text-xs rounded-lg"
            style={{ background: "rgba(47,62,52,0.08)", color: "#2F3E34", border: "1px solid rgba(47,62,52,0.15)" }}
          >
            Search with your condition
          </motion.button>
        </div>
      )}

      {/* Grid */}
      {!isLoading && trials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {trials.map((trial) => (
            <TrialCard
              key={trial.nct_id}
              trial={trial}
              isAnalyzing={isAnalyzing === trial.nct_id}
              onAnalyze={handleAnalyze}
              onViewDetails={(t) => setSelectedTrial(t)}
            />
          ))}
        </div>
      )}

      <EligibilityDrawer
        trial={selectedTrial}
        isOpen={!!selectedTrial}
        onClose={() => setSelectedTrial(null)}
        onAnalyze={handleAnalyze}
        isAnalyzing={selectedTrial ? isAnalyzing === selectedTrial.nct_id : false}
      />
    </div>
  );
}
