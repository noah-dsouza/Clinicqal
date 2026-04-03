import { ClinicalTrial } from "./trial-schema";

/**
 * Deduplicates trials across registries.
 * Priority: clinicaltrials.gov > health_canada > who_ictrp
 * Match strategy: exact NCT ID match first, then title similarity.
 */
export function deduplicateTrials(trials: ClinicalTrial[]): ClinicalTrial[] {
  const sourcePriority = {
    "clinicaltrials.gov": 0,
    health_canada: 1,
    who_ictrp: 2,
  };

  const seen = new Map<string, ClinicalTrial>();

  // Sort by source priority so higher-quality sources win
  const sorted = [...trials].sort(
    (a, b) => sourcePriority[a.source] - sourcePriority[b.source]
  );

  for (const trial of sorted) {
    // Try exact NCT ID match
    const nctKey = trial.nct_id.toUpperCase();
    if (seen.has(nctKey)) continue;

    // Try normalized title match
    const titleKey = normalizeTitleKey(trial.title);
    let duplicate = false;
    for (const [, existing] of seen) {
      if (normalizeTitleKey(existing.title) === titleKey) {
        duplicate = true;
        break;
      }
    }

    if (!duplicate) {
      seen.set(nctKey, trial);
    }
  }

  return Array.from(seen.values());
}

function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 80);
}
