import { motion, AnimatePresence } from "framer-motion";
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
  const icon = { met: "✓", likely_met: "~", unmet: "✗", likely_unmet: "!", unknown: "?" }[criterion.status] ?? "?";
  return (
    <motion.div
      className="flex items-start gap-3 py-3 border-b border-[rgba(47,62,52,0.06)] last:border-0"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold"
        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#5C524A] leading-snug mb-1">{criterion.criterion_text}</p>
        <p className="text-[10px] text-[#B1A79F] leading-relaxed">{criterion.reasoning}</p>
      </div>
    </motion.div>
  );
}

function ScoreArc({ score, color }: { score: number; color: string }) {
  const size = 80;
  const radius = 32;
  const circumference = Math.PI * radius;
  const stroke = (score / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size / 2 + 8 }}>
      <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
        <path d={`M 8 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2}`} fill="none" stroke="rgba(47,62,52,0.1)" strokeWidth={8} strokeLinecap="round" />
        <path d={`M 8 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${stroke} ${circumference}`} />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 text-center" style={{ bottom: -2 }}>
        <span className="text-lg font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-[#B1A79F]">/100</span>
      </div>
    </div>
  );
}

export function EligibilityDrawer({ trial, isOpen, onClose, onAnalyze, isAnalyzing }: EligibilityDrawerProps) {
  const match = trial?.match_result;
  const hasResult = !!match;
  const recColor = hasResult ? getRecommendationColor(match!.recommendation) : "#8B7765";

  return (
    <AnimatePresence>
      {isOpen && trial && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-lg z-50 flex flex-col overflow-hidden"
            style={{ background: "#FFFFFF", borderLeft: "1px solid rgba(47,62,52,0.1)", boxShadow: "-20px 0 60px rgba(47,62,52,0.08)" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 38 }}
          >
            {/* Header */}
            <div className="shrink-0 px-5 pt-5 pb-4 border-b" style={{ borderColor: "rgba(47,62,52,0.08)" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="violet" size="sm">{formatPhase(trial.phase)}</Badge>
                  <span className="text-[10px] text-[#B1A79F]">{trial.nct_id}</span>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.12, color: "#2F3E34" }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="p-1.5 rounded-lg shrink-0"
                  style={{ color: "#8B7765" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </motion.button>
              </div>
              <h2 className="text-sm font-semibold text-[#2F3E34] leading-snug mb-1">{trial.title}</h2>
              <p className="text-[10px] text-[#B1A79F]">{trial.sponsor}</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {hasResult ? (
                <div className="px-5 py-5 space-y-4">
                  <motion.div
                    className="rounded-xl p-4 border flex items-center gap-4"
                    style={{ background: `${recColor}08`, borderColor: `${recColor}20` }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <ScoreArc score={match!.overall_score} color={recColor} />
                    <div>
                      <p className="text-[10px] text-[#B1A79F] mb-1 uppercase tracking-wider">Overall Match</p>
                      <p className="text-base font-bold" style={{ color: recColor }}>{getRecommendationLabel(match!.recommendation)}</p>
                      {match!.key_concerns.length > 0 && (
                        <p className="text-[10px] text-[#8B7765] mt-1">{match!.key_concerns.length} concern{match!.key_concerns.length > 1 ? "s" : ""} identified</p>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    className="rounded-xl p-4 border"
                    style={{ background: "rgba(47,62,52,0.05)", borderColor: "rgba(47,62,52,0.12)" }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <h3 className="text-[10px] font-semibold text-[#2F3E34] uppercase tracking-wider mb-2">Summary</h3>
                    <p className="text-xs text-[#5C524A] leading-relaxed">{match!.plain_english_summary}</p>
                  </motion.div>

                  {match!.key_concerns.length > 0 && (
                    <motion.div
                      className="rounded-xl p-4 border"
                      style={{ background: "rgba(193,132,58,0.05)", borderColor: "rgba(193,132,58,0.15)" }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3 className="text-[10px] font-semibold text-[#C1843A] uppercase tracking-wider mb-2">Key Concerns</h3>
                      <ul className="space-y-1.5">
                        {match!.key_concerns.map((concern, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[10px] mt-0.5" style={{ color: "#C1843A" }}>⚠</span>
                            <span className="text-xs text-[#8B7765] leading-relaxed">{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {match!.inclusion_matches.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-semibold text-[#B1A79F] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]" style={{ background: "rgba(107,127,106,0.12)", color: "#6B7F6A" }}>✓</span>
                        Inclusion Criteria ({match!.inclusion_matches.length})
                      </h3>
                      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(47,62,52,0.1)" }}>
                        {match!.inclusion_matches.map((c, i) => <CriterionRow key={i} criterion={c} />)}
                      </div>
                    </div>
                  )}

                  {match!.exclusion_matches.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-semibold text-[#B1A79F] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]" style={{ background: "rgba(169,90,63,0.12)", color: "#A95A3F" }}>✗</span>
                        Exclusion Criteria ({match!.exclusion_matches.length})
                      </h3>
                      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(47,62,52,0.1)" }}>
                        {match!.exclusion_matches.map((c, i) => <CriterionRow key={i} criterion={c} />)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(47,62,52,0.05)", border: "1px solid rgba(47,62,52,0.1)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#B1A79F" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="#B1A79F" strokeWidth="2" strokeLinecap="round" /></svg>
                  </div>
                  <p className="text-sm text-[#8B7765] mb-1">No eligibility analysis yet</p>
                  <p className="text-xs text-[#B1A79F] max-w-xs mx-auto">Click "Analyze Eligibility" to have AI evaluate this trial against your health profile.</p>
                </div>
              )}

              {/* Trial details */}
              <div className="px-5 pb-5 space-y-4 border-t pt-4" style={{ borderColor: "rgba(47,62,52,0.08)" }}>
                <div>
                  <h3 className="text-[10px] font-semibold text-[#B1A79F] uppercase tracking-wider mb-2">About This Trial</h3>
                  <p className="text-xs text-[#8B7765] leading-relaxed">{trial.brief_summary}</p>
                </div>

                {trial.locations.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-semibold text-[#B1A79F] uppercase tracking-wider mb-2">Locations ({trial.locations.length})</h3>
                    <div className="space-y-1.5">
                      {trial.locations.slice(0, 5).map((loc, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" className="shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#B1A79F" strokeWidth="2" /><circle cx="12" cy="10" r="3" stroke="#B1A79F" strokeWidth="2" /></svg>
                          <span className="text-xs text-[#8B7765]">{loc.facility && `${loc.facility}, `}{loc.city}, {loc.state}</span>
                        </div>
                      ))}
                      {trial.locations.length > 5 && <p className="text-[10px] text-[#B1A79F]">+{trial.locations.length - 5} more</p>}
                    </div>
                  </div>
                )}

                {(trial.min_age !== undefined || trial.max_age !== undefined) && (
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[9px] text-[#B1A79F] uppercase tracking-wider mb-0.5">Age Range</p>
                      <p className="text-xs text-[#5C524A]">{trial.min_age ?? 0}–{trial.max_age ?? "N/A"} yrs</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#B1A79F] uppercase tracking-wider mb-0.5">Healthy Volunteers</p>
                      <p className="text-xs" style={{ color: trial.accepts_healthy_volunteers ? "#6B7F6A" : "#A95A3F" }}>
                        {trial.accepts_healthy_volunteers ? "Accepted" : "Not accepted"}
                      </p>
                    </div>
                  </div>
                )}

                {(trial.contact_email || trial.contact_phone) && (
                  <div>
                    <h3 className="text-[10px] font-semibold text-[#B1A79F] uppercase tracking-wider mb-1.5">Contact</h3>
                    {trial.contact_email && <a href={`mailto:${trial.contact_email}`} className="text-xs text-[#6B7F6A] hover:text-[#2F3E34] transition-colors block">{trial.contact_email}</a>}
                    {trial.contact_phone && <p className="text-xs text-[#8B7765] mt-0.5">{trial.contact_phone}</p>}
                  </div>
                )}

                <motion.a
                  href={trial.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ x: 3, color: "#2F3E34" }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex items-center gap-2 text-xs text-[#6B7F6A]"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  View on ClinicalTrials.gov
                </motion.a>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-4 border-t" style={{ borderColor: "rgba(47,62,52,0.08)", background: "rgba(47,62,52,0.02)" }}>
              <motion.button
                onClick={() => onAnalyze(trial)}
                disabled={isAnalyzing}
                whileHover={!isAnalyzing ? { scale: 1.02, boxShadow: "0 0 20px rgba(47,62,52,0.15)" } : {}}
                whileTap={!isAnalyzing ? { scale: 0.97 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: hasResult ? "rgba(47,62,52,0.08)" : "#2F3E34",
                  color: hasResult ? "#2F3E34" : "#fff",
                  border: "1px solid rgba(47,62,52,0.2)",
                }}
              >
                {isAnalyzing ? <><LoadingSpinner size="sm" color={hasResult ? "#2F3E34" : "#fff"} />Analyzing with Claude AI...</> : hasResult ? "Re-analyze Eligibility" : "Analyze Eligibility with AI"}
              </motion.button>
              <p className="text-[9px] text-[#B1A79F] text-center mt-2">Powered by Claude AI · Informational only</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
