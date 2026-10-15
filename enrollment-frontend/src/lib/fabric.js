/** Shared labelling for the uniform fabric screens. */

/** The colour of the cloth itself, shown beside the fabric name. */
export const FABRIC_COLORS = {
  male_upper: 'Maroon',
  female_upper: 'Pink',
  lower: 'Gray',
};

/**
 * "Male Upper (Maroon)" — so whoever is at the counter knows which bolt is
 * meant. A fabric with no colour listed just reads as its name.
 */
export const fabricLabel = (fabric) => {
  if (!fabric) return '';
  const color = FABRIC_COLORS[fabric.code];
  return color ? `${fabric.name} (${color})` : fabric.name ?? '';
};

export const metersLabel = (value) =>
  `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} m`;

/** What a metre of uniform fabric costs — the same for every fabric. */
export const PRICE_PER_METER = 250;

/** Metres × the rate, rounded to centavos: 1.75 m → 437.50. */
export const priceForMeters = (meters) =>
  Math.round((Number(meters) || 0) * PRICE_PER_METER * 100) / 100;

export const pesoLabel = (value) =>
  `₱${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
