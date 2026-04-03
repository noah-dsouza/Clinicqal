import React, { useState, useRef, useCallback } from "react";
import { useDigitalTwin } from "../../../context/DigitalTwinContext";

interface ParsedLab {
  name: string;
  value: number;
  unit: string;
  reference_low?: number;
  reference_high?: number;
  date?: string;
}

interface ParsedVitals {
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature_c?: number;
  spo2_percent?: number;
  respiratory_rate?: number;
}

interface ParsedMedication {
  name: string;
  dosage?: string;
  frequency?: string;
}

interface ParsedHealthDocument {
  labs: ParsedLab[];
  vitals: ParsedVitals;
  medications: ParsedMedication[];
  diagnoses: string[];
  notes: string;
}

interface UploadResult {
  extracted_data: ParsedHealthDocument;
  raw_text: string;
  confidence: "high" | "medium" | "low";
}

interface HealthDocumentUploadProps {
  onClose?: () => void;
}

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png";
const MAX_SIZE_MB = 10;

function FileIcon({ type }: { type: string }) {
  if (type === "application/pdf") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="13" x2="8" y2="13" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="17" x2="8" y2="17" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
        <polyline points="10 9 9 9 8 9" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="#0D9488" strokeWidth="2" />
      <circle cx="8.5" cy="8.5" r="1.5" stroke="#0D9488" strokeWidth="2" />
      <polyline points="21 15 16 10 5 21" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const styles = {
    high: { bg: "rgba(34,197,94,0.1)", color: "#22C55E", label: "High Confidence" },
    medium: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B", label: "Medium Confidence" },
    low: { bg: "rgba(239,68,68,0.1)", color: "#EF4444", label: "Low Confidence" },
  };
  const s = styles[confidence];
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export function HealthDocumentUpload({ onClose }: HealthDocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { twin, setTwin } = useDigitalTwin();

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_SIZE_MB}MB`;
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(f.type) && !f.type.startsWith("image/")) {
      return "Only PDF and image files are accepted";
    }
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
    setApplied(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch("/api/upload/health-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error || `Upload failed (${response.status})`);
      }

      const data = await response.json() as UploadResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyToProfile = async () => {
    if (!result) return;
    setIsUploading(true);
    setError(null);

    try {
      // Merge extracted data on top of existing twin intake (or defaults)
      const base = twin?.intake ?? {
        demographics: { age: 30, sex: "male" as const, ethnicity: "", weight_kg: 70, height_cm: 170, zip_code: "" },
        diagnosis: { primary_condition: "", icd10_code: "", stage: "", diagnosis_date: "", secondary_conditions: [] },
        medications: [],
        labs: [],
        vitals: {},
        lifestyle: { smoking_status: "never" as const, alcohol_use: "none" as const, physical_activity: "moderate" as const, diet_quality: "average" as const },
      };

      const dx = result.extracted_data.diagnoses;
      const intake = {
        ...base,
        diagnosis: {
          ...base.diagnosis,
          primary_condition: dx[0] ?? base.diagnosis.primary_condition,
          secondary_conditions: dx.slice(1).length > 0 ? dx.slice(1) : base.diagnosis.secondary_conditions,
        },
        labs: result.extracted_data.labs.length > 0 ? result.extracted_data.labs : base.labs,
        vitals: Object.keys(result.extracted_data.vitals).length > 0 ? result.extracted_data.vitals : base.vitals,
        medications: result.extracted_data.medications.length > 0
          ? result.extracted_data.medications.map((m) => ({ name: m.name, dosage: m.dosage ?? "", frequency: m.frequency ?? "" }))
          : base.medications,
      };

      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intake),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(e.error ?? `Submit failed (${res.status})`);
      }

      const { twin: newTwin } = await res.json() as { session_id: string; twin: Parameters<typeof setTwin>[0] };
      setTwin(newTwin);
      setApplied(true);
      setTimeout(() => onClose?.(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply profile");
    } finally {
      setIsUploading(false);
    }
  };

  const totalExtracted =
    (result?.extracted_data.labs.length ?? 0) +
    Object.keys(result?.extracted_data.vitals ?? {}).length +
    (result?.extracted_data.medications.length ?? 0) +
    (result?.extracted_data.diagnoses.length ?? 0);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!file && (
        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-[#22C55E] bg-[rgba(34,197,94,0.05)]"
              : "border-[#E5E7EB] hover:border-[rgba(13,148,136,0.4)] hover:bg-[#F9FAFB]"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.08)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="17 8 12 3 7 8" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="3" x2="12" y2="15" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#111827]">Drop your health document here</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">or click to browse</p>
            </div>
            <p className="text-xs text-[#9CA3AF]">PDF, JPG, PNG · Max {MAX_SIZE_MB}MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* File preview */}
      {file && !result && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
          <FileIcon type={file.type} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#111827] truncate">{file.name}</p>
            <p className="text-xs text-[#9CA3AF]">{(file.size / 1024).toFixed(0)} KB · {file.type.split("/")[1]?.toUpperCase()}</p>
          </div>
          <button
            onClick={() => { setFile(null); setError(null); }}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] text-[#EF4444] text-sm">
          {error}
        </div>
      )}

      {/* Upload button */}
      {file && !result && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: isUploading ? "rgba(34,197,94,0.1)" : "#22C55E",
            color: isUploading ? "#22C55E" : "#fff",
            border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
              Parsing document with AI...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a10 10 0 1 0 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M22 4L12 14M22 4h-6M22 4v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Parse with AI
            </>
          )}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="22 4 12 14.01 9 11.01" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium text-[#111827]">Document parsed successfully</span>
            </div>
            <ConfidenceBadge confidence={result.confidence} />
          </div>

          {/* Summary of extracted data */}
          <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
            {result.extracted_data.labs.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F3F4F6]">
                <span className="text-xs text-[#6B7280]">Lab Results</span>
                <span className="text-xs font-semibold text-[#22C55E]">{result.extracted_data.labs.length} found</span>
              </div>
            )}
            {Object.keys(result.extracted_data.vitals).length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F3F4F6]">
                <span className="text-xs text-[#6B7280]">Vital Signs</span>
                <span className="text-xs font-semibold text-[#0D9488]">{Object.keys(result.extracted_data.vitals).length} found</span>
              </div>
            )}
            {result.extracted_data.medications.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F3F4F6]">
                <span className="text-xs text-[#6B7280]">Medications</span>
                <span className="text-xs font-semibold text-[#0D9488]">{result.extracted_data.medications.length} found</span>
              </div>
            )}
            {result.extracted_data.diagnoses.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-[#6B7280]">Diagnoses</span>
                <span className="text-xs font-semibold text-[#F59E0B]">{result.extracted_data.diagnoses.length} found</span>
              </div>
            )}
            {totalExtracted === 0 && (
              <div className="px-4 py-4 text-center">
                <p className="text-xs text-[#9CA3AF]">No structured health data could be extracted from this document.</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {result.extracted_data.notes && (
            <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
              <p className="text-xs text-[#6B7280] font-medium mb-1">Physician Notes</p>
              <p className="text-xs text-[#9CA3AF] leading-relaxed line-clamp-3">{result.extracted_data.notes}</p>
            </div>
          )}

          {totalExtracted > 0 && (
            <button
              onClick={handleApplyToProfile}
              disabled={applied}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              style={{
                background: applied ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.9)",
                color: applied ? "#22C55E" : "#fff",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              {applied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Applied to Profile
                </>
              ) : (
                "Apply to Profile"
              )}
            </button>
          )}

          <button
            onClick={() => { setFile(null); setResult(null); setApplied(false); }}
            className="w-full py-2 text-xs text-[#9CA3AF] hover:text-[#111827] transition-colors"
          >
            Upload another document
          </button>
        </div>
      )}
    </div>
  );
}
