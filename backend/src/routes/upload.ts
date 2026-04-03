import { Router, Request, Response } from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

// Use memory storage — no disk writes (HIPAA-safer)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are accepted"));
    }
  },
});

interface ParsedHealthDocument {
  labs: Array<{
    name: string;
    value: number;
    unit: string;
    reference_low?: number;
    reference_high?: number;
    date?: string;
  }>;
  vitals: {
    systolic_bp?: number;
    diastolic_bp?: number;
    heart_rate?: number;
    temperature_c?: number;
    spo2_percent?: number;
    respiratory_rate?: number;
  };
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
  }>;
  diagnoses: string[];
  notes: string;
}

const DOCUMENT_PARSER_SYSTEM_PROMPT = `You are a medical document parser. Extract all health data from this document including: lab values with units and reference ranges, vital signs, diagnoses, medications, dates, and physician notes. Return as structured JSON matching this schema: { labs: [{name, value, unit, reference_low, reference_high, date}], vitals: {systolic_bp, diastolic_bp, heart_rate, temperature_c, spo2_percent, respiratory_rate}, medications: [{name, dosage, frequency}], diagnoses: [string], notes: string }

Rules:
- All lab values must be numeric (convert strings like "12.5" to numbers)
- Convert Fahrenheit temperatures to Celsius if needed (C = (F-32) * 5/9)
- If a field is not found, omit it or use null
- Return ONLY valid JSON, no markdown, no explanation`;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function parseWithClaude(
  textContent: string | null,
  imageBase64: string | null,
  mimeType: string | null
): Promise<{ extracted_data: ParsedHealthDocument; raw_text: string; confidence: "high" | "medium" | "low" }> {
  const messages: Anthropic.MessageParam[] = [];

  if (imageBase64 && mimeType) {
    messages.push({
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: imageBase64,
          },
        },
        {
          type: "text",
          text: "Extract all health data from this medical document image. Return only valid JSON.",
        },
      ],
    });
  } else if (textContent) {
    messages.push({
      role: "user",
      content: `Extract all health data from this document text and return as JSON:\n\n${textContent}`,
    });
  } else {
    throw new Error("No content to parse");
  }

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    system: DOCUMENT_PARSER_SYSTEM_PROMPT,
    messages,
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text : "";

  // Clean JSON from potential markdown wrappers
  const jsonText = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let extracted_data: ParsedHealthDocument;
  let confidence: "high" | "medium" | "low" = "medium";

  try {
    extracted_data = JSON.parse(jsonText);
    // Determine confidence based on completeness
    const hasLabs = extracted_data.labs && extracted_data.labs.length > 0;
    const hasVitals = extracted_data.vitals && Object.keys(extracted_data.vitals).length > 0;
    const hasDiagnoses = extracted_data.diagnoses && extracted_data.diagnoses.length > 0;

    if (hasLabs && hasVitals && hasDiagnoses) confidence = "high";
    else if (hasLabs || hasVitals || hasDiagnoses) confidence = "medium";
    else confidence = "low";
  } catch {
    // Return empty structure if parsing fails
    extracted_data = {
      labs: [],
      vitals: {},
      medications: [],
      diagnoses: [],
      notes: rawText,
    };
    confidence = "low";
  }

  return { extracted_data, raw_text: textContent || "[image]", confidence };
}

function parseWithRegex(text: string): { extracted_data: ParsedHealthDocument; raw_text: string; confidence: "high" | "medium" | "low" } {
  const extracted_data: ParsedHealthDocument = {
    labs: [],
    vitals: {},
    medications: [],
    diagnoses: [],
    notes: "",
  };

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Labs: "Hemoglobin: 11.2 g/dL" or "HbA1c: 8.1% (High)"
    const labMatch = line.match(/^([A-Za-z][A-Za-z0-9\s\/\-]+?):\s*([\d.]+)\s*([a-zA-Z%\/\^0-9\s]+?)(?:\s*\(.*\))?$/);
    if (labMatch) {
      const name = labMatch[1].trim();
      const value = parseFloat(labMatch[2]);
      const unit = labMatch[3].trim();
      if (!isNaN(value) && unit) {
        extracted_data.labs.push({ name, value, unit });
        continue;
      }
    }

    // Vitals
    const bpMatch = line.match(/Blood\s*Pressure[:\s]+([\d]+)\s*\/\s*([\d]+)/i);
    if (bpMatch) { extracted_data.vitals.systolic_bp = parseInt(bpMatch[1]); extracted_data.vitals.diastolic_bp = parseInt(bpMatch[2]); continue; }

    const hrMatch = line.match(/Heart\s*Rate[:\s]+([\d]+)/i);
    if (hrMatch) { extracted_data.vitals.heart_rate = parseInt(hrMatch[1]); continue; }

    const spo2Match = line.match(/SpO2[:\s]+([\d.]+)/i);
    if (spo2Match) { extracted_data.vitals.spo2_percent = parseFloat(spo2Match[1]); continue; }

    const tempMatch = line.match(/Temperature[:\s]+([\d.]+)\s*°?C/i);
    if (tempMatch) { extracted_data.vitals.temperature_c = parseFloat(tempMatch[1]); continue; }

    const rrMatch = line.match(/Respiratory\s*Rate[:\s]+([\d]+)/i);
    if (rrMatch) { extracted_data.vitals.respiratory_rate = parseInt(rrMatch[1]); continue; }

    // Primary condition
    const primaryMatch = line.match(/Primary\s*Condition[:\s]+(.+)/i);
    if (primaryMatch) { extracted_data.diagnoses.unshift(primaryMatch[1].trim()); continue; }

    // Secondary conditions
    const secondaryMatch = line.match(/Secondary\s*Conditions?[:\s]+(.+)/i);
    if (secondaryMatch) {
      secondaryMatch[1].split(",").map((s) => s.trim()).filter(Boolean).forEach((d) => extracted_data.diagnoses.push(d));
      continue;
    }

    // Medications: lines ending in dosage patterns
    const medMatch = line.match(/^([A-Za-z][A-Za-z0-9\s\(\)]+?)\s+[\d]+\s*mg/i) ||
                     line.match(/^([A-Za-z][A-Za-z0-9\s\(\)]+?)\s+(?:Inhaler|IV|Injection)/i);
    if (medMatch) {
      const parts = line.split("–");
      extracted_data.medications.push({
        name: parts[0].trim(),
        frequency: parts[1]?.trim(),
      });
      continue;
    }
  }

  const hasLabs = extracted_data.labs.length > 0;
  const hasVitals = Object.keys(extracted_data.vitals).length > 0;
  const hasDx = extracted_data.diagnoses.length > 0;
  const confidence: "high" | "medium" | "low" = hasLabs && hasVitals && hasDx ? "high" : hasLabs || hasVitals ? "medium" : "low";

  return { extracted_data, raw_text: text, confidence };
}

// POST /api/upload/health-document
router.post("/health-document", upload.single("document"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { mimetype, buffer } = req.file;
    let result;

    if (mimetype === "application/pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text;

      // Try Claude first if API key is set, otherwise fall back to regex parser
      if (process.env.ANTHROPIC_API_KEY) {
        result = await parseWithClaude(text, null, null);
      } else {
        result = parseWithRegex(text);
      }
    } else if (mimetype.startsWith("image/")) {
      if (process.env.ANTHROPIC_API_KEY) {
        const base64 = buffer.toString("base64");
        result = await parseWithClaude(null, base64, mimetype);
      } else {
        return res.status(400).json({ error: "Image parsing requires an Anthropic API key. Please upload a PDF instead." });
      }
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    return res.json(result);
  } catch (err) {
    console.error("[Upload Error]", err);
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File too large. Maximum size is 10MB." });
      }
    }
    return res.status(500).json({ error: "Failed to process document" });
  }
});

export default router;
