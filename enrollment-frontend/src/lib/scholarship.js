/**
 * Who counts as a scholar.
 *
 * The enrolment form takes the scholarship as free text, so the column holds
 * everything from "City Scholar" to "n/a" to blank. Anything that is not one
 * of the ways of writing "no scholarship" is treated as one.
 */

const NOT_A_SCHOLAR = new Set(['', '-', 'none', 'n/a', 'na', 'no', 'wala', 'null', 'nan']);

export const isScholar = (student) =>
  !NOT_A_SCHOLAR.has(String(student?.scholarship ?? '').trim().toLowerCase());

/** The scholarship as written, or '' for a student who has none. */
export const scholarshipLabel = (student) =>
  (isScholar(student) ? String(student.scholarship).trim() : '');

export const SCHOLARSHIP_ANY = 'any';
export const SCHOLARSHIP_NONE = 'none';

/**
 * Filter choices: every scholarship actually present, plus "any" and "none".
 * Values differing only by case or spacing collapse into one entry.
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
