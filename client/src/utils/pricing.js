/**
 * Client-side mirror of the server tier rules (server/utils/validateTiers.js).
 * Gives instant feedback in the form; the server remains the source of truth.
 *
 * @returns {string|null} an error message, or null if valid.
 */
export function validateTiersClient(tiers, moq) {
  if (!Array.isArray(tiers) || tiers.length < 2) {
    return "At least 2 pricing tiers are required.";
  }
  if (tiers.length > 4) {
    return "A maximum of 4 pricing tiers is allowed.";
  }

  const norm = tiers.map((t) => ({
    minQty: Number(t.minQty),
    maxQty: t.maxQty === "" || t.maxQty == null ? null : Number(t.maxQty),
    pricePerUnit: Number(t.pricePerUnit),
  }));

  for (const t of norm) {
    if (!Number.isFinite(t.minQty) || t.minQty <= 0) {
      return "Each tier needs a positive minimum quantity.";
    }
    if (!Number.isFinite(t.pricePerUnit) || t.pricePerUnit <= 0) {
      return "Each tier needs a positive price per unit.";
    }
    if (t.maxQty !== null && (t.maxQty <= 0 || t.maxQty < t.minQty)) {
      return "A tier's maximum must be positive and not less than its minimum.";
    }
  }

  const sorted = [...norm].sort((a, b) => a.minQty - b.minQty);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].maxQty === null) {
      return "Only the highest tier can be open-ended (no maximum).";
    }
  }

  const moqNum = Number(moq);
  if (Number.isFinite(moqNum) && sorted[0].minQty < moqNum) {
    return `The lowest tier's minimum (${sorted[0].minQty}) must be at least the MOQ (${moqNum}).`;
  }

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].minQty <= sorted[i - 1].maxQty) {
      return "Pricing tiers must not overlap in quantity ranges.";
    }
  }

  return null;
}

/**
 * Given a quantity, return the index of the matching tier (or -1).
 * Tiers are assumed sorted by minQty; maxQty null = open-ended.
 */
export function activeTierIndex(tiers, qty) {
  const q = Number(qty);
  if (!Number.isFinite(q)) return -1;
  return tiers.findIndex((t) => {
    const min = Number(t.minQty);
    const max = t.maxQty == null ? Infinity : Number(t.maxQty);
    return q >= min && q <= max;
  });
}

/** Format a number with thousands separators (for display). */
export function formatQty(n) {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString() : n;
}

/** Format a price value as PKR. */
export function formatPrice(n) {
  const num = Number(n);
  return Number.isFinite(num)
    ? `PKR ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    : n;
}
