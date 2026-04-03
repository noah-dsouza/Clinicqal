import React from "react";
import { ClinicalTrial } from "../../../types/trial";
import { Badge } from "../shared/Badge";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import {
  getRecommendationColor,
  getRecommendationLabel,
  formatPhase,
  truncate,
} from "../../../lib/utils";

interface TrialCardProps {
  trial: ClinicalTrial;
  isAnalyzing: boolean;
  onAnalyze: (trial: ClinicalTrial) => void;
  onViewDetails: (trial: ClinicalTrial) => void;
}

function ScoreRing({ score, color, size = 52 }: { score: number; color: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeDashoffset={circumference * 0.25}
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-xs font-bold"
        style={{ color }}
      >
        {score}
      </div>
    </div>
  );
}

function getPhaseVariant(phase: string): "violet" | "blue" | "teal" | "muted" {
  const p = phase.toLowerCase();
  if (p.includes("3") || p.includes("iii")) return "violet";
  if (p.includes("2") || p.includes("ii")) return "blue";
  if (p.includes("1") || p.includes("i")) return "teal";
  return "muted";
}

export function TrialCard({ trial, isAnalyzing, onAnalyze, onViewDetails }: TrialCardProps) {
  const matchResult = trial.match_result;
  const hasResult = !!matchResult;
  const recColor = hasResult ? getRecommendationColor(matchResult.recommendation) : "#9CA3AF";
  const recLabel = hasResult ? getRecommendationLabel(matchResult.recommendation) : null;

  const locationCount = trial.locations.length;
  const firstLocation = trial.locations[0];

  return (
    <div
      className="bg-white rounded-xl border border-[#E5E7EB] p-4 transition-all duration-200 hover:border-[rgba(13,148,136,0.3)] hover:bg-[#F9FAFB]"
      style={{
        borderColor: hasResult ? `${recColor}30` : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Score ring */}
        {hasResult ? (
          <ScoreRing score={matchResult.overall_score} color={recColor} />
        ) : (
          <div className="w-[52px] h-[52px] rounded-full border-2 border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-[#9CA3AF]">—</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={getPhaseVariant(trial.phase)} size="sm">
              {formatPhase(trial.phase)}
            </Badge>
            {hasResult && (
              <Badge
                variant={
                  matchResult.recommendation === "strong_match"
                    ? "emerald"
                    : matchResult.recommendation === "possible_match"
                    ? "teal"
                    : matchResult.recommendation === "unlikely"
                    ? "amber"
                    : "rose"
                }
                size="sm"
              >
                {recLabel}
              </Badge>
            )}
          </div>
          <h3 className="text-sm font-semibold text-[#111827] leading-snug line-clamp-2">
            {trial.title}
          </h3>
        </div>
      </div>

      {/* Sponsor & NCT */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#9CA3AF] truncate max-w-[60%]">{trial.sponsor}</span>
        <a
          href={trial.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#0D9488] hover:text-[#0f766e] transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {trial.nct_id} ↗
        </a>
      </div>

      {/* Summary */}
      <p className="text-xs text-[#6B7280] mb-3 line-clamp-2 leading-relaxed">
        {truncate(trial.brief_summary, 140)}
      </p>

      {/* Key concerns from match result */}
      {hasResult && matchResult.key_concerns.length > 0 && (
        <div className="mb-3 space-y-1">
          {matchResult.key_concerns.slice(0, 2).map((concern, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-[#F59E0B] text-xs mt-0.5">⚠</span>
              <span className="text-xs text-[#6B7280] leading-relaxed">{truncate(concern, 80)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Location */}
      {firstLocation && (
        <div className="flex items-center gap-1.5 mb-3">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
              stroke="#9CA3AF"
              strokeWidth="2"
            />
            <circle cx="12" cy="10" r="3" stroke="#9CA3AF" strokeWidth="2" />
          </svg>
          <span className="text-xs text-[#9CA3AF]">
            {firstLocation.city}, {firstLocation.state}
            {locationCount > 1 && ` +${locationCount - 1} more`}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onAnalyze(trial)}
          disabled={isAnalyzing}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          style={{
            background: "rgba(13, 148, 136, 0.1)",
            color: "#0D9488",
            border: "1px solid rgba(13, 148, 136, 0.25)",
          }}
        >
          {isAnalyzing ? (
            <>
              <LoadingSpinner size="sm" color="#0D9488" />
              Analyzing...
            </>
          ) : hasResult ? (
            "Re-analyze"
          ) : (
            "Analyze Eligibility"
          )}
        </button>

        {hasResult && (
          <button
            onClick={() => onViewDetails(trial)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: `${recColor}12`,
              color: recColor,
              border: `1px solid ${recColor}25`,
            }}
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
