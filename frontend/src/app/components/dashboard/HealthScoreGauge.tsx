import { getHealthScoreColor } from "../../../lib/utils";

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
  showSubScores = false,
  cardiovascular,
  metabolic,
  functional,
}: HealthScoreGaugeProps) {
  const color = getHealthScoreColor(score);
  const qualLabel = getScoreLabel(score);

  // Semicircle arc: 180° from left (-180°) to right (0°)
  // We'll draw it as a 240° arc centered at top (like a speedometer)
  const cx = size / 2;
  const cy = size / 2 + 10; // slightly lower center so arc has room at top
  const r = (size - 32) / 2;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Arc: 210° to 330° going clockwise (220° sweep, bottom-centered opening)
  const startDeg = 210;
  const sweepDeg = 240; // total arc

  function arcCoords(deg: number) {
    const rad = toRad(deg);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPathD(fraction: number) {
    const sweep = sweepDeg * fraction;
    const { x: x1, y: y1 } = arcCoords(startDeg);
    const { x: x2, y: y2 } = arcCoords(startDeg + sweep);
    const large = sweep > 180 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  const trackD = arcPathD(1);
  const scoreD = arcPathD(Math.max(0.01, score / 100));

  // Endpoint dot position
  const dotDeg = startDeg + sweepDeg * (score / 100);
  const { x: dotX, y: dotY } = arcCoords(dotDeg);

  // Zone arc paths (background track colored by score range)
  function zonePathD(fromFrac: number, toFrac: number) {
    const s = startDeg + sweepDeg * fromFrac;
    const e = startDeg + sweepDeg * toFrac;
    const sweep = sweepDeg * (toFrac - fromFrac);
    const { x: x1, y: y1 } = arcCoords(s);
    const { x: x2, y: y2 } = arcCoords(e);
    const large = sweep > 180 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative" style={{ width: size, height: size - 10 }}>
        <svg width={size} height={size - 10} viewBox={`0 0 ${size} ${size}`} overflow="visible">
          {/* Colored zone track: red → amber → green */}
          <path d={zonePathD(0, 0.4)} fill="none" stroke="#EF4444" strokeWidth={10} strokeLinecap="butt" opacity={0.22} />
          <path d={zonePathD(0.4, 0.7)} fill="none" stroke="#F59E0B" strokeWidth={10} strokeLinecap="butt" opacity={0.22} />
          <path d={zonePathD(0.7, 1)} fill="none" stroke="#22C55E" strokeWidth={10} strokeLinecap="round" opacity={0.22} />
          {/* Score arc */}
          <path
            d={scoreD} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
          {/* Endpoint dot */}
          <circle cx={dotX} cy={dotY} r={5} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        </svg>

        {/* Center text — absolutely positioned, not inside SVG to avoid scaling issues */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingBottom: 16 }}
        >
          <span className="text-3xl font-bold leading-none" style={{ color }}>{score}</span>
          <span className="text-xs font-medium mt-1" style={{ color: `${color}bb` }}>{qualLabel}</span>
        </div>
      </div>

      {/* Sub-scores as horizontal bars */}
      {showSubScores && (
        <div className="w-full space-y-2 mt-2 px-1">
          {cardiovascular !== undefined && (
            <SubBar label="Cardiovascular" value={cardiovascular} color="#F87171" />
          )}
          {metabolic !== undefined && (
            <SubBar label="Metabolic" value={metabolic} color="#FBBF24" />
          )}
          {functional !== undefined && (
            <SubBar label="Functional" value={functional} color="#34D399" />
          )}
        </div>
      )}
    </div>
  );
}

function SubBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[#94A3B8]">{label}</span>
        <span className="text-[10px] font-semibold" style={{ color }}>{Math.round(value)}</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, value)}%`, background: color, boxShadow: `0 0 6px ${color}50` }}
        />
      </div>
    </div>
  );
}
