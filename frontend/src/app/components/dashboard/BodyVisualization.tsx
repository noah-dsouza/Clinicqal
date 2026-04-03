import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { BodySystem } from "../../../types/digitalTwin";

interface BodyVisualizationProps {
  bodySystems: BodySystem[];
  onSystemClick?: (system: BodySystem) => void;
}

// Hotspot positions in world space after model is scaled by MODEL_SCALE and centered
// Model is ~0.027 units tall, scaled to ~1.75 units tall
const MODEL_SCALE = 65;
const SYSTEM_HOTSPOTS: Record<string, [number, number, number]> = {
  cardiovascular:    [ 0.08,  0.38,  0.06],
  respiratory:       [-0.10,  0.28,  0.06],
  metabolic:         [ 0.10,  0.05,  0.06],
  neurological:      [ 0.00,  0.78,  0.00],
  musculoskeletal:   [ 0.22, -0.10,  0.00],
  renal:             [ 0.10, -0.02, -0.04],
  gastrointestinal:  [-0.06,  0.02,  0.06],
  endocrine:         [ 0.00,  0.22,  0.06],
  immune:            [ 0.06,  0.32,  0.03],
  hepatic:           [ 0.14,  0.12,  0.06],
  reproductive:      [ 0.00, -0.26,  0.05],
  dermatological:    [-0.18,  0.10,  0.10],
};

const STATUS_COLOR: Record<string, string> = {
  abnormal: "#F59E0B",
  critical: "#EF4444",
  normal: "#22C55E",
  unknown: "#6B7280",
};

function PulsingHotspot({
  position,
  color,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    t.current += delta * 2;
    if (meshRef.current) {
      const s = 1 + Math.sin(t.current) * 0.25;
      meshRef.current.scale.setScalar(s);
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.5 + Math.sin(t.current) * 0.8;
    }
    if (ringRef.current) {
      const rs = 1 + ((t.current % (Math.PI * 2)) / (Math.PI * 2)) * 1.5;
      ringRef.current.scale.setScalar(rs);
      (ringRef.current.material as THREE.MeshStandardMaterial).opacity =
        1 - (t.current % (Math.PI * 2)) / (Math.PI * 2);
    }
  });

  const c = new THREE.Color(color);

  return (
    <group position={position} onClick={onClick}>
      {/* Pulsing ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.018, 0.003, 8, 24]} />
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={2}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function AnatomyModel({
  bodySystems,
  onSystemClick,
}: {
  bodySystems: BodySystem[];
  onSystemClick?: (s: BodySystem) => void;
}) {
  const { scene } = useGLTF("/ecorche.glb");
  const modelRef = useRef<THREE.Group>(null);

  // Apply consistent material — slightly warm ecorché look
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => applyMat(m));
        } else {
          applyMat(mesh.material);
        }
      }
    });
  }, [scene]);

  function applyMat(mat: THREE.Material) {
    const m = mat as THREE.MeshStandardMaterial;
    if (!m.isMeshStandardMaterial) return;
    m.color.set("#c98b72");
    m.roughness = 0.6;
    m.metalness = 0.05;
    m.emissive.set("#000000");
  }

  // Non-normal / non-unknown systems that have hotspot positions
  const flagged = bodySystems.filter(
    (s) => s.status !== "normal" && s.status !== "unknown"
  );

  return (
    <group ref={modelRef}>
      <Center>
        <primitive object={scene} scale={MODEL_SCALE} />
      </Center>

      {/* Glow hotspots for affected systems */}
      {flagged.map((sys) => {
        const pos = SYSTEM_HOTSPOTS[sys.system.toLowerCase()];
        if (!pos) return null;
        const color = STATUS_COLOR[sys.status] ?? "#F59E0B";
        return (
          <group key={sys.system}>
            <PulsingHotspot
              position={pos}
              color={color}
              onClick={() => { onSystemClick?.(sys); }}
            />
          </group>
        );
      })}
    </group>
  );
}

function Loader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e1a]">
      <div className="w-10 h-10 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-[#9CA3AF] text-xs">Loading anatomy model...</p>
    </div>
  );
}

export function BodyVisualization({ bodySystems, onSystemClick }: BodyVisualizationProps) {
  const affectedSystems = bodySystems.filter(
    (s) => s.status !== "normal" && s.status !== "unknown"
  );

  return (
    <div className="bg-[#0a0e1a] rounded-xl border border-[#1E293B] overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
          3D Anatomy
        </h3>
        <div className="flex items-center gap-2">
          {affectedSystems.length > 0 && (
            <span className="text-[10px] text-[#F59E0B] font-medium">
              {affectedSystems.length} system{affectedSystems.length > 1 ? "s" : ""} flagged
            </span>
          )}
          <span className="text-[9px] text-[#4B5563]">Drag to rotate · Scroll to zoom</span>
        </div>
      </div>

      <div style={{ height: 480, position: "relative" }}>
        <Suspense fallback={<Loader />}>
          <Canvas
            camera={{ position: [0, 0.3, 2.2], fov: 50, near: 0.01, far: 100 }}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
            style={{ background: "#0a0e1a" }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[2, 3, 2]} intensity={1.5} />
            <directionalLight position={[-2, 1, -1]} intensity={0.5} color="#6BAED6" />
            <pointLight position={[0, 2, 1]} intensity={0.8} color="#ffffff" />

            <AnatomyModel bodySystems={bodySystems} onSystemClick={onSystemClick} />

            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              minDistance={0.5}
              maxDistance={6}
              target={[0, 0.2, 0]}
              dampingFactor={0.08}
              enableDamping
            />

            <EffectComposer>
              <Bloom
                intensity={affectedSystems.length > 0 ? 1.6 : 0.4}
                luminanceThreshold={0.3}
                luminanceSmoothing={0.9}
                radius={0.7}
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
              return (
                <button
                  key={sys.system}
                  onClick={() => onSystemClick?.(sys)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-all hover:scale-105"
                  style={{
                    background: `${color}18`,
                    borderColor: `${color}40`,
                    color,
                    boxShadow: sys.status !== "normal" && sys.status !== "unknown"
                      ? `0 0 8px ${color}50`
                      : "none",
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: color,
                      boxShadow: `0 0 4px ${color}`,
                    }}
                  />
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
