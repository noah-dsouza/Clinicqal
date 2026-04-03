import { ClinicalTrial } from "../../../types/trial";
import { Badge } from "../shared/Badge";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { getRecommendationColor, getRecommendationLabel, formatPhase, truncate } from "../../../lib/utils";

interface TrialCardProps {
  trial: ClinicalTrial;
  isAnalyzing: boolean;
  onAnalyze: (trial: ClinicalTrial) => void;
  onViewDetails: (trial: ClinicalTrial) => void;
}

function ScoreRing({ score, color, size = 48 }: { score: number; color: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeDashoffset={circumference * 0.25}
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color }}>
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
  const recColor = hasResult ? getRecommendationColor(matchResult.recommendation) : "#64748B";
  const recLabel = hasResult ? getRecommendationLabel(matchResult.recommendation) : null;
  const firstLocation = trial.locations[0];
  const locationCount = trial.locations.length;

  return (
    <div
      className="rounded-xl border p-4 transition-all duration-200"
      style={{
        background: "#1E293B",
        borderColor: hasResult ? `${recColor}30` : "rgba(255,255,255,0.07)",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {hasResult ? (
          <ScoreRing score={matchResult.overall_score} color={recColor} />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <span className="text-xs text-[#64748B]">—</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <Badge variant={getPhaseVariant(trial.phase)} size="sm">{formatPhase(trial.phase)}</Badge>
            {hasResult && (
              <Badge
                variant={matchResult.recommendation === "strong_match" ? "emerald" : matchResult.recommendation === "possible_match" ? "teal" : matchResult.recommendation === "unlikely" ? "amber" : "rose"}
                size="sm"
              >
                {recLabel}
              </Badge>
            )}
          </div>
          <h3 className="text-xs font-semibold text-[#F1F5F9] leading-snug line-clamp-2">{trial.title}</h3>
        </div>
      </div>

      {/* Sponsor + NCT */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[#64748B] truncate max-w-[60%]">{trial.sponsor}</span>
        <a href={trial.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#14B8A6] hover:text-[#2DD4BF] transition-colors" onClick={(e) => e.stopPropagation()}>
          {trial.nct_id} ↗
        </a>
      </div>

      <p className="text-[10px] text-[#94A3B8] mb-2.5 line-clamp-2 leading-relaxed">{truncate(trial.brief_summary, 130)}</p>

      {hasResult && matchResult.key_concerns.length > 0 && (
        <div className="mb-2.5 space-y-1">
          {matchResult.key_concerns.slice(0, 2).map((concern, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-[#FBBF24] text-[10px] mt-0.5">⚠</span>
              <span className="text-[10px] text-[#94A3B8] leading-relaxed">{truncate(concern, 80)}</span>
            </div>
          ))}
        </div>
      )}

      {firstLocation && (
        <div className="flex items-center gap-1.5 mb-3">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#64748B" strokeWidth="2" />
            <circle cx="12" cy="10" r="3" stroke="#64748B" strokeWidth="2" />
          </svg>
          <span className="text-[10px] text-[#64748B]">{firstLocation.city}, {firstLocation.state}{locationCount > 1 && ` +${locationCount - 1} more`}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onAnalyze(trial)}
          disabled={isAnalyzing}
          className="flex-1 py-2 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          style={{ background: "rgba(20,184,166,0.1)", color: "#14B8A6", border: "1px solid rgba(20,184,166,0.2)" }}
        >
          {isAnalyzing ? <><LoadingSpinner size="sm" color="#14B8A6" />Analyzing...</> : hasResult ? "Re-analyze" : "Analyze Eligibility"}
        </button>
        {hasResult && (
          <button
            onClick={() => onViewDetails(trial)}
            className="flex-1 py-2 rounded-lg text-[10px] font-semibold transition-all"
            style={{ background: `${recColor}12`, color: recColor, border: `1px solid ${recColor}25` }}
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
