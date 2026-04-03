"use client";

import { useState, useCallback } from "react";
import { useDigitalTwin } from "@/context/DigitalTwinContext";
import { ClinicalTrial, MatchResult } from "@/lib/utils/trial-schema";

interface UseTrialSearchReturn {
  trials: ClinicalTrial[];
  isLoading: boolean;
  isAnalyzing: string | null; // nct_id of the trial being analyzed
  error: string | null;
  searchCondition: string;
  total: number;
  runSearch: (condition?: string) => Promise<void>;
  analyzeTrial: (trial: ClinicalTrial) => Promise<MatchResult | null>;
  setTrials: React.Dispatch<React.SetStateAction<ClinicalTrial[]>>;
}

export function useTrialSearch(): UseTrialSearchReturn {
  const { twin } = useDigitalTwin();
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchCondition, setSearchCondition] = useState("");
  const [total, setTotal] = useState(0);

  const runSearch = useCallback(
    async (condition?: string) => {
      if (!twin) return;

      setIsLoading(true);
      setError(null);

      const query = condition ?? twin.intake.diagnosis.primary_condition;
      setSearchCondition(query);

      try {
        // Use the analyze endpoint: send an initial message that triggers trial search tools
        const res = await fetch("/api/agent/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            twin,
            messages: [
              {
                role: "user",
                content: `Search for recruiting clinical trials for: ${query}. Return a list of relevant trials with their key details.`,
              },
            ],
          }),
        });

        if (!res.ok) {
          throw new Error(`Search failed: ${res.statusText}`);
        }

        // The analyze endpoint streams. We need to read the stream and parse trials from tool results.
        // The streaming response contains data events — we accumulate text and parse JSON trial arrays.
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        const foundTrials: ClinicalTrial[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Parse server-sent events from Vercel AI SDK data stream
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("2:")) continue; // type 2 = tool results in data stream
            try {
              const jsonStr = line.slice(2);
              const data = JSON.parse(jsonStr);
              // Tool results come as arrays
              if (Array.isArray(data)) {
                for (const item of data) {
                  if (item?.type === "tool_result" && Array.isArray(item?.result?.trials)) {
                    for (const t of item.result.trials) {
                      if (t?.nct_id && !foundTrials.find((x) => x.nct_id === t.nct_id)) {
                        foundTrials.push(t as ClinicalTrial);
                      }
                    }
                    setTrials([...foundTrials]);
                    setTotal(foundTrials.length);
                  }
                }
              }
            } catch {
              // skip malformed lines
            }
          }
        }

        // If streaming parsing found nothing, try a direct ClinicalTrials.gov call as fallback
        if (foundTrials.length === 0) {
          const ctRes = await fetch(
            `/api/search-trials?condition=${encodeURIComponent(query)}`
          );
          if (ctRes.ok) {
            const ctData = await ctRes.json();
            if (Array.isArray(ctData.trials)) {
              setTrials(ctData.trials);
              setTotal(ctData.trials.length);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setIsLoading(false);
      }
    },
    [twin]
  );

  const analyzeTrial = useCallback(
    async (trial: ClinicalTrial): Promise<MatchResult | null> => {
      if (!twin) return null;

      setIsAnalyzing(trial.nct_id);
      try {
        const res = await fetch("/api/agent/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ twin, trials: [trial] }),
        });

        if (!res.ok) throw new Error("Analysis failed");
        const data = await res.json();

        // data is TrialScoresSchema output: array of { nct_id, ...TrialEligibilitySchema }
        const scored = Array.isArray(data) ? data[0] : data?.scores?.[0];
        if (!scored) return null;

        const matchResult: MatchResult = {
          trial_nct_id: trial.nct_id,
          overall_score: scored.overall_score,
          recommendation: scored.recommendation,
          inclusion_matches: scored.inclusion_matches ?? [],
          exclusion_matches: scored.exclusion_matches ?? [],
          key_concerns: scored.key_concerns ?? [],
          plain_english_summary: scored.plain_english_summary ?? "",
        };

        // Update the trial in state with the match result
        setTrials((prev) =>
          prev.map((t) =>
            t.nct_id === trial.nct_id ? { ...t, match_result: matchResult } : t
          )
        );

        return matchResult;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
        return null;
      } finally {
        setIsAnalyzing(null);
      }
    },
    [twin]
  );

  return {
    trials,
    isLoading,
    isAnalyzing,
    error,
    searchCondition,
    total,
    runSearch,
    analyzeTrial,
    setTrials,
  };
}
