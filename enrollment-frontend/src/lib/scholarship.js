/**
 * The scholarship filter on the students page.
 *
 * Which scholarship a student holds is decided in one place, `studentStatus`,
 * so the filter here, the cashier's scholars sheet and the headcounts all
 * agree about who holds what. This module is only the filter's own vocabulary
 * on top of that.
 */

import { scholarshipLabel as normalize, isScholar } from './studentStatus.js';

export { isScholar };

/** The scholarship as it should read, or '' for a student who has none. */
export const scholarshipLabel = (student) => normalize(student?.scholarship) ?? '';

export const SCHOLARSHIP_ANY = 'any';
export const SCHOLARSHIP_NONE = 'none';

/**
 * Filter choices: every scholarship actually present, plus "any" and "none".
 *
 * Keyed on the normalised name, so the student recorded as "SA" and the one
 * recorded as "STUDENT ASSISTANT" are one choice holding both of them rather
 * than two choices holding one each.
 */
export const scholarshipOptions = (students) => {
  const seen = new Map();

  for (const student of students) {
    const label = scholarshipLabel(student);

    if (label && !seen.has(label.toLowerCase())) seen.set(label.toLowerCase(), label);
  }

  const named = [...seen.values()].sort((a, b) => a.localeCompare(b));

  return [
    { label: 'All Scholarships', value: 'all' },
    { label: 'Scholars only', value: SCHOLARSHIP_ANY },
    { label: 'Not a scholar', value: SCHOLARSHIP_NONE },
    ...named.map((label) => ({ label, value: label.toLowerCase() })),
  ];
};

/** Does this student pass the chosen scholarship filter? */
export const matchesScholarship = (student, filter) => {
  if (filter === 'all') return true;
  if (filter === SCHOLARSHIP_ANY) return isScholar(student);
  if (filter === SCHOLARSHIP_NONE) return !isScholar(student);

  return scholarshipLabel(student).toLowerCase() === filter;
};
