"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if a digital twin session exists
    try {
      const stored = sessionStorage.getItem("cliniq_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        const TWO_HOURS = 2 * 60 * 60 * 1000;
        if (Date.now() - parsed.savedAt < TWO_HOURS) {
          router.replace("/dashboard");
          return;
        }
      }
    } catch {
      // sessionStorage unavailable or malformed
    }
    router.replace("/intake");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading ClinIQ…</div>
    </div>
  );
}
