/**
 * The one place the credential request vocabulary lives: what can be requested,
 * why, the desks it passes and how each status reads. Adding a credential type
 * or a purpose here (and in CredentialRequest.php) is all a new option needs.
 */

/** The credential lines, in the order the printed form lists them. */
export const CREDENTIAL_ROWS = [
  ['honorable_dismissal', 'Honorable Dismissal'],
  ['certification_of_enrollment', 'Certification of Enrollment'],
  ['certification_of_completion', 'Certification of Completion'],
  ['certification_of_units_earned', 'Certification of Units Earned'],
  ['transcript_of_records', 'Official Transcript of Records'],
  ['good_moral', 'Certificate of Good Moral'],
  ['diploma', 'Diploma'],
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
