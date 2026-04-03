import { Router, Request, Response } from "express";
import { searchDoctorsNearby } from "../services/doctorSearchService";

const router = Router();

// GET /api/doctors/search?condition=diabetes&location=New+York+NY
router.get("/search", async (req: Request, res: Response): Promise<void> => {
  const condition = req.query.condition as string;
  const location = req.query.location as string;

  if (!condition || !location) {
    res.status(400).json({ error: "condition and location are required" });
    return;
  }

  try {
    const doctors = await searchDoctorsNearby(condition.trim(), location.trim());
    res.json({ condition, location, doctors });
  } catch (err) {
    console.error("[Doctors Route]", err);
    res.status(500).json({ error: "Doctor search failed" });
  }
});

export default router;
