"use client";

import { getHealthScoreColor } from "@/lib/utils";

interface HealthScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
  showSubScores?: boolean;
  cardiovascular?: number;
  metabolic?: number;
  functional?: number;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 35) return "Poor";
  return "Critical";
}

export function HealthScoreGauge({
  score,
  size = 180,
  label,
  showSubScores = false,
  cardiovascular,
  metabolic,
  functional,
}: HealthScoreGaugeProps) {
  const radius = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const startAngle = 150;
  const totalDegrees = 240;
  const arcFraction = score / 100;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  function arcPath(fraction: number, r: number, stroke: number) {
    const startRad = toRad(startAngle);
    const endRad = toRad(startAngle + totalDegrees * fraction);
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = totalDegrees * fraction > 180 ? 1 : 0;
    return { d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`, strokeWidth: stroke };
  }

  const bgArc = arcPath(1, radius, 12);
  const scoreArc = arcPath(arcFraction, radius, 12);
  const color = getHealthScoreColor(score);
  const qualLabel = getScoreLabel(score);

  const innerR1 = radius - 18;
  const innerR2 = radius - 32;
  const innerR3 = radius - 46;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path d={bgArc.d} fill="none" stroke="hsl(var(--border))" strokeWidth={bgArc.strokeWidth} strokeLinecap="round" />
        <path
          d={scoreArc.d}
          fill="none"
          stroke={color}
          strokeWidth={scoreArc.strokeWidth}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: "stroke-dasharray 0.8s ease" }}
        />

        {showSubScores && cardiovascular !== undefined && (
          <>
            <path d={arcPath(1, innerR1, 6).d} fill="none" stroke="hsl(var(--border))" strokeWidth={6} strokeLinecap="round" />
            <path d={arcPath(cardiovascular / 100, innerR1, 6).d} fill="none" stroke="#EF4444" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
          </>
        )}
        {showSubScores && metabolic !== undefined && (
          <>
            <path d={arcPath(1, innerR2, 6).d} fill="none" stroke="hsl(var(--border))" strokeWidth={6} strokeLinecap="round" />
            <path d={arcPath(metabolic / 100, innerR2, 6).d} fill="none" stroke="#F59E0B" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
          </>
        )}
        {showSubScores && functional !== undefined && (
          <>
            <path d={arcPath(1, innerR3, 6).d} fill="none" stroke="hsl(var(--border))" strokeWidth={6} strokeLinecap="round" />
            <path d={arcPath(functional / 100, innerR3, 6).d} fill="none" stroke="#22C55E" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
          </>
        )}

        <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize={size * 0.22} fontWeight="bold" fontFamily="system-ui, sans-serif">
          {score}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={size * 0.085} fontFamily="system-ui, sans-serif">
          {qualLabel}
        </text>
        {label && (
          <text x={cx} y={cy + 30} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={size * 0.07} fontFamily="system-ui, sans-serif">
            {label}
          </text>
        )}
      </svg>

      {showSubScores && (
        <div className="flex gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span className="text-xs text-muted-foreground">CV</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span className="text-xs text-muted-foreground">Met</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span className="text-xs text-muted-foreground">Func</span>
          </div>
        </div>
      )}
    </div>
  );
}
