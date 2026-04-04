import { useState, useEffect } from "react";
import { DigitalTwinProvider, useDigitalTwin } from "../context/DigitalTwinContext";
import { IntakeShell } from "./components/intake/IntakeShell";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { LoginPage } from "./components/auth/LoginPage";

type Screen = "login" | "intake" | "dashboard";

function AppContent() {
  const { twin, setTwin, clearTwin } = useDigitalTwin();
  const [screen, setScreen] = useState<Screen>("login");

  // Go to dashboard only after completing intake (not from cached session on login screen)
  useEffect(() => {
    if (twin && screen === "intake") setScreen("dashboard");
  }, [twin, screen]);

  const handleDemo = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/demo/patient");
      const data = await res.json();
      if (data.twin) {
        setTwin(data.twin);
        setScreen("dashboard");
      }
    } catch (err) {
      console.error("[Demo] Failed to load demo patient", err);
    }
  };

  const goToIntake = () => {
    clearTwin();
    setScreen("intake");
  };

  if (screen === "login") {
    return (
      <LoginPage
        onLogin={goToIntake}
        onGuest={goToIntake}
        onDemo={handleDemo}
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
