/**
 * The shape of an Official Transcript of Records (VIPC-RO-07), shared by the
 * form that edits one and the generator that prints it.
 *
 * Nothing here is persisted. The registrar pulls a student's record (or types
 * an alumnus's from scratch), corrects it on screen and generates the
 * document; the photo lives in memory only, for as long as the tab is open.
 */

export const HOME_SCHOOL = 'VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE – Cagayan de Oro City';

/** Row labels seen on real transcripts, old curriculum and K-12 alike. */
export const PRELIMINARY_LABELS = [
  'PRIMARY EDUCATION',
  'ELEMENTARY EDUCATION',
  'JUNIOR HIGH SCHOOL',
  'SENIOR HIGH SCHOOL',
  'SECONDARY EDUCATION',
  'COLLEGE',
  'VOCATIONAL',
];

/** The usual closing remarks, offered as a starting point. */
export const TRANSCRIPT_CLOSED =
  'VIPC*VIPC*VIPC*VIPC*VIPC*VIPC*VIPC*VIPC*VIPC*/TRANSCRIPT CLOSED/VIPC*VIPC*VIPC*VIPC*VIPC*VIPC*VIPC*VIPC';

export const PURPOSES = [
  'FOR REFERENCE PURPOSES ONLY',
  'FOR EMPLOYMENT',
  'FOR FURTHER STUDIES',
  'FOR EVALUATION',
  'FOR SCHOLARSHIP',
  'FOR BOARD EXAMINATION',
];

/** Marks that earn no credit, whatever the subject was worth. */
const NO_CREDIT_MARKS = new Set(['5.0', '5', 'NG', 'DRP', 'DR', 'DA', 'NFE', 'NFR', '-', '']);

let seq = 0;
const uid = () => `r${Date.now().toString(36)}${(seq += 1).toString(36)}`;

export const emptyRow = (overrides = {}) =>
  ({ id: uid(), code: '', title: '', grade: '', reexam: '', credits: '', ...overrides });

export const emptyTerm = (overrides = {}) =>
  ({ id: uid(), label: '', rows: [emptyRow()], ...overrides });

export const emptySection = (overrides = {}) =>
  ({ id: uid(), school: '', program: '', major: '', terms: [emptyTerm()], ...overrides });

export const emptyPreliminary = (overrides = {}) =>
  ({ id: uid(), label: '', school: '', address: '', year_completed: '', ...overrides });

export const EMPTY_STUDENT = {
  pre_enrolled_student_id: null,
  name: '',
  student_id_number: '',
  address: '',
  gender: '',
  civil_status: '',
  birth_date: '',
  birth_place: '',
  date_of_admission: '',
  admission_credential: '',
  candidate_for_title: '',
  major: '',
  date_of_graduation: '',
};

export const emptyTranscript = () => ({
  student: { ...EMPTY_STUDENT },
  preliminary: [emptyPreliminary()],
  sections: [emptySection({ school: HOME_SCHOOL })],
  remarks: '',
  purpose: '',
  closing: TRANSCRIPT_CLOSED,
});

/** Gives every row, term and section the stable key the editor lists them by. */
export const withIds = (payload) => ({
  ...emptyTranscript(),
  ...payload,
  student: { ...EMPTY_STUDENT, ...payload.student },
  preliminary: (payload.preliminary?.length ? payload.preliminary : [{}])
    .map((row) => emptyPreliminary(row)),
  sections: (payload.sections?.length ? payload.sections : [{ school: HOME_SCHOOL }])
    .map((section) => emptySection({
      ...section,
      terms: (section.terms?.length ? section.terms : [{}]).map((term) => emptyTerm({
        ...term,
        rows: (term.rows?.length ? term.rows : [{}]).map((row) => emptyRow(row)),
      })),
    })),
});

/**
 * Is this mark a failure? The equivalent scale runs 1.0 (best) to 5.0, and
 * 3.0 — 75% — is the last passing mark, so 3.1 and below the line fail.
 */
export const isFailingMark = (mark) => {
  const value = String(mark ?? '').trim().toUpperCase();
  if (NO_CREDIT_MARKS.has(value)) return true;
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) return false; // INC and the like: not yet decided
  return numeric > 3.0;
};

/** A re-exam supersedes the original mark. */
export const effectiveMark = (row) =>
  (String(row?.reexam ?? '').trim() || String(row?.grade ?? '').trim());

/**
 * Credits after a grade changes: a failed subject earns none, and a subject
 * that stops failing gives its units back for the registrar to type.
 */
export const creditsAfterGradeChange = (row) => {
  const failed = isFailingMark(effectiveMark(row));
  if (failed) return '0.0';
  return row.credits === '0.0' || row.credits === '0' ? '' : row.credits;
};

/** "urbina, shara blanche e." → "URBINA, Shara Blanche E." */
export const properCaseName = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const [surname, ...rest] = raw.split(',');
  const given = rest.join(',').trim()
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase());
  return rest.length ? `${surname.trim().toUpperCase()}, ${given}` : raw.toUpperCase();
};

/** True when the transcript has nothing worth printing yet. */
export const hasContent = (tor) =>
  Boolean(tor.student.name?.trim()) &&
  tor.sections.some((s) => s.terms.some((t) => t.rows.some((r) => r.code?.trim() || r.title?.trim())));
