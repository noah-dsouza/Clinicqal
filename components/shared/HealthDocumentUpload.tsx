"use client";

import { useState, useRef } from "react";
import { useDigitalTwin } from "@/context/DigitalTwinContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { cn } from "@/lib/utils";

interface HealthDocumentUploadProps {
  onClose: () => void;
}

export function HealthDocumentUpload({ onClose }: HealthDocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ message: string; confidence: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { twin, setTwin } = useDigitalTwin();

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      const data = await response.json();
      const { extracted_data, confidence } = data;

      // Merge extracted data into current twin if one exists
      if (twin && extracted_data) {
        const updatedTwin = {
          ...twin,
          intake: {
            ...twin.intake,
            labs: [...twin.intake.labs, ...(extracted_data.labs || [])],
            vitals: { ...twin.intake.vitals, ...extracted_data.vitals },
            medications: [...twin.intake.medications, ...(extracted_data.medications || [])],
          },
        };
        setTwin(updatedTwin);
      }

      setResult({
        message: `Extracted ${extracted_data?.labs?.length || 0} lab results, ${
          Object.keys(extracted_data?.vitals || {}).length
        } vitals, ${extracted_data?.medications?.length || 0} medications.`,
        confidence,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          isDragging
            ? "border-[#0D9488] bg-[rgba(13,148,136,0.08)]"
            : "border-border hover:border-[rgba(13,148,136,0.4)] hover:bg-[rgba(13,148,136,0.04)]"
        )}
      >
        {isUploading ? (
          <LoadingSpinner size="md" label="Analyzing document..." />
        ) : (
          <>
            <svg className="mx-auto mb-3 text-muted-foreground" width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-medium text-foreground">Drop your health document here</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WebP — up to 10MB</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {result && (
        <div className="p-3 rounded-lg bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)]">
          <p className="text-sm text-[#22C55E] font-medium">Extraction complete</p>
          <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
          <p className="text-xs text-muted-foreground">Confidence: {result.confidence}</p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        {result ? "Done" : "Cancel"}
      </button>
    </div>
  );
}
