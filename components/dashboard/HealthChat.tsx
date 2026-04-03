"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useDigitalTwin } from "@/context/DigitalTwinContext";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export function HealthChat() {
  const { twin } = useDigitalTwin();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent/chat", body: { twin } }),
    messages: [
      {
        id: "welcome",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: twin
              ? "Hi! I'm your ClinIQ health assistant. I can answer questions about your health profile, explain your lab results, or discuss clinical trial criteria. What would you like to know?"
              : "Hello! I'm your ClinIQ health assistant. Please complete your intake form first so I can give you personalized guidance.",
          },
        ],
      },
    ] as UIMessage[],
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex flex-col rounded-2xl border border-border shadow-2xl overflow-hidden"
      style={{
        width: 380,
        height: 520,
        background: "hsl(var(--card))",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(13,148,136,0.1)",
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center gap-3" style={{ background: "rgba(13,148,136,0.05)" }}>
        <div className="w-8 h-8 rounded-full bg-[rgba(13,148,136,0.15)] flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7l9 5 9-5-9-5z" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 12l9 5 9-5" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 17l9 5 9-5" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">ClinIQ Assistant</p>
          <p className="text-[10px] text-[#22C55E]">● Online · Powered by Claude</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => {
          const textPart = msg.parts.find((p) => p.type === "text");
          const text = textPart && "text" in textPart ? textPart.text : "";
          if (!text) return null;

          return (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#0D9488] text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm border border-border"
                }`}
              >
                {text}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2 border border-border">
              <LoadingSpinner size="sm" color="#0D9488" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-destructive text-center py-1">Something went wrong. Please try again.</div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your health data..."
            disabled={isLoading}
            className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[rgba(13,148,136,0.2)] transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-9 h-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#0f766e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <p className="text-[9px] text-muted-foreground text-center mt-1.5">Informational only · Not medical advice</p>
      </div>
    </div>
  );
}
