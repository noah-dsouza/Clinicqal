import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { cliniqModel } from "@/lib/ai/provider";
import { TrialScoresSchema } from "@/lib/ai/schemas";
import { SCORE_SYSTEM_PROMPT, buildPatientSummary } from "@/lib/ai/prompts";
import { DigitalTwin } from "@/lib/digital-twin/schema";
import { ClinicalTrial } from "@/lib/utils/trial-schema";

export async function POST(req: Request) {
  try {
    const { twin, trials } = (await req.json()) as {
      twin: DigitalTwin;
      trials: ClinicalTrial[];
    };

    if (!twin || !trials?.length) {
      return NextResponse.json(
        { error: "twin and trials are required" },
        { status: 400 }
      );
    }

    const patientSummary = buildPatientSummary(twin);

    const { object } = await generateObject({
      model: cliniqModel,
      schema: TrialScoresSchema,
      system: SCORE_SYSTEM_PROMPT,
      prompt: `Patient profile:\n${patientSummary}\n\nScore eligibility for these ${trials.length} trials:\n${JSON.stringify(
        trials.map((t) => ({
          nctId: t.nct_id,
          title: t.title,
          phase: t.phase,
          conditions: t.conditions,
          inclusion_criteria: t.inclusion_criteria,
          exclusion_criteria: t.exclusion_criteria,
          min_age: t.min_age,
          max_age: t.max_age,
          accepts_healthy_volunteers: t.accepts_healthy_volunteers,
        })),
        null,
        2
      )}`,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("Score route error:", err);
    return NextResponse.json({ error: "Scoring failed" }, { status: 500 });
  }
}
