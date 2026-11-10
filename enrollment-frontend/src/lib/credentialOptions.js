/**
 * The one place the credential request vocabulary lives: what can be requested,
 * why, the desks it passes and how each status reads. Adding a credential type
 * or a purpose here (and in CredentialRequest.php) is all a new option needs.
 */

/**
 * The credential lines, in the order the printed form lists them.
 *
 * New documents are appended rather than slotted in alphabetically: the form
 * is a paper everyone already reads top to bottom, and reshuffling its rows
 * to make a list tidy moves lines out from under the ticks beside them.
 */
export const CREDENTIAL_ROWS = [
  ['honorable_dismissal', 'Honorable Dismissal'],
  ['certification_of_enrollment', 'Certification of Enrollment'],
  ['certification_of_completion', 'Certification of Completion'],
  ['certification_of_units_earned', 'Certification of Units Earned'],
  ['transcript_of_records', 'Official Transcript of Records'],
  ['good_moral', 'Certificate of Good Moral'],
  ['diploma', 'Diploma'],
  ['certification_of_non_scholarship', 'Certification of Non-Scholarship'],
  ['certification_of_graduation', 'Certification of Graduation'],
  ['certification_of_nstp_serial', 'Certification of NSTP Serial Number'],
  ['certified_true_copy', 'Certified True Copy'],
];

/** Everything selectable in the form, including the free-text "Others". */
export const CREDENTIAL_TYPES = [
  ...CREDENTIAL_ROWS.map(([value, label]) => ({ value, label })),
  { value: 'others', label: 'Others (please specify)' },
];

export const CREDENTIAL_LABELS = Object.fromEntries(
  CREDENTIAL_TYPES.map(({ value, label }) => [value, label])
);

export const PURPOSE_OPTIONS = [
  { value: 'employment', label: 'For Employment' },
  { value: 'enrollment', label: 'For Enrollment' },
  { value: 'reference', label: 'Reference' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'others', label: 'Others (please specify)' },
];

export const PURPOSE_LABELS = Object.fromEntries(
  PURPOSE_OPTIONS.map(({ value, label }) => [value, label])
);

/** Pages a credential can be requested with — the printed form's 1–5 boxes. */
export const PAGE_CHOICES = [1, 2, 3, 4, 5];

/**
 * What the registrar's office charges for each document.
 *
 * `perPage` is multiplied by the pages asked for; `flat` is not, however many
 * pages the line carries. `picture` is the fee for the photograph affixed to
 * the document — charged once for that document, never per page, which is the
 * part the cashier was having to work out by hand.
 *
 * A type with no entry here is priced at the counter: "Others" is whatever was
 * asked for, and nobody can put a number on it in advance.
 *
 * Mirrors CredentialRequest::PRICES on the server. The two have to agree, or
 * the figure quoted on screen is not the one the record is written with.
 */
export const CREDENTIAL_PRICES = {
  honorable_dismissal: { perPage: 150, picture: 50 },
  transcript_of_records: { perPage: 150, picture: 50 },
  certified_true_copy: { perPage: 40 },
  certification_of_completion: { flat: 150 },
  diploma: { flat: 250 },
  good_moral: { flat: 100 },
  certification_of_enrollment: { flat: 100 },
  certification_of_units_earned: { flat: 100 },
  certification_of_non_scholarship: { flat: 100 },
  certification_of_graduation: { flat: 100 },
  certification_of_nstp_serial: { flat: 100 },
};

/** Pages, floored at one: a document is never charged for less than itself. */
const pagesOf = (credential) => {
  const pages = Math.floor(Number(credential?.pages));

  return Number.isFinite(pages) && pages > 0 ? pages : 1;
};

/**
 * What one requested document costs, broken into the lines a receipt shows.
 *
 * `priced` is false for anything the table has no entry for, so a caller can
 * tell "this is free" from "nobody has said what this costs".
 */
export const priceCredential = (credential) => {
  const rule = CREDENTIAL_PRICES[credential?.type];
  const label = credential?.label || CREDENTIAL_LABELS[credential?.type] || 'Credential';

  if (!rule) {
    return { priced: false, total: 0, lines: [{ label, detail: 'priced at the counter', amount: 0 }] };
  }

  const pages = pagesOf(credential);
  const lines = [];
  let total = 0;

  if (rule.perPage) {
    const amount = rule.perPage * pages;
    lines.push({ label, detail: `${pages} page${pages === 1 ? '' : 's'} × ${peso(rule.perPage)}`, amount });
    total += amount;
  } else {
    lines.push({ label, detail: peso(rule.flat), amount: rule.flat });
    total += rule.flat;
  }

  // Once for the document, never once per page
  if (rule.picture) {
    lines.push({ label: `${label} — picture`, detail: 'one photograph', amount: rule.picture });
    total += rule.picture;
  }

  return { priced: true, total, lines };
};

/**
 * The whole request: every line, the total, and whether anything on it still
 * needs a price putting on by hand.
 */
export const priceRequest = (credentials = []) => {
  const lines = [];
  let total = 0;
  let unpriced = 0;

  (credentials || []).forEach((credential) => {
    const priced = priceCredential(credential);
    lines.push(...priced.lines);
    total += priced.total;
    if (!priced.priced) unpriced += 1;
  });

  return { lines, total, unpriced, complete: unpriced === 0 && lines.length > 0 };
};

/** The desks the form is routed through, in order. */
export const STEPS = [
  { key: 'librarian', label: 'Librarian', group: 'clearance' },
  { key: 'laboratory', label: 'Laboratory', group: 'clearance' },
  { key: 'program_head', label: 'Program Head', group: 'clearance' },
  { key: 'cashier', label: 'Cashier', group: 'payment' },
  { key: 'registrar', label: 'Registrar', group: 'release' },
];

export const CLEARANCE_STEPS = STEPS.filter((step) => step.group === 'clearance');

export const STEP_LABELS = Object.fromEntries(STEPS.map(({ key, label }) => [key, label]));

/** Which desk a role signs for; Admin may act for any of them. */
export const ROLE_STEP = {
  Librarian: 'librarian',
  Laboratory: 'laboratory',
  'Program Head': 'program_head',
  Cashier: 'cashier',
  Registrar: 'registrar',
};

export const STATUS_STYLES = {
  pending: { label: 'For Clearance', className: 'bg-amber-100 text-amber-800' },
  awaiting_payment: { label: 'Awaiting Payment', className: 'bg-orange-100 text-orange-800' },
  ready_to_release: { label: 'Ready to Release', className: 'bg-blue-100 text-blue-800' },
  released: { label: 'Released', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600' },
};

export const peso = (value) =>
  `₱${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "October 5, 2026" — the way dates read on the form and the claim stub. */
export const longDate = (value) => {
  if (!value) return '';
  const date = new Date(`${String(value).split(' ')[0]}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};
