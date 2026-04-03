import { Router, Request, Response } from "express";
import { searchDoctorsNearby } from "../services/doctorSearchService";

const router = Router();

// GET /api/doctors/search?condition=diabetes&location=New+York+NY
router.get("/search", async (req: Request, res: Response): Promise<void> => {
  const condition = req.query.condition as string;
  const location = req.query.location as string;
  const ageRaw = req.query.age as string | undefined;
  const sex = (req.query.sex as string | undefined)?.toLowerCase();
  const stage = req.query.stage as string | undefined;

  if (!condition || !location) {
    res.status(400).json({ error: "condition and location are required" });
    return;
  }

  try {
    const age = ageRaw ? parseInt(ageRaw, 10) : undefined;
    const doctors = await searchDoctorsNearby(condition.trim(), location.trim(), {
      age: Number.isFinite(age) ? age : undefined,
      sex,
      stage,
    });
    res.json({ condition, location, doctors });
  } catch (err) {
    console.error("[Doctors Route]", err);
    res.status(500).json({ error: "Doctor search failed" });
  }
});

export default router;
