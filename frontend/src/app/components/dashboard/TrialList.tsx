import React, { useState } from "react";
import { ClinicalTrial } from "../../../types/trial";
import { TrialCard } from "./TrialCard";
import { EligibilityDrawer } from "./EligibilityDrawer";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { useTrialSearch } from "../../../hooks/useTrialSearch";

export function TrialList() {
  const {
    trials,
    isLoading,
    isAnalyzing,
    error,
    searchCondition,
    total,
    runSearch,
    analyzeTrial,
  } = useTrialSearch();

  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const handleAnalyze = async (trial: ClinicalTrial) => {
    const result = await analyzeTrial(trial);
    if (result) {
      setSelectedTrial({ ...trial, match_result: result });
    }
  };

  const handleViewDetails = (trial: ClinicalTrial) => {
    setSelectedTrial(trial);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(searchInput || undefined);
  };

  return (
    <div className="relative">
      {/* Search bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-5 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Search trials${searchCondition ? ` (current: "${searchCondition}")` : ""}...`}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[rgba(13,148,136,0.2)] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-semibold hover:bg-[#0f766e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </form>

        {(searchCondition || total > 0) && (
          <p className="text-xs text-[#64748B] mt-2">
            {total} recruiting trials found
            {searchCondition && (
              <>
                {" "}for{" "}
                <span className="text-[#94A3B8]">"{searchCondition}"</span>
              </>
            )}
          </p>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" color="#0D9488" label="Searching ClinicalTrials.gov..." />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="py-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.3)] text-[#F43F5E] text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            {error}
          </div>
          <button
            onClick={() => runSearch()}
            className="mt-4 px-4 py-2 text-sm text-[#0D9488] hover:text-[#14b8a6] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && trials.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                stroke="#64748B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect x="9" y="3" width="6" height="4" rx="1" ry="1" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[#94A3B8] font-medium mb-2">No trials found</p>
          <p className="text-xs text-[#64748B] mb-4">
            Try a different search term or broader condition name
          </p>
          <button
            onClick={() => runSearch()}
            className="px-4 py-2 text-sm bg-[rgba(13,148,136,0.15)] text-[#0D9488] border border-[rgba(13,148,136,0.3)] rounded-lg hover:bg-[rgba(13,148,136,0.25)] transition-colors"
          >
            Search with your condition
          </button>
        </div>
      )}

      {/* Trial grid */}
      {!isLoading && trials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trials.map((trial) => (
            <TrialCard
              key={trial.nct_id}
              trial={trial}
              isAnalyzing={isAnalyzing === trial.nct_id}
              onAnalyze={handleAnalyze}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Eligibility Drawer */}
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
