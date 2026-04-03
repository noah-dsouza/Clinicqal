import { NextResponse } from "next/server";
import { generateText } from "ai";
import { cliniqModel } from "@/lib/ai/provider";

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
  medications: Array<{ name: string; dosage?: string; frequency?: string }>;
  diagnoses: string[];
  notes: string;
}

const DOCUMENT_PARSER_SYSTEM_PROMPT = `You are a medical document parser. Extract all health data from this document including: lab values with units and reference ranges, vital signs, diagnoses, medications, dates, and physician notes. Return as structured JSON matching this schema: { labs: [{name, value, unit, reference_low, reference_high, date}], vitals: {systolic_bp, diastolic_bp, heart_rate, temperature_c, spo2_percent, respiratory_rate}, medications: [{name, dosage, frequency}], diagnoses: [string], notes: string }

Rules:
- All lab values must be numeric (convert strings like "12.5" to numbers)
- Convert Fahrenheit temperatures to Celsius if needed (C = (F-32) * 5/9)
- If a field is not found, omit it or use null
- Return ONLY valid JSON, no markdown, no explanation`;

async function parseWithClaude(
  textContent: string | null,
  imageBase64: string | null,
  mimeType: string | null
): Promise<{ extracted_data: ParsedHealthDocument; raw_text: string; confidence: "high" | "medium" | "low" }> {
  let messages: Parameters<typeof generateText>[0]["messages"];

  if (imageBase64 && mimeType) {
    messages = [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: `data:${mimeType};base64,${imageBase64}`,
          },
          { type: "text", text: "Extract all health data from this medical document image. Return only valid JSON." },
        ],
      },
    ];
  } else if (textContent) {
    messages = [
      {
        role: "user",
        content: `Extract all health data from this document text and return as JSON:\n\n${textContent}`,
      },
    ];
  } else {
    throw new Error("No content to parse");
  }

  const { text: rawText } = await generateText({
    model: cliniqModel,
    system: DOCUMENT_PARSER_SYSTEM_PROMPT,
    messages,
    maxOutputTokens: 2000,
  });

  const jsonText = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let extracted_data: ParsedHealthDocument;
  let confidence: "high" | "medium" | "low" = "medium";

  try {
    extracted_data = JSON.parse(jsonText);
    const hasLabs = extracted_data.labs?.length > 0;
    const hasVitals = extracted_data.vitals && Object.keys(extracted_data.vitals).length > 0;
    const hasDiagnoses = extracted_data.diagnoses?.length > 0;
    if (hasLabs && hasVitals && hasDiagnoses) confidence = "high";
    else if (hasLabs || hasVitals || hasDiagnoses) confidence = "medium";
    else confidence = "low";
  } catch {
    extracted_data = { labs: [], vitals: {}, medications: [], diagnoses: [], notes: rawText };
    confidence = "low";
  }

  return { extracted_data, raw_text: textContent || "[image]", confidence };
}

function parseWithRegex(text: string): { extracted_data: ParsedHealthDocument; raw_text: string; confidence: "high" | "medium" | "low" } {
  const extracted_data: ParsedHealthDocument = { labs: [], vitals: {}, medications: [], diagnoses: [], notes: "" };
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const labMatch = line.match(/^([A-Za-z][A-Za-z0-9\s\/\-]+?):\s*([\d.]+)\s*([a-zA-Z%\/\^0-9\s]+?)(?:\s*\(.*\))?$/);
    if (labMatch) {
      const value = parseFloat(labMatch[2]);
      if (!isNaN(value) && labMatch[3].trim()) {
        extracted_data.labs.push({ name: labMatch[1].trim(), value, unit: labMatch[3].trim() });
        continue;
      }
    }

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

    const primaryMatch = line.match(/Primary\s*Condition[:\s]+(.+)/i);
    if (primaryMatch) { extracted_data.diagnoses.unshift(primaryMatch[1].trim()); continue; }

    const secondaryMatch = line.match(/Secondary\s*Conditions?[:\s]+(.+)/i);
    if (secondaryMatch) {
      secondaryMatch[1].split(",").map((s) => s.trim()).filter(Boolean).forEach((d) => extracted_data.diagnoses.push(d));
      continue;
    }
  }

  const hasLabs = extracted_data.labs.length > 0;
  const hasVitals = Object.keys(extracted_data.vitals).length > 0;
  const hasDx = extracted_data.diagnoses.length > 0;
  const confidence: "high" | "medium" | "low" = hasLabs && hasVitals && hasDx ? "high" : hasLabs || hasVitals ? "medium" : "low";

  return { extracted_data, raw_text: text, confidence };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("document") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 413 });
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type) && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only PDF and image files are accepted" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let result;

    if (file.type === "application/pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const pdfData = await pdfParse(buffer);
      result = process.env.ANTHROPIC_API_KEY
        ? await parseWithClaude(pdfData.text, null, null)
        : parseWithRegex(pdfData.text);
    } else if (file.type.startsWith("image/")) {
      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json(
          { error: "Image parsing requires ANTHROPIC_API_KEY. Please upload a PDF instead." },
          { status: 400 }
        );
      }
      result = await parseWithClaude(null, buffer.toString("base64"), file.type);
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[Upload Error]", err);
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 });
  }
}
