"use client";

import { useRouter } from "next/navigation";
import { DigitalTwinProvider } from "@/context/DigitalTwinContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

function Dashboard() {
  const router = useRouter();
  return <DashboardLayout onRetakeIntake={() => router.push("/intake")} />;
}

export default function DashboardPage() {
  return (
    <DigitalTwinProvider>
      <Dashboard />
    </DigitalTwinProvider>
  );
}
