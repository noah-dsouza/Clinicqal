import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { cliniqModel } from "@/lib/ai/provider";
import { ReanalyzeSchema } from "@/lib/ai/schemas";
import { REANALYZE_SYSTEM_PROMPT, buildPatientSummary } from "@/lib/ai/prompts";
import { DigitalTwin, IntakeFormData } from "@/lib/digital-twin/schema";
import { buildDigitalTwin } from "@/lib/digital-twin/normalize";
import { ClinicalTrial } from "@/lib/utils/trial-schema";

interface ScenarioOverrides {
  smoking_status?: "never" | "former" | "current";
  alcohol_use?: "none" | "moderate" | "heavy";
  physical_activity?: "sedentary" | "light" | "moderate" | "active";
  diet_quality?: "poor" | "average" | "good";
}

export async function POST(req: Request) {
  try {
    const { twin, scenarioOverrides, trials } = (await req.json()) as {
      twin: DigitalTwin;
      scenarioOverrides: ScenarioOverrides;
      trials: ClinicalTrial[];
    };

    if (!twin || !scenarioOverrides) {
      return NextResponse.json(
        { error: "twin and scenarioOverrides are required" },
        { status: 400 }
      );
    }

    // Apply scenario overrides to intake data and rebuild twin
    const updatedIntake: IntakeFormData = {
      ...twin.intake,
      lifestyle: {
        ...twin.intake.lifestyle,
        ...scenarioOverrides,
      },
    };
    const updatedTwin = buildDigitalTwin(updatedIntake, twin.session_id);
    const patientSummary = buildPatientSummary(updatedTwin);

    const { object } = await generateObject({
      model: cliniqModel,
      schema: ReanalyzeSchema,
      system: REANALYZE_SYSTEM_PROMPT,
      prompt: `Original health score: ${twin.health_score.overall}/100
Scenario changes: ${JSON.stringify(scenarioOverrides)}
Updated health score: ${updatedTwin.health_score.overall}/100

Updated patient profile:
${patientSummary}

Assess the impact of these lifestyle changes on eligibility for these trials:
${JSON.stringify(
  (trials || []).map((t) => ({
    id: t.nct_id,
    title: t.title,
    key_criteria: [t.inclusion_criteria, t.exclusion_criteria]
      .filter(Boolean)
      .join("\n")
      .substring(0, 500),
  })),
  null,
  2
)}`,
    });

    // Return both the reanalysis and the updated twin so the client can update health score
    return NextResponse.json({ ...object, updatedTwin });
  } catch (err) {
    console.error("Reanalyze route error:", err);
    return NextResponse.json({ error: "Reanalysis failed" }, { status: 500 });
  }
}
