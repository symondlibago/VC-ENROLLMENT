import { saveAs } from 'file-saver';
import {
  createDocxBlob, para, table, image, imageRun, watermark, field, spacer,
} from './docx';
import { HOME_SCHOOL } from './tor';

/**
 * Official Transcript of Records (VIPC-RO-07), laid out the way the registrar's
 * master copy is: letterhead and page number on every page, the college seal
 * washed out behind the text, and the grading system, certification and four
 * signatures repeating in the footer.
 *
 * The parts that may never vary — the certification wording, the signatories,
 * the form code — are constants here, not inputs.
 */

// ─── fixed text ─────────────────────────────────────────────────────────────

const SIGNATORIES = [
  { role: 'Prepared by:', name: 'ARCHIE MAY L. MANANGKILA', title: 'Registrar' },
  { role: 'Checked by:', name: 'ESTEPHANIE E. TRIGUEROS', title: 'Cashier' },
  { role: 'Verified by:', name: 'JONAS D. GAMBA, MBA', title: 'Operations Officer' },
  { role: 'Certified Correct:', name: 'KRISTIANE ANTON P. PADILLA', title: 'School President' },
];

const CERTIFICATION_OPENING = 'I hereby certify that the foregoing records of ';
const CERTIFICATION_CLOSING =
  ' has been verified by me, and that the true copies of the official records ' +
  'substantiating the same are kept in the files of the College. I also certify ' +
  'that this student has enrolled in this college.';

const FORM_CODE = 'VIPC – RO - 07';
const REVISION = 'Revision Code: 1';
const ISSUE_DATE = 'Issue date: February 2009';
const SEAL_NOTE = 'NOT VALID WITHOUT COLLEGE SEAL';

const BIO_FIELDS = [
  ['NAME', 'name'],
  ['ADDRESS', 'address'],
  ['GENDER', 'gender'],
  ['CIVIL STATUS', 'civil_status'],
  ['DATE OF BIRTH', 'birth_date'],
  ['PLACE OF BIRTH', 'birth_place'],
  ['DATE OF ADMISSION', 'date_of_admission'],
  ['ADMISSION CREDENTIAL', 'admission_credential'],
  ['STUDENT NUMBER', 'student_id_number'],
];

// ─── measurements ───────────────────────────────────────────────────────────

// Long bond is 8.5in wide; half-inch side margins leave 10,800 twips of text.
const PAGE_W = 12240;
const SIDE_MARGIN = 720;
const CONTENT_W = PAGE_W - SIDE_MARGIN * 2;

/**
 * How far the letterhead and the address bar sit from the page edges, in twips
 * (1,440 to the inch). Readers clamp a header to whichever of `header` and
 * `top` is smaller, so these are set outright rather than left to fall out of
 * the body margin the way the hand-made original does.
 */
const HEADER_FROM_EDGE = 158; // 0.11in — the banner nearly touches the edge
const FOOTER_FROM_EDGE = 158; // 0.11in — and the address bar mirrors it

/**
 * Space set aside for the header and footer. Both blocks are a fixed height,
 * so these are measured rather than guessed: the header runs from the top edge
 * down to the rule under the student's name row, and the footer from the
 * grading system down to the address bar.
 */
const HEADER_RESERVE = 2950; // 2.05in
const FOOTER_RESERVE = 5850; // 4.06in

const BIO_W = [2700, 2650, 300, 5150];
const PRELIM_W = [2305, 264, 3519, 231, 2528, 264, 1689];
const RECORD_W = [1245, 7006, 795, 789, 965];
const SIGN_W = [2910, 318, 247, 2065, 1665, 263, 438, 2894];

// EMU, taken straight off the master copy. 1 inch = 914,400; 1 twip = 635.
const PHOTO = { cx: 1619250, cy: 1618615 };
const GRADING_SYSTEM = { cx: 4166235, cy: 959485 };

/**
 * The letterhead and the address bar run wider than the text column, right out
 * to the same 0.11in the letterhead sits from the top edge. A negative indent
 * pulls them past the body margin; without it an 8.3in banner simply spills off
 * the right-hand side of a 7.5in column.
 */
const BANNER_W = PAGE_W - HEADER_FROM_EDGE * 2;       // twips, edge to edge
const BLEED = {
  left: HEADER_FROM_EDGE - SIDE_MARGIN,
  right: HEADER_FROM_EDGE - SIDE_MARGIN,
};

/** Re-sizes an image to an exact width in twips, keeping its aspect ratio. */
const scaleTo = (cx, cy, widthTwips) => ({
  cx: widthTwips * 635,
  cy: Math.round((cy * widthTwips * 635) / cx),
});

const LETTERHEAD = scaleTo(7593330, 609600, BANNER_W);
const FOOTER_BAR = scaleTo(7620000, 514350, BANNER_W);

const SZ = { body: 20, small: 18, tiny: 14, title: 24, heading: 24, seal: 16 };
const ARIAL = 'Arial';

const REL = {
  letterhead: 'rIdLetterhead',
  seal: 'rIdSeal',
  grading: 'rIdGrading',
  footerBar: 'rIdFooterBar',
  photo: 'rIdPhoto',
};

// ─── assets ─────────────────────────────────────────────────────────────────

const FIXED_ASSETS = [
  { id: REL.letterhead, name: 'letterhead.jpg', ext: 'jpg', url: '/tor/letterhead.jpg' },
  // Already faded on disk: Word's own washout is a VML setting that Google
  // Docs ignores, so the seal is baked pale instead of faded at render time.
  { id: REL.seal, name: 'seal.png', ext: 'png', url: '/tor/seal-watermark.png' },
  { id: REL.grading, name: 'grading-system.png', ext: 'png', url: '/tor/grading-system.png' },
  { id: REL.footerBar, name: 'footer-bar.jpg', ext: 'jpg', url: '/tor/footer-bar.jpg' },
];

let assetsPromise = null;

async function fetchBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** The letterhead, seal, grading table and footer bar: fetched once per session. */
function loadFixedAssets() {
  assetsPromise ??= Promise.all(
    FIXED_ASSETS.map(async (asset) => ({ ...asset, data: await fetchBytes(asset.url) }))
  ).catch((error) => {
    assetsPromise = null; // let a later attempt retry
    throw error;
  });
  return assetsPromise;
}

// ─── small builders ─────────────────────────────────────────────────────────

const blank = (size = SZ.body) => para('', { size, spacingAfter: 0 });

/** A full-width row of a borderless table, used for headings and notes. */
const fullRow = (cell, columns) => [{ ...cell, span: columns }];

const text = (value) => String(value ?? '');

// ─── header ─────────────────────────────────────────────────────────────────

/**
 * Letterhead, office line with the page number, the document title, and — on
 * every page after the first — the student's name and number.
 */
function buildHeader({ student, withNameRow }) {
  const titleRows = [
    [{
      text: 'OFFICIAL TRANSCRIPT OF RECORDS',
      bold: true, align: 'center', size: SZ.title, font: ARIAL,
      // Rules above and below the title, as on the master copy.
      borders: { top: 24, bottom: 18 },
    }],
  ];

  if (withNameRow) {
    titleRows.push([{
      borders: { top: 18, bottom: 18 },
      content: para([
        { text: 'Name of student:    ', bold: true, size: SZ.title, font: ARIAL },
        { text: text(student.name), bold: true, size: SZ.title, font: ARIAL },
        { text: '\t' },
        { text: 'Student No.:   ', bold: true, size: SZ.title, font: ARIAL },
        { text: text(student.student_id_number), bold: true, size: SZ.title, font: ARIAL },
      ], { tabs: [{ pos: 6600, val: 'left' }], spacingAfter: 0, size: SZ.title, font: ARIAL }),
    }]);
  }

  titleRows.push([{ text: '', size: SZ.title, borders: { top: 18, bottom: false } }]);

  return (
    image(REL.letterhead, { ...LETTERHEAD, name: 'Letterhead', spacingAfter: 0, indent: BLEED }) +
    blank(SZ.small) +
    para([
      { text: '\t' },
      { text: 'OFFICE OF THE REGISTRAR', bold: true, size: SZ.small, font: ARIAL },
      { text: '\t' },
      { text: 'Page ', bold: true, size: SZ.small, font: ARIAL },
      { ...field('PAGE'), bold: true, size: SZ.small, font: ARIAL },
      { text: ' of ', bold: true, size: SZ.small, font: ARIAL },
      { ...field('NUMPAGES'), bold: true, size: SZ.small, font: ARIAL },
    ], {
      tabs: [{ pos: CONTENT_W / 2, val: 'center' }, { pos: CONTENT_W, val: 'right' }],
      spacingAfter: 0, size: SZ.small, font: ARIAL,
    }) +
    table(titleRows, {
      widths: [CONTENT_W], borders: false, fontSize: SZ.title, vMargin: 0, hMargin: 0,
    }) +
    // The seal sits behind the whole page, so it belongs to the header.
    watermark(REL.seal, { title: 'College seal' })
  );
}

// ─── footer ─────────────────────────────────────────────────────────────────

/**
 * Grading system, the certification paragraph naming the student, the four
 * signatories, the form code and the address bar — identical on every page.
 */
function buildFooter(student) {
  // The four signature columns share one grid; the middle two span three
  // columns each so the block lines up with the form-code row below it.
  const SPANS = [1, 3, 3, 1];
  const signatureRow = (key, style = {}) =>
    SIGNATORIES.map((signatory, i) => ({ text: signatory[key], span: SPANS[i], ...style }));
  const emptyRow = () => SIGNATORIES.map((_, i) => ({ text: '', span: SPANS[i] }));

  const rows = [
    fullRow({
      content:
        image(REL.grading, { ...GRADING_SYSTEM, align: 'left', name: 'Grading system', spacingAfter: 0 }) +
        para(SEAL_NOTE, { size: SZ.seal, spacingAfter: 0 }),
    }, 8),
    fullRow({ text: 'C E R T I F I C A T I O N', bold: true, align: 'center' }, 8),
    fullRow({
      content: para([
        { text: '                    ' },
        { text: CERTIFICATION_OPENING },
        { text: text(student.name), bold: true },
        { text: CERTIFICATION_CLOSING },
      ], { align: 'both', size: SZ.body, spacingAfter: 0 }),
    }, 8),
    emptyRow(),
    signatureRow('role'),
    // Room for a wet signature above each printed name.
    emptyRow(),
    emptyRow(),
    emptyRow(),
    signatureRow('name', { bold: true, align: 'center' }),
    signatureRow('title', { align: 'center' }),
    emptyRow(),
    [
      { text: FORM_CODE, size: SZ.tiny },
      { text: '', span: 2 },
      // The rule the issuance date is written on.
      { text: '', span: 2, borders: { bottom: 8 } },
      { text: '', span: 2 },
      { text: REVISION, size: SZ.tiny },
    ],
    [
      { text: '', size: SZ.tiny },
      { text: '', span: 1 },
      { text: 'Date of Issuance', span: 4, align: 'center', size: SZ.small },
      { text: '', span: 1 },
      { text: ISSUE_DATE, size: SZ.tiny },
    ],
  ];

  return (
    table(rows, { widths: SIGN_W, borders: false, fontSize: SZ.body, vMargin: 0, hMargin: 0 }) +
    image(REL.footerBar, { ...FOOTER_BAR, name: 'Address bar', spacingAfter: 0, indent: BLEED })
  );
}

// ─── body ───────────────────────────────────────────────────────────────────

/** Photo on the left, then label : value down the right. */
function buildBio(student, hasPhoto) {
  const rows = BIO_FIELDS.map(([label, key], index) => [
    index === 0
      ? {
          vMerge: 'restart',
          vAlign: 'top',
          content: hasPhoto
            ? `<w:p><w:pPr><w:spacing w:after="0"/><w:jc w:val="center"/></w:pPr>${imageRun(REL.photo, { ...PHOTO, name: 'Student photo' })}</w:p>`
            : para('', { size: SZ.body, spacingAfter: 0 }),
        }
      : { vMerge: 'continue', text: '' },
    { text: label, size: SZ.title, vAlign: 'top' },
    { text: ':', align: 'center', size: SZ.body, vAlign: 'top' },
    // The name is set in capitals here and title case everywhere else.
    { text: text(student[key]), bold: index === 0, caps: index === 0, size: SZ.body, vAlign: 'top' },
  ]);

  return table(rows, {
    widths: BIO_W, borders: false, fontSize: SZ.body, vMargin: 0, hMargin: 0,
  });
}

/** Schools attended before college, then the title and graduation date. */
function buildPreliminary(student, preliminary) {
  const headerRow = [
    { text: 'COMPLETED', bold: true, size: SZ.body },
    { text: '', size: SZ.body },
    { text: 'NAME OF SCHOOL', bold: true, align: 'center', size: SZ.body },
    { text: '', size: SZ.body },
    { text: 'ADDRESS', bold: true, align: 'center', size: SZ.body },
    { text: '', size: SZ.body },
    { text: 'YEAR COMPLETED', bold: true, align: 'center', size: SZ.body },
  ];

  const schoolRows = preliminary
    .filter((row) => row.label?.trim() || row.school?.trim())
    .map((row) => [
      { text: text(row.label), size: SZ.body },
      { text: ':', size: SZ.body },
      { text: text(row.school), size: SZ.body },
      { text: '', size: SZ.body },
      { text: text(row.address), align: 'center', size: SZ.body },
      { text: '', size: SZ.body },
      { text: text(row.year_completed), align: 'center', size: SZ.body },
    ]);

  const titleLines = [
    { text: text(student.candidate_for_title), bold: true, size: SZ.body },
    ...(student.major?.trim() ? [{ text: `\n${student.major}`, bold: true, size: SZ.body }] : []),
  ];

  return table([
    headerRow,
    ...schoolRows,
    [
      { text: 'Candidate for the Title', size: SZ.body, borders: { top: 4, bottom: 4 } },
      { text: ':', size: SZ.body, borders: { top: 4, bottom: 4 } },
      {
        span: 5,
        borders: { top: 4, bottom: 4 },
        content: para(titleLines, { size: SZ.body, spacingAfter: 0 }),
      },
    ],
    [
      { text: ' Date of Graduation', size: SZ.body, borders: { bottom: 4 } },
      { text: ':', size: SZ.body, borders: { bottom: 4 } },
      { text: text(student.date_of_graduation), span: 5, size: SZ.body, borders: { bottom: 4 } },
    ],
  ], { widths: PRELIM_W, borders: false, fontSize: SZ.body, vMargin: 0, hMargin: 0 });
}

/**
 * Every school, programme and term, in order. A school heading is dropped when
 * it repeats, so a change of programme within the same college reads the way
 * it does on the master copy.
 */
function buildCollegiateRecord({ sections, remarks, purpose, closing }) {
  const columns = RECORD_W.length;
  const boxed = { top: 2, left: 2, bottom: 4, right: 2 };

  const rows = [
    fullRow({ text: 'C O L L E G I A T E   R E C O R D', bold: true, align: 'center', font: ARIAL }, columns),
    [
      { text: 'Subject Code', bold: true, borders: boxed },
      { text: 'Descriptive Title', bold: true, align: 'center', borders: boxed },
      { text: 'Final Grade', bold: true, align: 'center', borders: boxed },
      { text: 'Re-exam', bold: true, align: 'center', borders: boxed },
      { text: 'Credits', bold: true, align: 'center', borders: boxed },
    ],
  ];

  let lastSchool = null;
  for (const section of sections) {
    const school = section.school?.trim();
    const program = section.program?.trim();
    const major = section.major?.trim();

    // Headings keep with what follows them, so a school or a semester is
    // never left stranded at the foot of a page.
    const heading = (text, align) =>
      fullRow({ text, bold: true, underline: true, align, keepNext: true }, columns);

    if (school && school !== lastSchool) {
      rows.push(heading(school, 'center'));
      lastSchool = school;
    }
    if (program) rows.push(heading(program, 'center'));
    if (major) rows.push(heading(major, 'center'));

    for (const term of section.terms) {
      const subjects = term.rows.filter((row) => row.code?.trim() || row.title?.trim());
      if (term.label?.trim()) rows.push(heading(term.label, 'left'));
      for (const row of subjects) {
        rows.push([
          { text: text(row.code) },
          { text: text(row.title) },
          { text: text(row.grade), align: 'center' },
          { text: text(row.reexam), align: 'center' },
          { text: text(row.credits), align: 'center' },
        ]);
      }
    }
  }

  if (closing?.trim()) {
    rows.push(fullRow({ text: closing }, columns));
  }

  const notes = [];
  if (remarks?.trim()) {
    notes.push(blank());
    notes.push(para(`REMARKS: ${remarks.trim()}`, {
      bold: true, align: 'center', size: SZ.body, spacingAfter: 0,
    }));
  }
  if (purpose?.trim()) {
    notes.push(blank(SZ.small), blank(SZ.small));
    notes.push(para(`PURPOSE: ${purpose.trim()}`, {
      bold: true, size: SZ.small, font: ARIAL, spacingAfter: 0,
    }));
  }
  if (notes.length) {
    rows.push(fullRow({ content: notes.join('') }, columns));
  }

  return table(rows, { widths: RECORD_W, borders: false, fontSize: SZ.body, vMargin: 0, hMargin: 60 });
}

// ─── assembly ───────────────────────────────────────────────────────────────

/**
 * Builds the .docx.
 * `photo` is { data: Uint8Array, ext: 'png' | 'jpg' } or null — it is never
 * uploaded or stored, only carried into the document.
 */
export async function buildTranscriptBlob(tor, photo = null) {
  const fixed = await loadFixedAssets();
  const images = fixed.map(({ id, name, ext, data }) => ({ id, name, ext, data }));

  if (photo?.data) {
    images.push({ id: REL.photo, name: `photo.${photo.ext}`, ext: photo.ext, data: photo.data });
  }

  const { student } = tor;

  const body =
    buildBio(student, Boolean(photo?.data)) +
    // The heavy rule that closes the personal details.
    para('', { size: SZ.body, spacingAfter: 0, borders: { top: 18 } }) +
    para('RECORD OF PRELIMINARY EDUCATION', {
      bold: true, align: 'center', size: SZ.title, font: ARIAL, spacingAfter: 0,
    }) +
    buildPreliminary(student, tor.preliminary) +
    blank(SZ.body) +
    buildCollegiateRecord(tor) +
    spacer();

  return createDocxBlob(body, {
    paper: 'folio',
    defaultFont: 'Calibri',
    // The header and footer are tall and fixed, so the body is given margins
    // that clear them outright. Word quietly pushes text out of an oversized
    // header's way; other readers do not, and the first row ends up hidden
    // behind the letterhead.
    margins: {
      top: HEADER_RESERVE, bottom: FOOTER_RESERVE,
      left: SIDE_MARGIN, right: SIDE_MARGIN,
      header: HEADER_FROM_EDGE, footer: FOOTER_FROM_EDGE,
    },
    images,
    headers: {
      first: buildHeader({ student, withNameRow: false }),
      default: buildHeader({ student, withNameRow: true }),
    },
    footers: {
      first: buildFooter(student),
      default: buildFooter(student),
    },
  });
}

/** Builds the transcript and hands it to the browser as a download. */
export async function downloadTranscriptDocx(tor, photo = null, fileName) {
  const blob = await buildTranscriptBlob(tor, photo);
  const safe = (fileName || `TOR - ${tor.student.name || 'Student'}`).replace(/[\\/:*?"<>|]/g, '-');
  saveAs(blob, `${safe}.docx`);
}

export { HOME_SCHOOL };
