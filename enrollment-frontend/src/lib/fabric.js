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
