/**
 * The grade slip as an editable Word document.
 *
 * Same sheet, same wording and the same order as the printed slip — the
 * difference is that this one can be corrected before it is handed over, which
 * is the whole reason the office asked for it. The PDF stays the one that
 * prints; this is the one that gets typed into.
 *
 * Laid out by flowing tables rather than the PDF's absolute millimetres,
 * because a Word document that cannot reflow is a Word document nobody can
 * edit. The sheet size matches, so a page of it still prints on the cut half.
 */

import { saveAs } from 'file-saver';
import { createDocxBlob, para, table, imageRun } from './docx';
import {
  SLIP_WIDTH, GRADING_SYSTEM, SCHOOL_LINES, PREPARED_BY, APPROVED_BY, slipDate,
} from './gradeSlip';
import circleLogo from '../assets/circlelogo.jpg';
import genSignature from '../assets/gensig.png';
import regSignature from '../assets/regsig.png';

const MONO = 'Courier New';

/** 8.5in less a 0.315in margin either side, in twips. */
const CONTENT_W = 12240 - 908;

/** The four subject columns, in the printed slip's proportions. */
const COLUMN_SHARES = [0.355, 0.185, 0.19, 0.27];
const COLUMN_W = (() => {
  const total = COLUMN_SHARES.reduce((sum, share) => sum + share, 0);
  const widths = COLUMN_SHARES.map((share) => Math.round((share / total) * CONTENT_W));

  // Rounding has to land exactly on the content width or Word draws a table
  // a hair narrower than the rest of the page.
  widths[widths.length - 1] += CONTENT_W - widths.reduce((sum, w) => sum + w, 0);

  return widths;
})();

/** The info box splits where the paper splits it. */
const INFO_W = [Math.round(CONTENT_W * 0.555), 0];
INFO_W[1] = CONTENT_W - INFO_W[0];

/**
 * The grading reference's five columns, taken from where the slip prints them
 * (0, 26, 52, 78 and 106 mm across a 199.9 mm sheet) so the key reads at the
 * same widths it does on paper.
 */
const LEGEND_W = (() => {
  const stops = [0, 26, 52, 78, 106, 199.9 - 16];
  const widths = stops.slice(1).map((stop, i) => Math.round(((stop - stops[i]) / (SLIP_WIDTH - 16)) * CONTENT_W));

  widths[widths.length - 1] += CONTENT_W - widths.reduce((sum, w) => sum + w, 0);

  return widths;
})();

const SIZE = { head: 13, school: 11, title: 21, info: 15, cell: 15, small: 13, legend: 14 };

const LOGO_REL = 'rIdSlipLogo';
const PREPARED_REL = 'rIdSlipPrepared';
const APPROVED_REL = 'rIdSlipApproved';

/** 1 mm = 36000 EMU. */
const mm = (value) => Math.round(value * 36000);

const bytesOf = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    return new Uint8Array(await res.arrayBuffer());
  } catch {
    // A slip without its letterhead is still a slip; one that throws is not.
    return null;
  }
};

const text = (value) => String(value ?? '').trim();

/** Letterhead: the seal beside the school's name and address. */
const header = (hasLogo) => {
  const lines = SCHOOL_LINES.map((line, index) => para(line, {
    align: 'center',
    font: MONO,
    size: index === 0 ? SIZE.head : SIZE.school,
    bold: index === 0,
    spacingAfter: 0,
  })).join('');

  const block = table([[
    {
      content: hasLogo
        ? para([{ raw: imageRun(LOGO_REL, { cx: mm(17), cy: mm(17), name: 'Seal' }) }], { align: 'center', spacingAfter: 0 })
        : para('', { spacingAfter: 0 }),
      vAlign: 'center',
    },
    { content: lines, vAlign: 'center' },
  ]], {
    widths: [mmToTwips(21), CONTENT_W - mmToTwips(21)],
    borders: false,
    hMargin: 0,
    vMargin: 0,
  });

  return block + para('GRADE SLIP', {
    align: 'center', font: MONO, bold: true, size: SIZE.title, spacingBefore: 60, spacingAfter: 80,
  });
};

/** 1 mm = 56.6929 twips. */
function mmToTwips(value) {
  return Math.round(value * 56.6929);
}

/** A label in bold with its value beside it, the way the box prints them. */
const labelled = (label, value) => para(
  [
    { text: `${label} `, bold: true, font: MONO, size: SIZE.info },
    { text: text(value), font: MONO, size: SIZE.info },
  ],
  { spacingAfter: 0, font: MONO, size: SIZE.info },
);

const infoBox = ({ studentId, name, term, courseAndYear }) => table([
  [
    { content: labelled('Students ID:', studentId) },
    { content: labelled('School Year and Sem:', term) },
  ],
  [
    { content: labelled('Name:', name) },
    { content: labelled('Course and Year:', courseAndYear) },
  ],
], { widths: INFO_W, borderSize: 6, vMargin: 40, hMargin: 80 });

const subjectTable = (rows, unitsTotal) => {
  const head = ['Subject Code', 'Final Grade', 'Units', 'Remarks'].map((label) => ({
    text: label, bold: true, align: 'center', font: MONO, size: SIZE.cell,
  }));

  const body = rows.map((row) => [
    { text: text(row.code), align: 'center', font: MONO, size: SIZE.cell },
    { text: text(row.grade), align: 'center', font: MONO, size: SIZE.cell },
    { text: text(row.units), align: 'center', font: MONO, size: SIZE.cell },
    { text: text(row.remarks), align: 'center', font: MONO, size: SIZE.cell },
  ]);

  // Two blank lines, as the paper carries, so nothing can be added after the
  // last subject without it showing.
  const blanks = [0, 1].map(() => COLUMN_W.map(() => ({ text: '', font: MONO, size: SIZE.cell })));

  const units = unitsTotal ?? rows.reduce((sum, row) => sum + (parseFloat(row.units) || 0), 0);

  const total = [
    { text: '', font: MONO, size: SIZE.cell },
    { text: 'TOTAL UNIT(s)', bold: true, align: 'center', font: MONO, size: SIZE.cell },
    { text: units ? String(units) : '', bold: true, align: 'center', font: MONO, size: SIZE.cell },
    { text: '', font: MONO, size: SIZE.cell },
  ];

  return table([{ cells: head, header: true }, ...body, ...blanks, total], {
    widths: COLUMN_W, borderSize: 6, vMargin: 30, hMargin: 60,
  });
};

const legend = () => para('GRADING SYSTEM:', {
  font: MONO, bold: true, size: SIZE.legend, spacingBefore: 80, spacingAfter: 40,
}) + table(
  GRADING_SYSTEM.map((row) => row.map((cell) => ({
    text: cell, bold: true, font: MONO, size: SIZE.legend,
  }))),
  { widths: LEGEND_W, borders: false, vMargin: 0, hMargin: 0 },
);

const signatures = (marks) => {
  const block = (label, who, relId, mark) => {
    const scan = mark && relId
      ? para([{ raw: imageRun(relId, { ...fit(mark), name: label }) }], { align: 'center', spacingAfter: 0 })
      : para('', { spacingAfter: 0, size: SIZE.small });

    return [
      para(label, { font: MONO, bold: true, size: SIZE.small, spacingAfter: 0 }),
      scan,
      // The rule the signature sits across, drawn whether or not a scan landed
      para('', {
        spacingAfter: 0, size: 2, borders: { bottom: 6, color: '000000' },
      }),
      para(who.name, { align: 'center', font: MONO, bold: true, size: SIZE.small, spacingBefore: 40, spacingAfter: 0 }),
      para(who.title, { align: 'center', font: MONO, bold: true, size: 11, color: '5A5A5A', spacingAfter: 0 }),
    ].join('');
  };

  return table([[
    { content: block('PREPARED BY:', PREPARED_BY, PREPARED_REL, marks.prepared), vAlign: 'bottom' },
    { content: block('APPROVED BY:', APPROVED_BY, APPROVED_REL, marks.approved), vAlign: 'bottom' },
  ]], {
    widths: [Math.round(CONTENT_W / 2), CONTENT_W - Math.round(CONTENT_W / 2)],
    borders: false,
    hMargin: 160,
    vMargin: 0,
  });
};

/**
 * Sizes a scanned signature to the slip's 12.5 mm tall, 46 mm wide box,
 * fitted to whichever runs out first so neither scan is stretched.
 */
const fit = ({ width, height }) => {
  const ratio = (width || 1) / (height || 1);
  let h = 12.5;
  let w = h * ratio;

  if (w > 46) {
    w = 46;
    h = w / ratio;
  }

  return { cx: mm(w), cy: mm(h) };
};

/** Measures a bundled image without decoding it twice. */
const measure = (src) =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
    image.onerror = () => resolve(null);
    image.src = src;
  });

/**
 * Builds and downloads the slip as .docx.
 *
 * Takes the same arguments the PDF does, so the two cannot drift apart: give
 * it the rows the modal is showing and both come out saying the same thing.
 */
export const downloadGradeSlipDocx = async ({
  student = {},
  rows = [],
  term = '',
  releasedOn = new Date(),
  fileName = 'Grade_Slip',
  unitsTotal = null,
} = {}) => {
  const [logoBytes, preparedBytes, approvedBytes, preparedSize, approvedSize] = await Promise.all([
    bytesOf(circleLogo),
    bytesOf(genSignature),
    bytesOf(regSignature),
    measure(genSignature),
    measure(regSignature),
  ]);

  const images = [
    logoBytes && { id: LOGO_REL, name: 'seal.jpg', ext: 'jpg', data: logoBytes },
    preparedBytes && { id: PREPARED_REL, name: 'prepared.png', ext: 'png', data: preparedBytes },
    approvedBytes && { id: APPROVED_REL, name: 'approved.png', ext: 'png', data: approvedBytes },
  ].filter(Boolean);

  const courseAndYear = [student.courseCode || student.course, student.year]
    .map(text)
    .filter(Boolean)
    .join(' ');

  const body = [
    header(!!logoBytes),
    infoBox({ studentId: student.studentId, name: student.name, term, courseAndYear }),
    para('', { spacingAfter: 40, size: 2 }),
    subjectTable(rows, unitsTotal),
    para('*******************NOTHING FOLLOWS****************', {
      align: 'center', font: MONO, bold: true, size: SIZE.info, spacingBefore: 60, spacingAfter: 60,
    }),
    para([
      { text: 'NOTE: For School Purposes Only', bold: true, italic: true, font: MONO, size: SIZE.small, highlight: 'yellow' },
      { text: '\t' },
      { text: `Date Released: ${slipDate(releasedOn)}`, bold: true, font: MONO, size: SIZE.small },
    ], {
      spacingAfter: 0,
      tabs: [{ pos: CONTENT_W - 2400, val: 'left' }],
    }),
    legend(),
    para('', { spacingAfter: 60, size: 2 }),
    signatures({
      prepared: preparedBytes && preparedSize,
      approved: approvedBytes && approvedSize,
    }),
  ].join('');

  const blob = createDocxBlob(body, {
    paper: 'halfLetter',
    images,
    margins: { top: 340, right: 454, bottom: 227, left: 454, header: 170, footer: 170 },
  });

  saveAs(blob, fileName.endsWith('.docx') ? fileName : `${fileName}.docx`);
};
