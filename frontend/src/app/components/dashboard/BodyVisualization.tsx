import { Suspense, useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Html, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { BodySystem } from "../../../types/digitalTwin";

interface BodyVisualizationProps {
  bodySystems: BodySystem[];
  onSystemClick?: (system: BodySystem) => void;
}

const MODEL_SCALE = 65;

const SYSTEM_HOTSPOTS: Record<string, [number, number, number]> = {
  neurological:          [ 0.00,  0.72,  0.10],  // Head
  cardiovascular:        [ 0.07,  0.40,  0.13],  // Heart — upper chest
  respiratory:           [-0.16,  0.30,  0.12],  // Lungs — left chest
  immune:                [ 0.17,  0.52,  0.09],  // Lymph nodes / thymus — upper right
  hepatic:               [ 0.20,  0.12,  0.10],  // Liver — right upper abdomen
  gastrointestinal:      [-0.06, -0.02,  0.14],  // Stomach / intestines — center abdomen
  "endocrine/metabolic": [ 0.00,  0.62,  0.10],  // Thyroid — neck
  endocrine:             [ 0.00,  0.62,  0.10],
  metabolic:             [ 0.06,  0.05,  0.10],  // Pancreas — center
  renal:                 [ 0.20, -0.06, -0.08],  // Kidneys — back right lower torso
  hematologic:           [-0.20,  0.42,  0.08],  // Bone marrow / blood — left chest
  musculoskeletal:       [ 0.28, -0.38,  0.08],  // Thigh muscle — lower limb
  reproductive:          [ 0.00, -0.34,  0.10],  // Pelvis — lower center
  dermatological:        [-0.26,  0.18,  0.12],  // Skin surface — left arm/side
};

const STATUS_COLOR: Record<string, string> = {
  abnormal: "#F59E0B",
  critical:  "#EF4444",
  normal:    "#22C55E",
  unknown:   "#6B7280",
};

const STATUS_LABEL: Record<string, string> = {
  abnormal: "Abnormal",
  critical:  "Critical",
  normal:    "Normal",
  unknown:   "Unknown",
};

// Subtle scan line
function ScanLine() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() % 4) / 4;
    ref.current.position.y = -0.95 + t * 1.9;
    (ref.current.material as THREE.MeshBasicMaterial).opacity =
      0.08 + Math.sin(clock.getElapsedTime() * 6) * 0.03;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.55, 0.008]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.1} depthWrite={false} />
    </mesh>
  );
}

// Tight focused light — low intensity, very short range
function RegionLight({ position, color, intensity }: {
  position: [number, number, number];
  color: string;
  intensity: number;
}) {
  const ref = useRef<THREE.PointLight>(null);
  const t = useRef(Math.random() * Math.PI * 2);
  useFrame((_, dt) => {
    t.current += dt * 2;
    if (ref.current) {
      ref.current.intensity = intensity * (0.85 + 0.15 * Math.sin(t.current));
    }
  });
  return (
    <pointLight
      ref={ref}
      position={position}
      color={color}
      intensity={intensity}
      distance={0.18}
      decay={2}
    />
  );
}

// Hotspot marker — small dot + expanding ring + clickable label
function HotspotMarker({ position, color, system, selected, onSelect }: {
  position: [number, number, number];
  color: string;
  system: BodySystem;
  selected: boolean;
  onSelect: () => void;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * Math.PI * 2);
  const c = useMemo(() => new THREE.Color(color), [color]);

  useFrame((_, dt) => {
    t.current += dt * 1.8;
    if (coreRef.current) {
      const s = 1 + Math.sin(t.current) * 0.15;
      coreRef.current.scale.setScalar(s);
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.8 + Math.sin(t.current) * 0.6;
    }
    if (ringRef.current) {
      const p = (t.current % (Math.PI * 2)) / (Math.PI * 2);
      ringRef.current.scale.setScalar(1 + p * 2);
      (ringRef.current.material as THREE.MeshStandardMaterial).opacity = (1 - p) * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Expanding ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.014, 0.002, 8, 32]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={2}
          transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Core dot */}
      <mesh ref={coreRef} onClick={onSelect}>
        <sphereGeometry args={[0.009, 12, 12]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* HTML label */}
      <Html distanceFactor={3} style={{ pointerEvents: "none" }}>
        <div
          onClick={onSelect}
          style={{
            pointerEvents: "auto",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: selected ? `${color}22` : "rgba(10,14,26,0.82)",
            border: `1px solid ${color}${selected ? "99" : "44"}`,
            borderRadius: 6,
            padding: "3px 8px 3px 6px",
            fontSize: 9,
            color,
            whiteSpace: "nowrap",
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            backdropFilter: "blur(6px)",
            transition: "all 0.15s ease",
            boxShadow: selected ? `0 0 14px ${color}50` : `0 0 6px ${color}20`,
            marginLeft: 12,
          }}
        >
          <div style={{
            width: 5, height: 5, borderRadius: "50%",
            background: color,
            boxShadow: `0 0 4px ${color}`,
            flexShrink: 0,
          }} />
          {system.system.replace(/_/g, " ")}
          <span style={{ opacity: 0.6, fontSize: 8, marginLeft: 2 }}>›</span>
        </div>
      </Html>
    </group>
  );
}

function AnatomyModel({ bodySystems, selectedSystem, onSelect }: {
  bodySystems: BodySystem[];
  selectedSystem: string | null;
  onSelect: (sys: BodySystem | null) => void;
}) {
  const { scene } = useGLTF("/ecorche.glb");

  const flagged = useMemo(
    () => bodySystems.filter((s) => s.status !== "normal" && s.status !== "unknown"),
    [bodySystems]
  );

  // Preserve vertex colors (muscle texture) — just tune roughness/metalness
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial;
          mat.vertexColors = true;
          mat.roughness = 0.6;
          mat.metalness = 0.05;
          mat.needsUpdate = true;
        });
      }
    });
  }, [scene]);

  return (
    <group>
      <ScanLine />

      {/* Tight region lights */}
      {flagged.map((sys) => {
        const key = sys.system.toLowerCase();
        const pos = SYSTEM_HOTSPOTS[key];
        if (!pos) return null;
        return (
          <RegionLight
            key={`light-${sys.system}`}
            position={pos}
            color={STATUS_COLOR[sys.status] ?? "#F59E0B"}
            intensity={sys.status === "critical" ? 0.9 : 0.55}
          />
        );
      })}

      <Center>
        <primitive object={scene} scale={MODEL_SCALE} />
      </Center>

      {flagged.map((sys) => {
        const key = sys.system.toLowerCase();
        const pos = SYSTEM_HOTSPOTS[key];
        if (!pos) return null;
        return (
          <HotspotMarker
            key={`marker-${sys.system}`}
            position={pos}
            color={STATUS_COLOR[sys.status] ?? "#F59E0B"}
            system={sys}
            selected={selectedSystem === sys.system}
            onSelect={() => onSelect(selectedSystem === sys.system ? null : sys)}
          />
        );
      })}
    </group>
  );
}

// Detail panel shown when a system is selected
function SystemDetailPanel({ system, onClose }: { system: BodySystem; onClose: () => void }) {
  const color = STATUS_COLOR[system.status] ?? "#6B7280";
  return (
    <div
      className="absolute top-4 left-4 z-10 w-64 rounded-xl border backdrop-blur-md"
      style={{
        background: "rgba(10,14,26,0.92)",
        borderColor: `${color}40`,
        boxShadow: `0 0 24px ${color}20`,
      }}
    >
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: `${color}25` }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
          <span className="text-white text-xs font-bold uppercase tracking-wider">
            {system.system.replace(/_/g, " ")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
            {STATUS_LABEL[system.status]}
          </span>
          <button onClick={onClose} className="text-[#4B5563] hover:text-white transition-colors text-sm leading-none">×</button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {system.findings.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">Findings</p>
            <ul className="space-y-1">
              {system.findings.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#D1D5DB]">
                  <span style={{ color, marginTop: 2, flexShrink: 0 }}>›</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {system.relevant_labs.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">Relevant Labs</p>
            <div className="flex flex-wrap gap-1">
              {system.relevant_labs.map((lab) => (
                <span key={lab} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                  {lab}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "radial-gradient(ellipse at 50% 30%, #0d1f3c 0%, #060d1a 60%, #000508 100%)" }}>
      <div className="w-10 h-10 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-[#9CA3AF] text-xs">Loading anatomy model...</p>
    </div>
  );
}

export function BodyVisualization({ bodySystems, onSystemClick }: BodyVisualizationProps) {
  const [selectedSystem, setSelectedSystem] = useState<BodySystem | null>(null);

  const affectedSystems = bodySystems.filter(
    (s) => s.status !== "normal" && s.status !== "unknown"
  );
  const hasCritical = affectedSystems.some((s) => s.status === "critical");

  const handleSelect = (sys: BodySystem | null) => {
    setSelectedSystem(sys);
    if (sys) onSystemClick?.(sys);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{
      background: "radial-gradient(ellipse at 50% 30%, #0d1f3c 0%, #060d1a 60%, #000508 100%)",
      border: "1px solid #0d2040",
    }}>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">3D Anatomy</h3>
        <div className="flex items-center gap-3">
          {affectedSystems.length > 0 && (
            <span className={`text-[10px] font-semibold ${hasCritical ? "text-[#EF4444]" : "text-[#F59E0B]"}`}>
              {affectedSystems.length} system{affectedSystems.length > 1 ? "s" : ""} flagged
            </span>
          )}
          <span className="text-[9px] text-[#4B5563]">Drag · Scroll · Click marker for details</span>
        </div>
      </div>

      <div style={{ height: 520, position: "relative" }}>
        {selectedSystem && (
          <SystemDetailPanel
            system={selectedSystem}
            onClose={() => setSelectedSystem(null)}
          />
        )}

        <Suspense fallback={<Loader />}>
          <Canvas
            camera={{ position: [0, 0.3, 2.2], fov: 50, near: 0.01, far: 100 }}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
            style={{ background: "transparent" }}
          >
            <Stars radius={4} depth={3} count={800} factor={0.8} saturation={0.3} fade speed={0.4} />
            <ambientLight intensity={0.65} />
            <directionalLight position={[2, 4, 3]} intensity={1.5} />
            <directionalLight position={[-2, 1, -2]} intensity={0.35} color="#7eb8d4" />

            <AnatomyModel
              bodySystems={bodySystems}
              selectedSystem={selectedSystem?.system ?? null}
              onSelect={handleSelect}
            />

            <OrbitControls
              enablePan enableZoom enableRotate
              minDistance={0.6} maxDistance={5}
              target={[0, 0.2, 0]}
              dampingFactor={0.08} enableDamping
            />

            <EffectComposer>
              <Bloom
                intensity={0.6}
                luminanceThreshold={0.5}
                luminanceSmoothing={0.9}
                radius={0.5}
              />
            </EffectComposer>
          </Canvas>
        </Suspense>
      </div>

      {bodySystems.length > 0 && (
        <div className="px-4 pb-4 pt-3 border-t border-[#1E293B]">
          <div className="flex flex-wrap gap-1.5">
            {bodySystems.slice(0, 8).map((sys) => {
              const color = STATUS_COLOR[sys.status] ?? "#6B7280";
              const isFlagged = sys.status !== "normal" && sys.status !== "unknown";
              const isSelected = selectedSystem?.system === sys.system;
              return (
                <button
                  key={sys.system}
                  onClick={() => handleSelect(isSelected ? null : sys)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all hover:scale-105"
                  style={{
                    background: isSelected ? `${color}25` : `${color}10`,
                    borderColor: isSelected ? `${color}80` : `${color}35`,
                    color,
                    boxShadow: isFlagged ? `0 0 8px ${color}30` : "none",
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: color, boxShadow: isFlagged ? `0 0 4px ${color}` : "none" }} />
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
