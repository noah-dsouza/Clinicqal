import { useEffect, useRef } from "react";
import { useDigitalTwin } from "../../../context/DigitalTwinContext";

declare global {
  interface Window {
    botpress?: {
      init: (config: Record<string, unknown>) => void;
      open: () => void;
      close: () => void;
      sendEvent: (event: Record<string, unknown>) => void;
      on: (event: string, cb: (data: unknown) => void) => void;
    };
  }
}

const BOT_ID = "c569d916-77c6-4e30-9a5a-4885dc121910";

function buildContext(twin: ReturnType<typeof useDigitalTwin>["twin"]): string {
  if (!twin) return "No patient profile loaded.";
  return (
    `Patient: ${twin.intake.demographics.age}y ${twin.intake.demographics.sex}, ` +
    `Diagnosis: ${twin.intake.diagnosis.primary_condition}, ` +
    `Health Score: ${twin.health_score.overall}/100, BMI: ${twin.bmi.toFixed(1)}, ` +
    `Labs: ${twin.intake.labs.map((l) => `${l.name} ${l.value}${l.unit}`).join("; ") || "none"}, ` +
    `Meds: ${twin.active_medication_names.join(", ") || "none"}`
  );
}

export function HealthChat() {
  const { twin } = useDigitalTwin();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const script = document.createElement("script");
    script.src = "https://cdn.botpress.cloud/webchat/v2.3/inject.js";
    script.async = true;
    script.onload = () => {
      window.botpress?.init({
        botId: BOT_ID,
        clientId: BOT_ID,
        botName: "ClinIQ Assistant",
        composerPlaceholder: "Ask about your health data...",
        showPoweredBy: false,
        userData: { data: { cliniqContext: buildContext(twin) } },
      });
    };
    document.head.appendChild(script);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
