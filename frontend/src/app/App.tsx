import { useState, useEffect } from "react";
import { DigitalTwinProvider, useDigitalTwin } from "../context/DigitalTwinContext";
import { IntakeShell } from "./components/intake/IntakeShell";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { LoginPage } from "./components/auth/LoginPage";

type Screen = "login" | "intake" | "dashboard";

function AppContent() {
  const { twin } = useDigitalTwin();
  const [screen, setScreen] = useState<Screen>("login");

  // Go to dashboard only after completing intake (not from cached session on login screen)
  useEffect(() => {
    if (twin && screen === "intake") setScreen("dashboard");
  }, [twin, screen]);

  if (screen === "login") {
    return (
      <LoginPage
        onLogin={() => setScreen("intake")}
        onGuest={() => setScreen("intake")}
      />
    );
  }

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
