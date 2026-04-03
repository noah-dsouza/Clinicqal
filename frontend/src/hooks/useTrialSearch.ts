import { useState, useCallback, useEffect } from "react";
import { ClinicalTrial, MatchResult } from "../types/trial";
import { searchTrials, analyzeEligibility } from "../lib/api";
import { useDigitalTwin } from "../context/DigitalTwinContext";

interface UseTrialSearchReturn {
  trials: ClinicalTrial[];
  isLoading: boolean;
  isAnalyzing: string | null; // NCT ID being analyzed
  error: string | null;
  searchCondition: string;
  total: number;
  runSearch: (condition?: string) => Promise<void>;
  analyzeTrial: (trial: ClinicalTrial) => Promise<MatchResult | null>;
  updateTrialWithResult: (nctId: string, result: MatchResult) => void;
}

export function useTrialSearch(): UseTrialSearchReturn {
  const { sessionId, twin } = useDigitalTwin();
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchCondition, setSearchCondition] = useState("");
  const [total, setTotal] = useState(0);

  const runSearch = useCallback(
    async (condition?: string) => {
      if (!sessionId) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await searchTrials(sessionId, condition, 20);
        setTrials(result.trials);
        setTotal(result.total);
        setSearchCondition(result.condition);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setTrials([]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  const analyzeTrial = useCallback(
    async (trial: ClinicalTrial): Promise<MatchResult | null> => {
      if (!sessionId) return null;

      setIsAnalyzing(trial.nct_id);
      setError(null);

      try {
        const response = await analyzeEligibility(sessionId, trial);
        setTrials((prev) =>
          prev.map((t) =>
            t.nct_id === trial.nct_id
              ? { ...t, match_result: response.match_result }
              : t
          )
        );
        return response.match_result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Eligibility analysis failed"
        );
        return null;
      } finally {
        setIsAnalyzing(null);
      }
    },
    [sessionId]
  );

  const updateTrialWithResult = useCallback((nctId: string, result: MatchResult) => {
    setTrials((prev) =>
      prev.map((t) =>
        t.nct_id === nctId ? { ...t, match_result: result } : t
      )
    );
  }, []);

  // Auto-search when twin is available
  useEffect(() => {
    if (twin && sessionId && trials.length === 0 && !isLoading) {
      runSearch();
    }
  }, [twin, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    trials,
    isLoading,
    isAnalyzing,
    error,
    searchCondition,
    total,
    runSearch,
    analyzeTrial,
    updateTrialWithResult,
  };
}
