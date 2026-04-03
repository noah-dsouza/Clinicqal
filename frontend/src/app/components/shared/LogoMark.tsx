interface LogoMarkProps {
  size?: number;
  showWordmark?: boolean;
  orientation?: "horizontal" | "stacked";
}

const circles = [
  { cx: 7, cy: 5, fill: "#6B7F6A" },
  { cx: 15, cy: 4, fill: "#2F3E34" },
  { cx: 18.5, cy: 11.5, fill: "#A3AE95" },
  { cx: 6, cy: 15, fill: "#C1843A" },
  { cx: 12.5, cy: 18, fill: "#A95A3F" },
];

export function LogoMark({ size = 32, showWordmark = false, orientation = "horizontal" }: LogoMarkProps) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: showWordmark ? 8 : 0 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 5c2 2 3.5 3.5 5.5 5.5c2 2 3.5 4 6.5 5.5" stroke="#6B7F6A" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M7 5c3 3 5 5 6 9" stroke="#C1843A" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M6 15c3 0 5.5-1 8.5-8" stroke="#2F3E34" strokeWidth="1.2" strokeLinecap="round" />
        {circles.map((c, idx) => (
          <circle key={idx} cx={c.cx} cy={c.cy} r={2.2} fill={c.fill} />
        ))}
      </svg>
      {showWordmark && (
        <div style={{ display: "flex", flexDirection: orientation === "horizontal" ? "row" : "column", lineHeight: 1 }}>
          <span style={{ fontWeight: 600, fontSize: size * 0.35, color: "#2F3E34" }}>Clin</span>
          <span style={{ fontWeight: 600, fontSize: size * 0.35, color: "#6B7F6A" }}>IQ</span>
        </div>
      )}
    </div>
  );
}
