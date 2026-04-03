import React, { useState } from "react";
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
      <div className="rounded-xl border p-3.5 mb-5" style={{ background: "#1E293B", borderColor: "rgba(255,255,255,0.07)" }}>
        <form onSubmit={handleSearch} className="flex gap-2.5">
          <div className="flex-1 relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" stroke="#64748B" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Search trials${searchCondition ? ` (current: "${searchCondition}")` : ""}...`}
              className="w-full rounded-lg pl-8 pr-4 py-2 text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            style={{ background: "#14B8A6", color: "#fff" }}
          >
            Search
          </button>
        </form>
        {(searchCondition || total > 0) && (
          <p className="text-[10px] text-[#64748B] mt-2">
            {total} recruiting trials found{searchCondition && <> for <span className="text-[#94A3B8]">"{searchCondition}"</span></>}
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" color="#14B8A6" label="Searching ClinicalTrials.gov..." />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="py-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#F87171" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            {error}
          </div>
          <button onClick={() => runSearch()} className="mt-4 px-4 py-2 text-xs text-[#14B8A6] hover:text-[#2DD4BF] transition-colors">
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && trials.length === 0 && (
        <div className="py-14 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="#64748B" strokeWidth="2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#94A3B8] mb-1">No trials found</p>
          <p className="text-xs text-[#64748B] mb-4">Try a different search term or broader condition name</p>
          <button
            onClick={() => runSearch()}
            className="px-4 py-2 text-xs rounded-lg transition-colors"
            style={{ background: "rgba(20,184,166,0.1)", color: "#14B8A6", border: "1px solid rgba(20,184,166,0.2)" }}
          >
            Search with your condition
          </button>
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
