/**
 * Reading a student's scholarship and standing out of free-text fields.
 *
 * Both are typed by hand in places, so the same thing arrives spelt several
 * ways — "SA" and "STUDENT ASSISTANT" are one scholarship, and "n/a", "none"
 * and an empty cell all mean no scholarship at all. Normalising here keeps
 * every list, heading and total counting the same people.
 */

/** Values that mean "no scholarship", however someone typed them. */
const NOT_A_SCHOLARSHIP = /^(n\s*\/?\s*a|none|no|null|nil|-+|—+|0)$/i;

/**
 * The spellings the office actually uses, mapped to one printed form.
 *
 * Anything not listed is kept as typed but tidied, so a new scholarship
 * appears on the report the day it is first recorded rather than silently
 * falling into "other".
 */
/**
 * `scholar`, `scholars`, `scholarship`, `scholarships` — all the same word as
 * far as this report is concerned. Spelling it out once rather than per
 * scholarship keeps the two lists from drifting apart.
 */
const SCHOLAR = 'scholar(s|ship|ships)?';

const ALIASES = [
  // Printed in full rather than as "SA": the abbreviation is what people type
  // into the field, not what reads clearly on a report, and "Student Assistant
  // (SA)" is too wide for the column it has to sit in
  [/^(sas?|student[\s-]*assistants?|student[\s-]*assts?\.?)$/i, 'Student Assistant'],
  [new RegExp(`^city[\\s-]*${SCHOLAR}$`, 'i'), 'City Scholar'],
  [new RegExp(`^academic[\\s-]*${SCHOLAR}$`, 'i'), 'Academic Scholar'],
  [/^tesda$/i, 'TESDA'],
  [/^ched$/i, 'CHED'],
  [/^tdp$/i, 'TDP'],
  [/^owwa$/i, 'OWWA'],
  [/^tes$/i, 'TES'],
];

const titleCase = (text) =>
  text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');

/**
 * The scholarship a student holds, or null when they hold none.
 *
 * Null rather than an empty string so callers filter on truthiness without
 * accidentally keeping the 137 students whose record says "n/a" or "none".
 */
export const scholarshipLabel = (value) => {
  // Collapsed before matching: "City  Scholar" typed with two spaces is the
  // same scholarship as "City Scholar"
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');

  if (!text || NOT_A_SCHOLARSHIP.test(text)) return null;

  const alias = ALIASES.find(([pattern]) => pattern.test(text));

  return alias ? alias[1] : titleCase(text);
};

/**
 * The two the cashier's scholars list is for.
 *
 * Deliberately not every scholarship on file. TESDA, CHED, OWWA and the rest
 * are government or outside funding; City Scholar and Student Assistant are
 * the school's own, and they are the two the office tracks on this sheet.
 */
export const REPORTED_SCHOLARSHIPS = ['City Scholar', 'Student Assistant'];

/**
 * A student's scholarship when it is one of the two this report covers,
 * otherwise null — so filtering and labelling can never disagree about who
 * belongs on the sheet.
 */
export const reportedScholarship = (student) => {
  const label = scholarshipLabel(student?.scholarship);

  return REPORTED_SCHOLARSHIPS.includes(label) ? label : null;
};

/** Whether a student holds any scholarship at all, of any kind. */
export const isScholar = (student) => Boolean(scholarshipLabel(student?.scholarship));

/**
 * Whether a student has withdrawn.
 *
 * Read off academic_status, not enrolment: a withdrawn student keeps
 * `enrollment_status = 'enrolled'` in this database, which is why they were
 * turning up in the middle of the payment lists.
 */
export const isWithdrawn = (student) =>
  /withdraw/i.test(String(student?.academic_status ?? ''));

/** Sheet order: City Scholar first, then Student Assistant. */
export const scholarshipRank = (label) => {
  const index = REPORTED_SCHOLARSHIPS.indexOf(label);

  return index === -1 ? REPORTED_SCHOLARSHIPS.length : index;
};
