/**
 * FRESHNESS SCORE CALCULATOR
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns a score 0–100 representing how "fresh" a donation still is.
 *
 * Formula:
 *   score = (hoursUntilExpiry / maxShelfHours[category]) * 100
 *   Clamped to [0, 100].
 *
 * maxShelfHours is the expected maximum shelf life per category.
 * A cooked meal expires in ~8h; packaged goods last ~30 days (720h).
 *
 * score ≥ 70  → Fresh   (green)
 * score ≥ 40  → Moderate (yellow)
 * score  < 40 → Critical (red) — NGOs should prioritise these
 */

const CATEGORY_MAX_SHELF_HOURS = {
  cooked:    8,
  raw:       24,
  bakery:    48,
  dairy:     24,
  packaged:  720,
  beverages: 168,
  other:     24,
};

export const calculateFreshnessScore = (expiryTime, foodCategory) => {
  const maxShelfHours = CATEGORY_MAX_SHELF_HOURS[foodCategory] ?? 24;
  const hoursUntilExpiry = Math.max(0, (new Date(expiryTime) - Date.now()) / 3_600_000);
  const raw = (hoursUntilExpiry / maxShelfHours) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
};

export const getFreshnessLabel = (score) => {
  if (score >= 70) return { label: "Fresh",    color: "green"  };
  if (score >= 40) return { label: "Moderate",  color: "yellow" };
  return               { label: "Critical",  color: "red"    };
};
