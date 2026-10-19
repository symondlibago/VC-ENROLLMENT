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
