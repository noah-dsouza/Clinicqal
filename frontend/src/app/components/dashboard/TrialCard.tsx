import { useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { ClinicalTrial } from "../../../types/trial";
import { Badge } from "../shared/Badge";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { getRecommendationColor, getRecommendationLabel, formatPhase, truncate } from "../../../lib/utils";

// ── 3D Tilt wrapper ───────────────────────────────────────────────────────────

function TiltCard({ children, borderColor }: { children: React.ReactNode; borderColor: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const rawX = useSpring(0, { stiffness: 300, damping: 30 });
  const rawY = useSpring(0, { stiffness: 300, damping: 30 });
  const scale = useSpring(1, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(rawY, (v) => `${v}deg`);
  const rotateY = useTransform(rawX, (v) => `${v}deg`);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -18;
    rawX.set(x);
    rawY.set(y);
  };

  const handleMouseEnter = () => {
    setHovered(true);
    scale.set(1.025);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    rawX.set(0);
    rawY.set(0);
    scale.set(1);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d",
        transformPerspective: 800,
        borderRadius: 12,
        border: `1px solid ${hovered ? borderColor : "rgba(47,62,52,0.1)"}`,
        background: "#FFFFFF",
        boxShadow: hovered ? `0 20px 50px rgba(107,127,106,0.15), 0 0 20px rgba(107,127,106,0.08)` : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Gloss highlight */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${hovered ? "var(--mx,50%) var(--my,50%)" : "50% 0%"}, rgba(47,62,52,0.04) 0%, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, padding: 16 }}>{children}</div>
    </motion.div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 48 }: { score: number; color: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(47,62,52,0.1)" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeDashoffset={circumference * 0.25}
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

// ── Main card ─────────────────────────────────────────────────────────────────

interface TrialCardProps {
  trial: ClinicalTrial;
  isAnalyzing: boolean;
  onAnalyze: (trial: ClinicalTrial) => void;
  onViewDetails: (trial: ClinicalTrial) => void;
}

export function TrialCard({ trial, isAnalyzing, onAnalyze, onViewDetails }: TrialCardProps) {
  const matchResult = trial.match_result;
  const hasResult = !!matchResult;
  const recColor = hasResult ? getRecommendationColor(matchResult.recommendation) : "#8B7765";
  const recLabel = hasResult ? getRecommendationLabel(matchResult.recommendation) : null;
  const firstLocation = trial.locations[0];
  const locationCount = trial.locations.length;

  return (
    <TiltCard borderColor={hasResult ? `${recColor}50` : "rgba(47,62,52,0.25)"}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {hasResult ? (
          <ScoreRing score={matchResult.overall_score} color={recColor} />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: "rgba(47,62,52,0.12)" }}>
            <span className="text-xs text-[#B1A79F]">—</span>
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
          <h3 className="text-xs font-semibold text-[#2F3E34] leading-snug line-clamp-2">{trial.title}</h3>
        </div>
      </div>

      {/* Sponsor + NCT */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[#B1A79F] truncate max-w-[60%]">{trial.sponsor}</span>
        <a href={trial.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#6B7F6A] hover:text-[#2F3E34] transition-colors" onClick={(e) => e.stopPropagation()}>
          {trial.nct_id} ↗
        </a>
      </div>

      <p className="text-[10px] text-[#8B7765] mb-2.5 line-clamp-2 leading-relaxed">{truncate(trial.brief_summary, 130)}</p>

      {hasResult && matchResult.key_concerns.length > 0 && (
        <div className="mb-2.5 space-y-1">
          {matchResult.key_concerns.slice(0, 2).map((concern, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-[10px] mt-0.5" style={{ color: "#C1843A" }}>⚠</span>
              <span className="text-[10px] text-[#8B7765] leading-relaxed">{truncate(concern, 80)}</span>
            </div>
          ))}
        </div>
      )}

      {firstLocation && (
        <div className="flex items-center gap-1.5 mb-3">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#B1A79F" strokeWidth="2" />
            <circle cx="12" cy="10" r="3" stroke="#B1A79F" strokeWidth="2" />
          </svg>
          <span className="text-[10px] text-[#B1A79F]">{firstLocation.city}, {firstLocation.state}{locationCount > 1 && ` +${locationCount - 1} more`}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onAnalyze(trial)}
          disabled={isAnalyzing}
          className="flex-1 py-2 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          style={{ background: "rgba(47,62,52,0.08)", color: "#2F3E34", border: "1px solid rgba(47,62,52,0.15)" }}
        >
          {isAnalyzing ? <><LoadingSpinner size="sm" color="#2F3E34" />Analyzing...</> : hasResult ? "Re-analyze" : "Analyze Eligibility"}
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
    </TiltCard>
  );
}
