import { useState, useEffect } from "react";
import { DigitalTwinProvider, useDigitalTwin } from "../context/DigitalTwinContext";
import { IntakeShell } from "./components/intake/IntakeShell";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";

type Screen = "intake" | "dashboard";

function AppContent() {
  const { twin } = useDigitalTwin();
  const [screen, setScreen] = useState<Screen>(twin ? "dashboard" : "intake");

  // Whenever twin is set from anywhere (upload, intake form, session restore),
  // automatically navigate to the dashboard.
  useEffect(() => {
    if (twin) setScreen("dashboard");
  }, [twin]);

  if (screen === "dashboard" && twin) {
    return <DashboardLayout onRetakeIntake={() => setScreen("intake")} />;
  }

  return <IntakeShell onComplete={() => setScreen("dashboard")} />;
}

export default function App() {
  return (
    <DigitalTwinProvider>
      <AppContent />
    </DigitalTwinProvider>
  );
}
