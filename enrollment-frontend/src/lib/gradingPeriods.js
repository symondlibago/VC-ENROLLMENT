/**
 * Which grading periods a class is marked on.
 *
 * College runs four periods — Prelim, Midterm, Semi-Final, Final. Senior High
 * (Grade 11 and Grade 12) runs three terms, following the DepEd learner's
 * performance report.
 *
 * The three SHS terms sit on the first three grade columns, so a mark keeps
 * its position and nothing has to be migrated: Term 1 is the prelim column,
 * Term 2 the midterm, Term 3 the semi-final. SHS simply never uses the fourth.
 */

export const COLLEGE_PERIODS = [
  { key: 'prelim_grade', label: 'Prelim', short: 'Prelim' },
  { key: 'midterm_grade', label: 'Midterm', short: 'Midterm' },
  { key: 'semifinal_grade', label: 'Semi-Final', short: 'Semi-Final' },
  { key: 'final_grade', label: 'Final', short: 'Final' },
];

export const SHS_PERIODS = [
  { key: 'prelim_grade', label: 'Term 1', short: 'Term 1' },
  { key: 'midterm_grade', label: 'Term 2', short: 'Term 2' },
  { key: 'semifinal_grade', label: 'Term 3', short: 'Term 3' },
];

/** Grade 11 and Grade 12 are Senior High. */
export const isShsYear = (year) => {
  const value = String(year ?? '');
  return value.includes('Grade 11') || value.includes('Grade 12');
};

/** True when any of the given year values is Senior High. */
export const isShsAny = (...years) => years.some((year) => isShsYear(year));

/** The periods a class is marked on. */
export const periodsFor = (...years) => (isShsAny(...years) ? SHS_PERIODS : COLLEGE_PERIODS);

/**
 * The final grade: the mean of the periods that class actually uses, rounded.
 * Null until every one of them has been marked.
 */
export const computeFinalGrade = (grade, ...years) => {
  const periods = periodsFor(...years);
  const values = periods.map((period) => grade?.[period.key]);

  if (values.some((value) => value === null || value === undefined || value === '')) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + parseFloat(value), 0);
  return Math.round(total / periods.length);
};

/**
 * A grade row reduced to the values that get saved.
 *
 * Used to tell whether what is on screen still matches what the server holds.
 * Compared rather than tracked with a dirty flag, so typing a mark and then
 * typing it back does not leave the page insisting there is something to save.
 */
export const gradeSignature = (grades) => [
  ...COLLEGE_PERIODS.map((period) => grades?.[period.key]),
  grades?.status,
]
  .map((value) => (value === null || value === undefined || value === '' ? '' : String(value)))
  .join('|');

/** Whether any period has actually been marked. */
export const hasAnyMark = (grades) =>
  COLLEGE_PERIODS.some((period) => {
    const value = grades?.[period.key];
    return value !== null && value !== undefined && value !== '';
  });

/**
 * Statuses a person sets deliberately, which are kept rather than recomputed
 * from the marks. Mirrors Grade::MANUAL_REMARKS on the server — the two lists
 * have to agree, or a sheet prints something the record does not say.
 */
export const MANUAL_REMARKS = ['INC', 'NFE', 'NFR', 'DA', 'Credited'];

/** The suffix every clearance-held remark carries. */
export const NOT_CLEARED = '(NOT CLEARED)';

/**
 * What a grade held for an unsigned clearance prints as when the result it
 * earned is not known — the fallback, not the usual case.
 *
 * Spelt out rather than left at a bare INC: whoever reads the sheet needs to
 * know it is the clearance holding it back and not an unfinished requirement.
 */
export const CLEARANCE_REMARK = `INC ${NOT_CLEARED}`;

/** Whether this grade reads INC only because the clearance is unsigned. */
export const isClearanceHeld = (grades) => Boolean(grades?.clearance_hold);

/** Whether a printed remark is one the clearance is holding back. */
export const isHeldRemark = (remark) => String(remark ?? '').endsWith(NOT_CLEARED);

/**
 * What a held grade prints as: the result it earned, and the reason it is not
 * released yet.
 *
 * A bare INC on a grade that already scored 5.0 reads as though finishing a
 * requirement could still save it. The result is already decided — only its
 * release is waiting — so the sheet says both.
 */
export const heldRemark = (grades) => {
  const earned = String(grades?.held_status ?? '').toUpperCase();

  return earned === 'PASSED' || earned === 'FAILED'
    ? `${earned} ${NOT_CLEARED}`
    : CLEARANCE_REMARK;
};

/** A subject nobody sat any part of. */
export const DROPPED = 'DROPPED';

/**
 * Whether every period this class is marked on came in at zero — all four
 * college periods, or all three Senior High terms.
 *
 * An unmarked period does not count: a blank is a mark nobody has entered
 * yet, and reading it as a zero would drop students mid-semester.
 */
export const isAllZero = (grades, ...years) =>
  periodsFor(...years).every((period) => {
    const value = grades?.[period.key];

    if (value === null || value === undefined || value === '') return false;

    return parseFloat(value) === 0;
  });

/** Whether the remark was chosen by a person rather than derived from marks. */
export const hasManualRemark = (grades) =>
  MANUAL_REMARKS.includes(grades?.status) && !isClearanceHeld(grades);

/**
 * The remark for a grade: what the record says, not what the marks imply.
 *
 * The order matters. Deriving PASSED/FAILED from the final grade and letting
 * it overwrite the saved status — which is what three separate exports used
 * to do — prints PASSED over a deliberate INC, NFE or DA, and over a result
 * the clearance is holding back.
 *
 * A remark somebody chose comes first, because a person deciding beats any
 * rule. Then a dropped subject: zero in every period is nobody turning up,
 * and there is no result to pass, fail or withhold behind a clearance.
 */
export const remarksFor = (grades, ...years) => {
  if (hasManualRemark(grades)) {
    return grades.status;
  }

  if (isAllZero(grades, ...years)) {
    return DROPPED;
  }

  if (isClearanceHeld(grades)) {
    return heldRemark(grades);
  }

  const final = computeFinalGrade(grades, ...years);

  // Nothing to derive from yet, so whatever the record says stands
  if (final === null) {
    return grades?.status || '';
  }

  return Math.round(final) >= 75 ? 'PASSED' : 'FAILED';
};
