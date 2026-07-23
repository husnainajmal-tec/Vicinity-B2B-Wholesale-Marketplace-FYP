/**
 * Validate a product's tiered pricing.
 *
 * Rules enforced:
 *  - 2 to 4 tiers required.
 *  - Each tier needs a positive minQty and a positive pricePerUnit.
 *  - maxQty may be null/empty ONLY on the highest tier ("and above").
 *    Otherwise maxQty must be >= minQty.
 *  - The lowest tier's minQty must be >= the product MOQ.
 *  - Tiers must not overlap once sorted by minQty (each tier must start
 *    strictly after the previous tier's maxQty).
 *
 * @param {Array<{minQty:number,maxQty:number|null,pricePerUnit:number}>} tiers
 * @param {number} moq
 * @returns {{ valid: boolean, message?: string, tiers?: Array }}
 *          On success returns the normalized/sorted tiers.
 */
function validateTiers(tiers, moq) {
  if (!Array.isArray(tiers) || tiers.length < 2) {
    return { valid: false, message: "At least 2 pricing tiers are required" };
  }
  if (tiers.length > 4) {
    return { valid: false, message: "A maximum of 4 pricing tiers is allowed" };
  }

  // Normalize numbers (empty maxQty -> null).
  const normalized = tiers.map((t) => ({
    minQty: Number(t.minQty),
    maxQty:
      t.maxQty === null || t.maxQty === undefined || t.maxQty === ""
        ? null
        : Number(t.maxQty),
    pricePerUnit: Number(t.pricePerUnit),
  }));

  for (const t of normalized) {
    if (!Number.isFinite(t.minQty) || t.minQty <= 0) {
      return { valid: false, message: "Each tier needs a positive minimum quantity" };
    }
    if (!Number.isFinite(t.pricePerUnit) || t.pricePerUnit <= 0) {
      return { valid: false, message: "Each tier needs a positive price per unit" };
    }
    if (t.maxQty !== null) {
      if (!Number.isFinite(t.maxQty) || t.maxQty <= 0) {
        return { valid: false, message: "Tier maximum quantity must be a positive number" };
      }
      if (t.maxQty < t.minQty) {
        return {
          valid: false,
          message: "A tier's maximum quantity cannot be less than its minimum",
        };
      }
    }
  }

  // Sort by minQty ascending for overlap checks.
  const sorted = [...normalized].sort((a, b) => a.minQty - b.minQty);

  // Only the last (highest) tier may be open-ended (maxQty === null).
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].maxQty === null) {
      return {
        valid: false,
        message: "Only the highest tier can be open-ended (no maximum)",
      };
    }
  }

  // Lowest tier must respect MOQ.
  if (Number.isFinite(moq) && sorted[0].minQty < moq) {
    return {
      valid: false,
      message: `The lowest tier's minimum quantity (${sorted[0].minQty}) must be at least the MOQ (${moq})`,
    };
  }

  // No overlaps: each tier must start strictly after the previous tier's max.
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (curr.minQty <= prev.maxQty) {
      return {
        valid: false,
        message: "Pricing tiers must not overlap in quantity ranges",
      };
    }
  }

  return { valid: true, tiers: sorted };
}

module.exports = validateTiers;
