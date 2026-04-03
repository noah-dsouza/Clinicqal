import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDigitalTwin } from "../../../context/DigitalTwinContext";
import { openBotpressChat } from "../../../lib/botpress";
import { formatPatientSummary } from "../../../lib/patientSummary";

const SUGGESTIONS = [
  "Explain my health score",
  "Which trials look promising?",
  "How can I improve my labs?",
  "Which specialist should I see?",
];

export function AIChatButton() {
  const { twin } = useDigitalTwin();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const summarySignature = useMemo(() => (twin ? formatPatientSummary(twin) : null), [twin]);
  const [lastContextSignature, setLastContextSignature] = useState<string | null>(null);

  const launchChat = (question?: string) => {
    const needsContext = summarySignature !== lastContextSignature;
    openBotpressChat({ twin: twin ?? undefined, question, forceContext: needsContext });
    if (summarySignature) setLastContextSignature(summarySignature);
    setShowSuggestions(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl border shadow-xl p-3 w-56"
            style={{ background: "#0F172A", borderColor: "rgba(20,184,166,0.25)" }}
          >
            <p className="text-[11px] text-[#94A3B8] mb-2">Quick questions</p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => launchChat(suggestion)}
                  className="w-full text-left text-[11px] px-3 py-2 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#E2E8F0", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => launchChat()}
        onMouseEnter={() => setShowSuggestions(true)}
        onMouseLeave={() => setShowSuggestions(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="rounded-full flex items-center gap-2 px-4 py-3 shadow-2xl"
        style={{ background: "linear-gradient(135deg, #14B8A6, #2563EB)", color: "#fff" }}
      >
        <span className="text-sm font-semibold">Ask ClinIQ AI</span>
      </motion.button>
    </div>
  );
}
