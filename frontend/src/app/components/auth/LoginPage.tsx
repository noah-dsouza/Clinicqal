import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

// ── Animated Health Dot Map ──────────────────────────────────────────────────

function HealthDotMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: width, h: height });
      canvas.width = width;
      canvas.height = height;
    });
    obs.observe(canvas.parentElement as Element);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!dims.w || !dims.h) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // TS: assert non-null for closure use
    const c = ctx;

    // Generate grid dots
    const dots: { x: number; y: number; op: number }[] = [];
    const gap = 14;
    for (let x = 0; x < dims.w; x += gap) {
      for (let y = 0; y < dims.h; y += gap) {
        // Simulate world map silhouette
        const xr = x / dims.w;
        const yr = y / dims.h;
        const inMap =
          (xr < 0.24 && xr > 0.05 && yr < 0.45 && yr > 0.1) ||
          (xr < 0.25 && xr > 0.14 && yr < 0.82 && yr > 0.45) ||
          (xr < 0.46 && xr > 0.3 && yr < 0.38 && yr > 0.14) ||
          (xr < 0.51 && xr > 0.35 && yr < 0.68 && yr > 0.35) ||
          (xr < 0.72 && xr > 0.45 && yr < 0.52 && yr > 0.1) ||
          (xr < 0.82 && xr > 0.66 && yr < 0.82 && yr > 0.62);
        if (inMap && Math.random() > 0.3) {
          dots.push({ x, y, op: Math.random() * 0.4 + 0.1 });
        }
      }
    }

    // Pulse nodes (health data points)
    const nodes = [
      { x: dims.w * 0.18, y: dims.h * 0.28, color: "#14B8A6" },
      { x: dims.w * 0.42, y: dims.h * 0.22, color: "#60A5FA" },
      { x: dims.w * 0.62, y: dims.h * 0.32, color: "#A78BFA" },
      { x: dims.w * 0.2, y: dims.h * 0.6, color: "#34D399" },
      { x: dims.w * 0.72, y: dims.h * 0.7, color: "#14B8A6" },
    ];

    let startTime = Date.now();
    let raf: number;

    function draw() {
      c.clearRect(0, 0, dims.w, dims.h);

      // Dots
      dots.forEach((d) => {
        c.beginPath();
        c.arc(d.x, d.y, 1, 0, Math.PI * 2);
        c.fillStyle = `rgba(255,255,255,${d.op})`;
        c.fill();
      });

      const t = (Date.now() - startTime) / 1000;

      // Draw connection lines between nodes
      nodes.forEach((n1, i) => {
        nodes.forEach((n2, j) => {
          if (j <= i) return;
          const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y);
          if (dist > dims.w * 0.35) return;
          const alpha = Math.max(0, 0.12 - dist / (dims.w * 2.8));
          c.beginPath();
          c.moveTo(n1.x, n1.y);
          c.lineTo(n2.x, n2.y);
          c.strokeStyle = `rgba(20,184,166,${alpha})`;
          c.lineWidth = 0.6;
          c.stroke();
        });
      });

      // Pulsing nodes
      nodes.forEach((n, i) => {
        const pulse = Math.sin(t * 1.5 + i * 1.2) * 0.5 + 0.5;
        // Glow ring
        c.beginPath();
        c.arc(n.x, n.y, 4 + pulse * 6, 0, Math.PI * 2);
        c.fillStyle = n.color + "22";
        c.fill();
        // Inner dot
        c.beginPath();
        c.arc(n.x, n.y, 3, 0, Math.PI * 2);
        c.fillStyle = n.color;
        c.fill();
      });

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, [dims]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

// ── Login Page ───────────────────────────────────────────────────────────────

interface LoginPageProps {
  onLogin: () => void;
  onGuest: () => void;
}

export function LoginPage({ onLogin, onGuest }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth — replace with real auth later
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 900);
  };

  const inputCls =
    "w-full rounded-lg px-4 py-2.5 text-sm text-[#F1F5F9] placeholder-[#64748B] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] focus:outline-none focus:border-[rgba(20,184,166,0.45)] transition-colors";

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #060818 0%, #0d1023 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex shadow-2xl"
        style={{ background: "#090b13", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Left — animated health map */}
        <div className="hidden md:block w-1/2 relative overflow-hidden" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0f1120 0%, #151929 100%)" }}>
            <HealthDotMap />

            {/* Overlay content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 z-10">
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mb-5"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.2), rgba(96,165,250,0.15))", border: "1px solid rgba(20,184,166,0.3)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 7l9 5 9-5-9-5z" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 12l9 5 9-5" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 17l9 5 9-5" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.5 }}
                className="text-3xl font-bold mb-2 text-center"
                style={{ background: "linear-gradient(135deg, #14B8A6, #60A5FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                ClinIQ
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.5 }}
                className="text-sm text-center max-w-xs leading-relaxed"
                style={{ color: "#94A3B8" }}
              >
                Your AI-powered health digital twin — discover clinical trials and care matches tailored to you.
              </motion.p>

              {/* Feature bullets */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="mt-8 space-y-3"
              >
                {[
                  { icon: "🔬", text: "Clinical trial matching" },
                  { icon: "🩺", text: "Care team recommendations" },
                  { icon: "🧬", text: "AI-powered health analysis" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-6 md:hidden">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.25)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7l9 5 9-5-9-5z" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-bold text-[#F1F5F9]">ClinIQ</span>
            </div>

            <h1 className="text-2xl font-bold text-[#F1F5F9] mb-1">Welcome back</h1>
            <p className="text-sm mb-7" style={{ color: "#94A3B8" }}>Sign in to your health dashboard</p>

            {/* Google SSO */}
            <button
              className="w-full flex items-center justify-center gap-2.5 rounded-xl p-3 mb-5 text-sm font-medium transition-all"
              style={{ background: "#13151f", border: "1px solid rgba(255,255,255,0.1)", color: "#CBD5E1" }}
              onClick={onLogin}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-[#64748B]" style={{ background: "#090b13" }}>or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Email <span style={{ color: "#14B8A6" }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Password <span style={{ color: "#14B8A6" }}>*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className={inputCls + " pr-10"}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center transition-colors"
                    style={{ color: "#64748B" }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                disabled={loading}
                className="relative w-full py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all disabled:opacity-60 mt-2"
                style={{
                  background: "linear-gradient(135deg, #0D9488, #22C55E)",
                  boxShadow: isHovered ? "0 0 24px rgba(20,184,166,0.4)" : "0 0 14px rgba(20,184,166,0.2)",
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Sign in <ArrowRight size={15} /></>
                  )}
                </span>
                {isHovered && !loading && (
                  <motion.span
                    initial={{ left: "-100%" }}
                    animate={{ left: "110%" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute top-0 bottom-0 w-20 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", filter: "blur(8px)" }}
                  />
                )}
              </motion.button>
            </form>

            <div className="flex items-center justify-between mt-5">
              <button
                onClick={onGuest}
                className="text-xs transition-colors"
                style={{ color: "#64748B" }}
              >
                Continue as guest →
              </button>
              <a href="#" className="text-xs transition-colors" style={{ color: "#14B8A6" }}>
                Forgot password?
              </a>
            </div>

            <div className="mt-6 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-center text-xs" style={{ color: "#64748B" }}>
                Don't have an account?{" "}
                <button onClick={onGuest} className="font-medium" style={{ color: "#14B8A6" }}>
                  Start your health profile
                </button>
              </p>
              <p className="text-center text-[10px] mt-3" style={{ color: "#475569" }}>
                For research and informational use only · Not medical advice
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

import React from "react";
