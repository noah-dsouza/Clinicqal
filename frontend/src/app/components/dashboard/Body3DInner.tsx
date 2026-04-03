import React, { useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import { BodySystem } from "../../../types/digitalTwin";

interface BodyVisualizationProps {
  bodySystems: BodySystem[];
  onSystemClick?: (system: BodySystem) => void;
}

// Map system names to body part groups
const SYSTEM_PARTS: Record<string, string[]> = {
  Neurological: ["head", "neck"],
  Cardiovascular: ["torso_upper"],
  Pulmonary: ["torso_mid"],
  Hepatic: ["torso_lower_right"],
  Renal: ["torso_lower_left"],
  "Endocrine/Metabolic": ["torso_lower"],
  Hematologic: ["torso_upper", "torso_mid", "torso_lower"],
  Oncologic: ["torso_upper", "torso_mid"],
};

function getStatusColor(status: BodySystem["status"]): { color: string; emissive: string; emissiveIntensity: number } {
  switch (status) {
    case "normal":
      return { color: "#e8f5f0", emissive: "#22C55E", emissiveIntensity: 0 };
    case "abnormal":
      return { color: "#fff8e7", emissive: "#F59E0B", emissiveIntensity: 0.4 };
    case "critical":
      return { color: "#fff0f0", emissive: "#EF4444", emissiveIntensity: 0.6 };
    default:
      return { color: "#f3f4f6", emissive: "#9CA3AF", emissiveIntensity: 0 };
  }
}

interface BodyPartProps {
  position: [number, number, number];
  geometry: "sphere" | "cylinder" | "box" | "capsule";
  args: number[];
  systemName?: string;
  partName: string;
  systemMap: Map<string, BodySystem>;
  onHover: (name: string | null, system: BodySystem | null) => void;
  onClick: (system: BodySystem) => void;
  mousePos: React.MutableRefObject<{ x: number; y: number }>;
}

function BodyPart({
  position,
  geometry,
  args,
  systemName,
  partName,
  systemMap,
  onHover,
  onClick,
  mousePos,
}: BodyPartProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Get the system this part belongs to
  const system = systemName ? systemMap.get(systemName) : null;
  const statusStyle = getStatusColor(system?.status ?? "unknown");

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;

    // Pulse animation for abnormal/critical
    if (system?.status === "abnormal" || system?.status === "critical") {
      const pulse = (Math.sin(state.clock.elapsedTime * 2.5) + 1) / 2; // 0..1
      mat.emissiveIntensity = 0.3 + pulse * 0.7;
    }

    // Hover scale
    const targetScale = hovered ? 1.08 : 1.0;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.12
    );
  });

  let geoNode: React.ReactNode;
  if (geometry === "sphere") {
    geoNode = <sphereGeometry args={[args[0], 32, 32]} />;
  } else if (geometry === "cylinder") {
    geoNode = <cylinderGeometry args={[args[0], args[1], args[2], 16]} />;
  } else if (geometry === "box") {
    geoNode = <boxGeometry args={[args[0], args[1], args[2]]} />;
  } else {
    // capsule fallback with cylinder
    geoNode = <cylinderGeometry args={[args[0], args[0], args[1], 16]} />;
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(systemName ?? partName, system ?? null);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover(null, null);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (system) onClick(system);
      }}
    >
      {geoNode}
      <meshStandardMaterial
        color={statusStyle.color}
        emissive={statusStyle.emissive}
        emissiveIntensity={statusStyle.emissiveIntensity}
        roughness={0.4}
        metalness={0.1}
      />
      {hovered && system && (
        <Html distanceFactor={6} style={{ pointerEvents: "none" }}>
          <div
            className="bg-white border border-[#E5E7EB] rounded-lg p-2 shadow-lg text-xs w-36"
            style={{ transform: "translate(8px, -50%)" }}
          >
            <div className="font-semibold text-[#111827] mb-0.5">{system.system}</div>
            <div
              className="text-xs capitalize font-medium"
              style={{
                color:
                  system.status === "normal"
                    ? "#22C55E"
                    : system.status === "critical"
                    ? "#EF4444"
                    : system.status === "abnormal"
                    ? "#F59E0B"
                    : "#9CA3AF",
              }}
            >
              {system.status}
            </div>
            {system.findings.slice(0, 1).map((f, i) => (
              <p key={i} className="text-[10px] text-[#6B7280] mt-1 leading-tight">{f}</p>
            ))}
          </div>
        </Html>
      )}
    </mesh>
  );
}

interface HeadGroupProps {
  systemMap: Map<string, BodySystem>;
  onHover: (name: string | null, system: BodySystem | null) => void;
  onClick: (system: BodySystem) => void;
  mousePos: React.MutableRefObject<{ x: number; y: number }>;
}

function HeadGroup({ systemMap, onHover, onClick, mousePos }: HeadGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    // Smoothly rotate head toward mouse
    const targetX = -mousePos.current.y * 0.3;
    const targetY = mousePos.current.x * 0.4;
    groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.05;
    groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.05;
  });

  return (
    <group ref={groupRef}>
      <BodyPart
        position={[0, 1.8, 0]}
        geometry="sphere"
        args={[0.4]}
        systemName="Neurological"
        partName="head"
        systemMap={systemMap}
        onHover={onHover}
        onClick={onClick}
        mousePos={mousePos}
      />
      {/* Neck */}
      <BodyPart
        position={[0, 1.45, 0]}
        geometry="cylinder"
        args={[0.15, 0.18, 0.2]}
        systemName="Neurological"
        partName="neck"
        systemMap={systemMap}
        onHover={onHover}
        onClick={onClick}
        mousePos={mousePos}
      />
    </group>
  );
}

function Body3DScene({
  bodySystems,
  onSystemClick,
  mousePos,
}: BodyVisualizationProps & { mousePos: React.MutableRefObject<{ x: number; y: number }> }) {
  const [tooltip, setTooltip] = useState<{ name: string; system: BodySystem | null } | null>(null);
  const systemMap = new Map((bodySystems ?? []).map((s) => [s.system, s]));

  const handleHover = useCallback((name: string | null, system: BodySystem | null) => {
    setTooltip(name ? { name, system } : null);
  }, []);

  const handleClick = useCallback(
    (system: BodySystem) => {
      onSystemClick?.(system);
    },
    [onSystemClick]
  );

  const partProps = { systemMap, onHover: handleHover, onClick: handleClick, mousePos };

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[0, 3, 3]} intensity={1.2} castShadow />
      <pointLight position={[-2, 2, 2]} color="#0D9488" intensity={0.8} />
      <pointLight position={[2, -1, 1]} color="#22C55E" intensity={0.4} />

      <Environment preset="city" />

      <HeadGroup {...partProps} />

      {/* Torso upper - Cardiovascular */}
      <BodyPart position={[0, 0.95, 0]} geometry="box" args={[0.9, 0.35, 0.4]} systemName="Cardiovascular" partName="torso_upper" {...partProps} />
      {/* Torso mid - Pulmonary */}
      <BodyPart position={[0, 0.62, 0]} geometry="box" args={[0.85, 0.32, 0.38]} systemName="Pulmonary" partName="torso_mid" {...partProps} />
      {/* Torso lower right - Hepatic */}
      <BodyPart position={[0.22, 0.32, 0]} geometry="box" args={[0.38, 0.28, 0.35]} systemName="Hepatic" partName="torso_lower_right" {...partProps} />
      {/* Torso lower left - Renal */}
      <BodyPart position={[-0.22, 0.32, 0]} geometry="box" args={[0.38, 0.28, 0.35]} systemName="Renal" partName="torso_lower_left" {...partProps} />
      {/* Torso lower - Endocrine */}
      <BodyPart position={[0, 0.1, 0]} geometry="box" args={[0.8, 0.22, 0.36]} systemName="Endocrine/Metabolic" partName="torso_lower" {...partProps} />

      {/* Pelvis */}
      <BodyPart position={[0, -0.1, 0]} geometry="cylinder" args={[0.4, 0.35, 0.25]} systemName="Endocrine/Metabolic" partName="pelvis" {...partProps} />

      {/* Shoulders */}
      <BodyPart position={[0.7, 1.2, 0]} geometry="sphere" args={[0.2]} partName="shoulder_l" {...partProps} />
      <BodyPart position={[-0.7, 1.2, 0]} geometry="sphere" args={[0.2]} partName="shoulder_r" {...partProps} />

      {/* Upper arms */}
      <BodyPart position={[0.82, 0.75, 0]} geometry="cylinder" args={[0.12, 0.1, 0.55]} partName="upper_arm_l" {...partProps} />
      <BodyPart position={[-0.82, 0.75, 0]} geometry="cylinder" args={[0.12, 0.1, 0.55]} partName="upper_arm_r" {...partProps} />

      {/* Lower arms */}
      <BodyPart position={[0.88, 0.28, 0]} geometry="cylinder" args={[0.1, 0.08, 0.5]} partName="lower_arm_l" {...partProps} />
      <BodyPart position={[-0.88, 0.28, 0]} geometry="cylinder" args={[0.1, 0.08, 0.5]} partName="lower_arm_r" {...partProps} />

      {/* Hands */}
      <BodyPart position={[0.9, -0.02, 0]} geometry="sphere" args={[0.1]} partName="hand_l" {...partProps} />
      <BodyPart position={[-0.9, -0.02, 0]} geometry="sphere" args={[0.1]} partName="hand_r" {...partProps} />

      {/* Upper legs */}
      <BodyPart position={[0.25, -0.52, 0]} geometry="cylinder" args={[0.18, 0.15, 0.7]} partName="upper_leg_l" {...partProps} />
      <BodyPart position={[-0.25, -0.52, 0]} geometry="cylinder" args={[0.18, 0.15, 0.7]} partName="upper_leg_r" {...partProps} />

      {/* Lower legs */}
      <BodyPart position={[0.25, -1.12, 0]} geometry="cylinder" args={[0.13, 0.1, 0.65]} partName="lower_leg_l" {...partProps} />
      <BodyPart position={[-0.25, -1.12, 0]} geometry="cylinder" args={[0.13, 0.1, 0.65]} partName="lower_leg_r" {...partProps} />

      {/* Feet */}
      <BodyPart position={[0.25, -1.48, 0.08]} geometry="box" args={[0.2, 0.08, 0.35]} partName="foot_l" {...partProps} />
      <BodyPart position={[-0.25, -1.48, 0.08]} geometry="box" args={[0.2, 0.08, 0.35]} partName="foot_r" {...partProps} />

      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={6}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.85}
        target={[0, 0.3, 0]}
      />
    </>
  );
}

export default function Body3DInner({ bodySystems, onSystemClick }: BodyVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePos.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ height: 380, background: "transparent" }}
        onMouseMove={handleMouseMove}
      >
        <Canvas
          camera={{ position: [0, 0.5, 4], fov: 45 }}
          style={{ background: "transparent" }}
          gl={{ alpha: true, antialias: true }}
        >
          <Body3DScene
            bodySystems={bodySystems}
            onSystemClick={onSystemClick}
            mousePos={mousePos}
          />
        </Canvas>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full max-w-[220px]">
        {[
          { status: "normal", label: "Normal", color: "#22C55E" },
          { status: "abnormal", label: "Abnormal", color: "#F59E0B" },
          { status: "critical", label: "Critical", color: "#EF4444" },
          { status: "unknown", label: "No Data", color: "#9CA3AF" },
        ].map((item) => (
          <div key={item.status} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-[#6B7280]">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[#9CA3AF] text-center">Drag to rotate · Scroll to zoom</p>
    </div>
  );
}
