import React from "react";
import { ClinicalTrial, CriterionMatch } from "../../../types/trial";
import { getCriterionStatusColor, getRecommendationColor, getRecommendationLabel, formatPhase } from "../../../lib/utils";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { Badge } from "../shared/Badge";

interface EligibilityDrawerProps {
  trial: ClinicalTrial | null;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (trial: ClinicalTrial) => void;
  isAnalyzing: boolean;
}

function CriterionRow({ criterion }: { criterion: CriterionMatch }) {
  const color = getCriterionStatusColor(criterion.status);
  const icon = {
    met: "✓",
    likely_met: "~",
    unmet: "✗",
    likely_unmet: "!",
    unknown: "?",
  }[criterion.status] ?? "?";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#F3F4F6] last:border-0">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold"
        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#111827] leading-snug mb-1">{criterion.criterion_text}</p>
        <p className="text-[11px] text-[#9CA3AF] leading-relaxed">{criterion.reasoning}</p>
      </div>
    </div>
  );
}

function ScoreArc({ score, color }: { score: number; color: string }) {
  const size = 80;
  const radius = 32;
  const circumference = Math.PI * radius; // half circle
  const stroke = (score / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size / 2 + 8 }}>
      <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
        {/* Track */}
        <path
          d={`M 8 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2}`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={8}
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M 8 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${stroke} ${circumference}`}
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <div
        className="absolute bottom-0 left-0 right-0 text-center"
        style={{ bottom: -2 }}
      >
        <span className="text-xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-[#9CA3AF]">/100</span>
      </div>
    </div>
  );
}

export function EligibilityDrawer({
  trial,
  isOpen,
  onClose,
  onAnalyze,
  isAnalyzing,
}: EligibilityDrawerProps) {
  if (!isOpen || !trial) return null;

  const match = trial.match_result;
  const hasResult = !!match;
  const recColor = hasResult ? getRecommendationColor(match.recommendation) : "#9CA3AF";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-lg z-50 flex flex-col overflow-hidden"
        style={{
          background: "#FFFFFF",
          borderLeft: "1px solid #E5E7EB",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="violet" size="sm">{formatPhase(trial.phase)}</Badge>
              <span className="text-xs text-[#9CA3AF]">{trial.nct_id}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <h2 className="text-sm font-semibold text-[#111827] leading-snug mb-1">
            {trial.title}
          </h2>
          <p className="text-xs text-[#9CA3AF]">{trial.sponsor}</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Match result section */}
          {hasResult ? (
            <div className="px-5 py-5 space-y-5">
              {/* Score + recommendation */}
              <div
                className="rounded-xl p-4 border flex items-center gap-4"
                style={{
                  background: `${recColor}06`,
                  borderColor: `${recColor}20`,
                }}
              >
                <ScoreArc score={match.overall_score} color={recColor} />
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1 uppercase tracking-wider">Overall Match</p>
                  <p className="text-base font-bold" style={{ color: recColor }}>
                    {getRecommendationLabel(match.recommendation)}
                  </p>
                  {match.key_concerns.length > 0 && (
                    <p className="text-xs text-[#6B7280] mt-1">
                      {match.key_concerns.length} concern{match.key_concerns.length > 1 ? "s" : ""} identified
                    </p>
                  )}
                </div>
              </div>

              {/* Plain English Summary */}
              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
                <h3 className="text-xs font-semibold text-[#0D9488] uppercase tracking-wider mb-2">
                  Summary
                </h3>
                <p className="text-sm text-[#111827] leading-relaxed">{match.plain_english_summary}</p>
              </div>

              {/* Key Concerns */}
              {match.key_concerns.length > 0 && (
                <div className="bg-[rgba(245,158,11,0.04)] rounded-xl p-4 border border-[rgba(245,158,11,0.15)]">
                  <h3 className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider mb-3">
                    Key Concerns
                  </h3>
                  <ul className="space-y-2">
                    {match.key_concerns.map((concern, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#F59E0B] text-xs mt-0.5">⚠</span>
                        <span className="text-xs text-[#6B7280] leading-relaxed">{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Inclusion Criteria */}
              {match.inclusion_matches.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[rgba(34,197,94,0.12)] text-[#22C55E] flex items-center justify-center text-[10px]">✓</span>
                    Inclusion Criteria ({match.inclusion_matches.length})
                  </h3>
                  <div className="bg-white rounded-xl overflow-hidden border border-[#E5E7EB] divide-y divide-[#F3F4F6]">
                    {match.inclusion_matches.map((criterion, i) => (
                      <CriterionRow key={i} criterion={criterion} />
                    ))}
                  </div>
                </div>
              )}

              {/* Exclusion Criteria */}
              {match.exclusion_matches.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[rgba(239,68,68,0.12)] text-[#EF4444] flex items-center justify-center text-[10px]">✗</span>
                    Exclusion Criteria ({match.exclusion_matches.length})
                  </h3>
                  <div className="bg-white rounded-xl overflow-hidden border border-[#E5E7EB] divide-y divide-[#F3F4F6]">
                    {match.exclusion_matches.map((criterion, i) => (
                      <CriterionRow key={i} criterion={criterion} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* No analysis yet */
            <div className="px-5 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm text-[#6B7280] mb-2">No eligibility analysis yet</p>
              <p className="text-xs text-[#9CA3AF] max-w-xs mx-auto">
                Click "Analyze Eligibility" to have our AI evaluate this trial's criteria
                against your health profile.
              </p>
            </div>
          )}

          {/* Trial details section */}
          <div className="px-5 pb-5 space-y-4 border-t border-[#E5E7EB] pt-4">
            {/* Brief summary */}
            <div>
              <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                About This Trial
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">{trial.brief_summary}</p>
            </div>

            {/* Locations */}
            {trial.locations.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                  Locations ({trial.locations.length})
                </h3>
                <div className="space-y-1.5">
                  {trial.locations.slice(0, 5).map((loc, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#9CA3AF" strokeWidth="2" />
                        <circle cx="12" cy="10" r="3" stroke="#9CA3AF" strokeWidth="2" />
                      </svg>
                      <span className="text-xs text-[#6B7280]">
                        {loc.facility && `${loc.facility}, `}{loc.city}, {loc.state}
                      </span>
                    </div>
                  ))}
                  {trial.locations.length > 5 && (
                    <p className="text-xs text-[#9CA3AF]">+{trial.locations.length - 5} more locations</p>
                  )}
                </div>
              </div>
            )}

            {/* Age eligibility */}
            {(trial.min_age !== undefined || trial.max_age !== undefined) && (
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-0.5">Age Range</p>
                  <p className="text-xs text-[#111827]">
                    {trial.min_age ?? 0} – {trial.max_age ?? "N/A"} years
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-0.5">Healthy Volunteers</p>
                  <p className="text-xs" style={{ color: trial.accepts_healthy_volunteers ? "#22C55E" : "#EF4444" }}>
                    {trial.accepts_healthy_volunteers ? "Accepted" : "Not accepted"}
                  </p>
                </div>
              </div>
            )}

            {/* Contact */}
            {(trial.contact_email || trial.contact_phone) && (
              <div>
                <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                  Contact
                </h3>
                {trial.contact_email && (
                  <a
                    href={`mailto:${trial.contact_email}`}
                    className="text-xs text-[#0D9488] hover:text-[#0f766e] transition-colors block"
                  >
                    {trial.contact_email}
                  </a>
                )}
                {trial.contact_phone && (
                  <p className="text-xs text-[#6B7280] mt-0.5">{trial.contact_phone}</p>
                )}
              </div>
            )}

            {/* Registry link */}
            <a
              href={trial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-[#0D9488] hover:text-[#0f766e] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              View on ClinicalTrials.gov
            </a>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB]">
          <button
            onClick={() => onAnalyze(trial)}
            disabled={isAnalyzing}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: hasResult
                ? "rgba(13, 148, 136, 0.08)"
                : "rgba(13, 148, 136, 0.9)",
              color: hasResult ? "#0D9488" : "#fff",
              border: "1px solid rgba(13, 148, 136, 0.3)",
            }}
          >
            {isAnalyzing ? (
              <>
                <LoadingSpinner size="sm" color={hasResult ? "#0D9488" : "#fff"} />
                Analyzing with Claude AI...
              </>
            ) : hasResult ? (
              "Re-analyze Eligibility"
            ) : (
              "Analyze Eligibility with AI"
            )}
          </button>

          <p className="text-[10px] text-[#9CA3AF] text-center mt-2">
            Powered by Claude AI · Results are informational only
          </p>
        </div>
      </div>
    </>
  );
}
