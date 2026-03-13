/**
 * ENVIRONMENTAL IMPACT CALCULATOR
 * ─────────────────────────────────────────────────────────────────────────────
 * Called when a volunteer marks a delivery complete.
 * Converts food quantity into three impact metrics.
 *
 * Reference constants:
 *   mealsSaved      = quantityKg / 0.4       (WHO: avg 400g per meal)
 *   co2OffsetKg     = quantityKg * 2.5       (FAO: avg 2.5kg CO₂e per kg food waste)
 *   waterSavedLitres = quantityKg * 1000     (UNESCO: avg 1000L water per kg food)
 *
 * Unit conversion to kg:
 *   kg       → 1.0   (direct)
 *   litres   → 0.95  (approximate — most liquids ~0.95 kg/L)
 *   portions → 0.35  (avg 350g per portion)
 *   boxes    → 5.0   (avg 5kg per box)
 *   packets  → 0.5   (avg 500g per packet)
 */

const UNIT_TO_KG = {
  kg:       1.0,
  litres:   0.95,
  portions: 0.35,
  boxes:    5.0,
  packets:  0.5,
};

/**
 * @param {number} quantityValue
 * @param {string} quantityUnit  - one of: kg | litres | portions | boxes | packets
 * @returns {{ quantityKg, mealsSaved, co2OffsetKg, waterSavedLitres }}
 */
export const calculateImpact = (quantityValue, quantityUnit) => {
  const kgMultiplier = UNIT_TO_KG[quantityUnit] ?? 1.0;
  const quantityKg   = quantityValue * kgMultiplier;

  return {
    quantityKg:       +quantityKg.toFixed(2),
    mealsSaved:        Math.round(quantityKg / 0.4),
    co2OffsetKg:      +(quantityKg * 2.5).toFixed(2),
    waterSavedLitres:  Math.round(quantityKg * 1000),
  };
};
