"use client";

import { DigitalTwinProvider } from "@/context/DigitalTwinContext";
import { IntakeShell } from "@/components/intake/IntakeShell";

export default function IntakePage() {
  return (
    <DigitalTwinProvider>
      <IntakeShell />
    </DigitalTwinProvider>
  );
}
