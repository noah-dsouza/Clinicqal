import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDigitalTwin } from "../../../context/DigitalTwinContext";

interface Message {
  role: "user" | "ai";
  text: string;
  ts: number;
}

// ── Orb pulse ────────────────────────────────────────────────────────────────

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

// ── Typing dots ───────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-3 py-2 rounded-xl w-fit"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#64748B" }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AIChatButton() {
  const { twin } = useDigitalTwin();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const greet = twin
    ? `Hi! I can see your profile — ${twin.intake.diagnosis.primary_condition}, health score ${twin.health_score.overall}/100. What would you like to know?`
    : "Hi! Complete your health profile and I can help you navigate your results, trials, and care options.";

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: "ai", text: greet, ts: Date.now() }]);
    }
  }, [greet]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isTyping) return;

    const userMsg: Message = { role: "user", text: msg, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, twin }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        role: "ai",
        text: data.reply ?? "I couldn't generate a response right now.",
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Connection error — make sure the backend is running.", ts: Date.now() },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, twin, isTyping]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
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
              height: 460,
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
                <p className="text-[10px] text-[#64748B]">Powered by Claude · Health navigator</p>
              </div>
              <motion.button
                onClick={() => setOpen(false)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className="text-[#64748B] hover:text-[#94A3B8]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </motion.button>
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

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <TypingDots />
                </motion.div>
              )}

              {/* Quick starters */}
              {messages.length <= 1 && !isTyping && (
                <div className="flex flex-col gap-1.5 mt-2">
                  {STARTERS.map((s, i) => (
                    <motion.button
                      key={i}
                      onClick={() => send(s)}
                      whileHover={{ scale: 1.02, borderColor: "rgba(20,184,166,0.25)" }}
                      whileTap={{ scale: 0.97 }}
                      className="text-left px-3 py-2 rounded-xl text-[10px]"
                      style={{ background: "rgba(255,255,255,0.03)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {s}
                    </motion.button>
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
                  disabled={isTyping}
                  placeholder="Ask about your health..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl px-3 py-2 text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", maxHeight: 80 }}
                />
                <motion.button
                  onClick={() => send()}
                  disabled={isTyping || !input.trim()}
                  whileHover={!isTyping ? { scale: 1.1, boxShadow: "0 0 12px rgba(20,184,166,0.35)" } : {}}
                  whileTap={!isTyping ? { scale: 0.9 } : {}}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40"
                  style={{ background: "rgba(20,184,166,0.2)", border: "1px solid rgba(20,184,166,0.3)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>
              </div>
              <p className="text-[9px] text-[#475569] mt-1.5 text-center">Enter to send · Informational only</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger */}
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
          background: open ? "rgba(15,23,42,0.9)" : "linear-gradient(135deg, #0D9488, #22C55E)",
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
