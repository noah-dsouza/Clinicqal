import { motion } from "framer-motion";
import { isLabAbnormal } from "../../../lib/utils";

interface BiomarkerCardProps {
  name: string;
  value: number;
  unit: string;
  referenceLow?: number;
  referenceHigh?: number;
  date?: string;
}

export function BiomarkerCard({ name, value, unit, referenceLow, referenceHigh, date }: BiomarkerCardProps) {
  const status = isLabAbnormal(value, referenceLow, referenceHigh);

  const colorMap = {
    normal: { text: "#34D399", bg: "rgba(52,211,153,0.07)", border: "rgba(52,211,153,0.18)", bar: "#34D399" },
    low:    { text: "#FBBF24", bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.18)",  bar: "#FBBF24" },
    high:   { text: "#F87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.18)", bar: "#F87171" },
  };
  const colors = colorMap[status];

  let barPct = 50;
  if (referenceLow !== undefined && referenceHigh !== undefined) {
    const range = referenceHigh - referenceLow;
    const expanded = range * 2;
    const min = referenceLow - range * 0.5;
    barPct = Math.max(2, Math.min(98, ((value - min) / expanded) * 100));
  }

  let refLowPct = 25;
  let refHighPct = 75;
  if (referenceLow !== undefined && referenceHigh !== undefined) {
    const range = referenceHigh - referenceLow;
    const expanded = range * 2;
    const min = referenceLow - range * 0.5;
    refLowPct = Math.max(2, Math.min(98, ((referenceLow - min) / expanded) * 100));
    refHighPct = Math.max(2, Math.min(98, ((referenceHigh - min) / expanded) * 100));
  }

  return (
    <motion.div
      className="rounded-xl p-3 border"
      style={{ background: colors.bg, borderColor: colors.border }}
      whileHover={{
        scale: 1.03,
        y: -2,
        borderColor: colors.text,
        boxShadow: `0 8px 24px ${colors.text}18`,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-medium text-[#94A3B8] truncate max-w-[110px]">{name}</p>
          {date && <p className="text-[10px] text-[#64748B] mt-0.5">{date}</p>}
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ color: colors.text, background: colors.bg }}>
          {status === "normal" ? "✓" : status === "low" ? "↓" : "↑"}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-2.5">
        <span className="text-base font-bold" style={{ color: colors.text }}>{value}</span>
        <span className="text-[10px] text-[#64748B]">{unit}</span>
      </div>

      {(referenceLow !== undefined || referenceHigh !== undefined) && (
        <div>
          <div className="h-1 rounded-full relative overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="absolute top-0 h-full rounded-full"
              style={{ left: `${refLowPct}%`, width: `${refHighPct - refLowPct}%`, background: "rgba(52,211,153,0.2)" }}
            />
            <div
              className="absolute top-0 h-full w-0.5 rounded-full"
              style={{ left: `${barPct}%`, background: colors.bar, boxShadow: `0 0 4px ${colors.bar}` }}
            />
          </div>
          {referenceLow !== undefined && referenceHigh !== undefined && (
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-[#64748B]">{referenceLow}</span>
              <span className="text-[9px] text-[#64748B]">{referenceHigh}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
