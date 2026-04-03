import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDigitalTwin } from "../../../context/DigitalTwinContext";

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "ai";
  text: string;
  ts: number;
}

// ── Mock AI responder (replace with real API when key is ready) ──────────────

function getResponse(q: string, ctx: string): string {
  const lower = q.toLowerCase();
  if (lower.includes("trial") || lower.includes("clinical")) {
    return "Based on your health profile, you may qualify for several clinical trials. Head to the **Find Support** tab to see your matched trials with eligibility scores. I can explain any specific trial in detail.";
  }
  if (lower.includes("diet") || lower.includes("food") || lower.includes("eat")) {
    return "Nutrition plays a critical role in your health management. Based on your profile, I'd suggest focusing on anti-inflammatory foods, limiting processed sugars, and staying hydrated. A registered dietitian match is available in your **Care Team** tab.";
  }
  if (lower.includes("med") || lower.includes("medication") || lower.includes("drug")) {
    return "Your current medications are tracked in your health profile. For questions about interactions or adjustments, please consult your prescribing physician. Your Care Team matches include specialists who can review your medication regimen.";
  }
  if (lower.includes("score") || lower.includes("health")) {
    return `Your overall health score reflects key indicators from your vitals, labs, and lifestyle data. The sub-scores (cardiovascular, metabolic, functional) help identify which areas need the most attention. ${ctx.includes("Diagnosis:") ? "Your current diagnosis is factored into these scores." : ""}`;
  }
  if (lower.includes("doctor") || lower.includes("specialist") || lower.includes("provider")) {
    return "Your **Find Support** tab shows Care Team matches based on your health profile — including primary care, specialists, and allied health professionals relevant to your condition. Each match includes contact details and telehealth availability.";
  }
  return `I'm here to help you navigate your health data and care options. ${ctx ? "I can see your health profile and can answer questions about your scores, matched trials, care team options, or next steps." : "Complete your health profile first so I can give you personalized guidance."}`;
}

// ── Orb pulse animation ──────────────────────────────────────────────────────

function OrbPulse({ active }: { active: boolean }) {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <div className="w-3 h-3 rounded-full" style={{ background: "linear-gradient(135deg, #14B8A6, #60A5FA)" }} />
      {active && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: "rgba(20,184,166,0.4)" }}
        />
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function AIChatButton() {
  const { twin } = useDigitalTwin();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ctx = useMemo(() => {
    if (!twin) return "";
    return `Diagnosis: ${twin.intake.diagnosis.primary_condition}, Score: ${twin.health_score.overall}/100, ECOG: ${twin.ecog_estimate}`;
  }, [twin]);

  const greet = useMemo(() => {
    if (!twin) return "Hi! Complete your health profile and I can help you navigate your results, trials, and care options.";
    return `Hi! I can see your profile — ${twin.intake.diagnosis.primary_condition}, health score ${twin.health_score.overall}/100. What would you like to know?`;
  }, [twin]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: "ai", text: greet, ts: Date.now() }]);
    }
  }, [greet]);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: "user", text, ts: Date.now() };
    const aiMsg: Message = { role: "ai", text: getResponse(text, ctx), ts: Date.now() + 1 };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  }, [input, ctx]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    if (e.key === "Escape") setOpen(false);
  };

  const STARTERS = [
    "What trials am I eligible for?",
    "Explain my health score",
    "What specialist should I see?",
    "How can I improve my health?",
  ];

  return (
    <div ref={wrapperRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: 340,
              height: 440,
              background: "#0F172A",
              border: "1px solid rgba(20,184,166,0.2)",
              boxShadow: "0 0 40px rgba(20,184,166,0.08), 0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(20,184,166,0.06)" }}>
              <OrbPulse active />
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#F1F5F9]">ClinIQ AI</p>
                <p className="text-[10px] text-[#64748B]">Health navigator</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#64748B] hover:text-[#94A3B8] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed"
                    style={
                      m.role === "user"
                        ? { background: "rgba(20,184,166,0.15)", color: "#CBD5E1", border: "1px solid rgba(20,184,166,0.2)", borderBottomRightRadius: 4 }
                        : { background: "rgba(255,255,255,0.04)", color: "#CBD5E1", border: "1px solid rgba(255,255,255,0.07)", borderBottomLeftRadius: 4 }
                    }
                  >
                    {m.text.split("**").map((part, j) =>
                      j % 2 === 1 ? <strong key={j} style={{ color: "#F1F5F9" }}>{part}</strong> : part
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Quick starters */}
              {messages.length <= 1 && (
                <div className="flex flex-col gap-1.5 mt-2">
                  {STARTERS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(s); setTimeout(send, 10); }}
                      className="text-left px-3 py-2 rounded-xl text-[10px] transition-colors"
                      style={{ background: "rgba(255,255,255,0.03)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about your health..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl px-3 py-2 text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", maxHeight: 80 }}
                />
                <button
                  onClick={send}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: "rgba(20,184,166,0.2)", border: "1px solid rgba(20,184,166,0.3)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <p className="text-[9px] text-[#475569] mt-1.5 text-center">Enter to send · Informational only</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button — morphs open/closed */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ width: open ? 44 : "auto" }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="flex items-center gap-2.5 rounded-full overflow-hidden shadow-xl"
        style={{
          height: 44,
          padding: open ? "0 10px" : "0 16px",
          background: open
            ? "rgba(15,23,42,0.9)"
            : "linear-gradient(135deg, #0D9488, #22C55E)",
          border: open ? "1px solid rgba(20,184,166,0.3)" : "none",
          boxShadow: open ? "0 0 20px rgba(20,184,166,0.15)" : "0 0 24px rgba(20,184,166,0.35)",
        }}
      >
        <OrbPulse active={!open} />
        <AnimatePresence>
          {!open && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-xs font-semibold text-white whitespace-nowrap overflow-hidden"
            >
              Ask AI
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
