import { NextResponse } from "next/server";
import { IntakeFormDataSchema } from "@/lib/digital-twin/schema";
import { buildDigitalTwin } from "@/lib/digital-twin/normalize";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = IntakeFormDataSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid intake data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const twin = buildDigitalTwin(parsed.data);
    return NextResponse.json({ twin }, { status: 201 });
  } catch (err) {
    console.error("Intake route error:", err);
    return NextResponse.json(
      { error: "Failed to process intake data" },
      { status: 500 }
    );
  }
}
