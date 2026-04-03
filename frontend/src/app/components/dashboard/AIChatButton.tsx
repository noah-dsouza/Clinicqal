import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDigitalTwin } from "../../../context/DigitalTwinContext";
import { sendChatMessage } from "../../../lib/api";

const SUGGESTIONS = [
  "What's driving my health score?",
  "Show me matching trials",
  "How do these labs look?",
  "What should I focus on?",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

function MessageBubble({ role, text }: Message) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[80%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed"
        style={{
          background: isUser ? "linear-gradient(135deg, #14B8A6, #2563EB)" : "rgba(248,250,252,0.08)",
          color: "#E2E8F0",
          border: isUser ? "none" : "1px solid rgba(148,163,184,0.3)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function AIChatButton() {
  const { twin } = useDigitalTwin();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const newMessage: Message = { id: crypto.randomUUID(), role: "user", text };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsSending(true);
    try {
      const { reply } = await sendChatMessage(text, twin);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", text: reply }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Sorry, the chat service is unavailable right now. Please try again shortly.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    if (!isOpen) setIsOpen(true);
    setShowSuggestions(false);
    setInput(suggestion);
    sendMessage(suggestion);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {showSuggestions && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl border shadow-xl p-3 w-56"
            style={{ background: "#0F172A", borderColor: "rgba(20,184,166,0.25)" }}
          >
            <p className="text-[11px] text-[#94A3B8] mb-2">Ask ClinIQ AI (auto-loaded with your data)</p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
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

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-80 rounded-3xl border p-4 shadow-2xl flex flex-col gap-3"
          style={{ background: "#0F172A", borderColor: "rgba(148,163,184,0.25)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-[#38BDF8] tracking-[0.2em]">ClinIQ AI</p>
              <p className="text-sm text-[#E2E8F0]">Personal health copilots</p>
            </div>
            <button
              className="text-[#94A3B8] hover:text-white"
              onClick={() => {
                setIsOpen(false);
                setShowSuggestions(false);
              }}
            >
              ✕
            </button>
          </div>

          <div
            ref={containerRef}
            className="flex flex-col gap-2 overflow-y-auto"
            style={{ maxHeight: "300px" }}
          >
            {messages.length === 0 ? (
              <div className="text-[11px] text-[#94A3B8] bg-[#0B1220] border border-[#1E293B] rounded-2xl p-3">
                Ask ClinIQ anything about your health score, labs, meds, or trial eligibility. Responses are powered by Groq and your latest digital twin.
              </div>
            ) : (
              messages.map((message) => <MessageBubble key={message.id} {...message} />)
            )}
            {isSending && (
              <div className="text-[11px] text-[#94A3B8] italic">Thinking…</div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={twin ? "Ask something specific…" : "AI will work better after creating a twin"}
              className="flex-1 rounded-2xl px-3 py-2 text-[12px] text-white"
              style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(148,163,184,0.2)" }}
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="rounded-2xl px-3 py-2 text-xs font-semibold"
              style={{
                background: isSending ? "rgba(148,163,184,0.3)" : "linear-gradient(135deg, #14B8A6, #2563EB)",
                color: "white",
                opacity: isSending ? 0.7 : 1,
              }}
            >
              Send
            </button>
          </form>
        </motion.div>
      )}

      <motion.button
        onClick={() => {
          setIsOpen((prev) => !prev);
          setShowSuggestions(false);
        }}
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
