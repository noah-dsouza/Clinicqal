"use client";

import { BodySystem } from "@/lib/digital-twin/schema";

interface BodyVisualizationProps {
  bodySystems: BodySystem[];
  onSystemClick?: (system: BodySystem) => void;
}

export function BodyVisualization({ bodySystems, onSystemClick }: BodyVisualizationProps) {
  const affectedSystems = bodySystems
    .filter((s) => s.status !== "normal" && s.status !== "unknown")
    .map((s) => s.system);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">3D Anatomy</h3>
        {affectedSystems.length > 0 && (
          <span className="text-[10px] text-[#F59E0B] font-medium">
            {affectedSystems.length} system{affectedSystems.length > 1 ? "s" : ""} flagged
          </span>
        )}
      </div>

      <div style={{ height: 480, position: "relative" }}>
        <iframe
          title="Human Anatomy 3D Model"
          allowFullScreen
          allow="autoplay; fullscreen; xr-spatial-tracking"
          src="https://sketchfab.com/models/fd9d1ca29e0c4ba1b767b179e2f69c32/embed?autospin=0&autostart=1&ui_theme=dark&ui_infos=0&ui_watermark=0&ui_watermark_link=0"
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      </div>

      {bodySystems.length > 0 && (
        <div className="px-4 pb-4 pt-2 border-t border-border">
          <div className="flex flex-wrap gap-1.5">
            {bodySystems.slice(0, 6).map((sys) => {
              const colors: Record<string, string> = {
                normal: "#22C55E",
                abnormal: "#F59E0B",
                critical: "#EF4444",
                unknown: "#9CA3AF",
              };
              const color = colors[sys.status] ?? "#9CA3AF";
              return (
                <button
                  key={sys.system}
                  onClick={() => onSystemClick?.(sys)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors"
                  style={{ background: `${color}12`, borderColor: `${color}30`, color }}
                >
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  {sys.system.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
