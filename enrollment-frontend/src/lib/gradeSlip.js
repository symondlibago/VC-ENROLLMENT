/**
 * The student grade slip: one term's subjects on half a short bond sheet.
 *
 * Drawn by hand rather than flowed, for the same reason the balance slip is:
 * the sheet is a fixed cut of paper, and a table that quietly grows onto a
 * second page gives the office half a grade slip to hand over. The subject
 * rows shrink to fit instead, and only a genuinely long term spills over.
 *
 * Every coordinate is millimetres from the top-left of the cut sheet.
 */

import { getEquivalentGrade } from './gradeEquivalent.js';
import { computeFinalGrade, remarksFor } from './gradingPeriods.js';

/** 8.5in wide by one crosswise half of an 11in sheet. */
export const SLIP_WIDTH = 215.9;
export const SLIP_HEIGHT = 139.7;

const INK = [17, 17, 17];
const MUTED = [90, 90, 90];
const RULE = [40, 40, 40];
const HIGHLIGHT = [255, 242, 0];

/**
 * The slip is typed, not typeset.
 *
 * Courier is jsPDF's built-in monospace, so no font has to be embedded and
 * the file stays small enough to open on the counter PC. It is appreciably
 * wider than Helvetica per character, which is why the sizes below are a
 * shade smaller than they would otherwise be.
 */
const MONO = 'courier';

const LEFT = 8;
const RIGHT = SLIP_WIDTH - 8;
const WIDTH = RIGHT - LEFT;

/** Where the info box splits into its two columns. */
const INFO_SPLIT = LEFT + WIDTH * 0.555;

/** The four table columns, as a share of the printable width. */
const COLUMNS = [
  { key: 'code', header: 'Subject Code', share: 0.355, align: 'center' },
  { key: 'grade', header: 'Final Grade', share: 0.185, align: 'center' },
  { key: 'units', header: 'Units', share: 0.19, align: 'center' },
  { key: 'remarks', header: 'Remarks', share: 0.27, align: 'center' },
];

const SCHOOL = 'VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE';
const ADDRESS = 'Prince Padi Bldg., Antonio Luna St., Mabulay Subdivision';
const CITY = 'Cagayan de Oro City, Philippines 9000';
const TEL = 'Tel. Nos. (088) 856-8646 / (088) 882-1922 / 0917-770-0173';
const EMAIL = 'Email Address: vipccdo07@gmail.com';

/**
 * The conversion table as it is printed at the foot of the slip.
 *
 * Spelt out rather than generated from {@link getEquivalentGrade}: the office
 * prints it as a reference card in five columns, and a generated list would
 * reflow the moment a band changed and stop matching the paper everyone has
 * already been handed.
 */
const GRADING_SYSTEM = [
  ['1.0- 100%', '1.6- 93%', '2.2- 86%', '2.75- 79%', '3.3- 71%'],
  ['1.1- 99%', '1.7- 92%', '2.25- 85%', '2.8- 78%', '3.4- 70%'],
  ['1.2- 98%', '1.75- 91%', '2.3- 84%', '2.9- 77%', '5.0- 69%'],
  ['1.25- 97%', '1.8- 90%', '2.4- 83%', '3.0- 76/75%', 'NFE- NO FINAL EXAM'],
  ['1.3- 96%', '1.9- 89%', '2.5- 82%', '3.1- 74%', 'NFR- NO FINAL REQUIREMENT'],
  ['1.4- 95%', '2.0- 88%', '2.6- 81%', '3.2- 73%', 'INC- INCOMPLETE'],
  ['1.5- 94%', '2.1- 87%', '2.7- 80%', '3.25- 72%', 'DA- DROP DUE TO ABSENCES'],
];

/** Who prepares and who approves, as the paper slip has them. */
export const PREPARED_BY = { name: 'GENELYN M. DUMASIG', title: 'ACADEMIC STAFF' };
export const APPROVED_BY = { name: 'ARCHIE MAY L. MANANGKILA', title: 'REGISTRAR' };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** `December 11, 2025` — the form the slip has always used. */
export const slipDate = (value) => {
  const date = value instanceof Date ? value : new Date(value ?? Date.now());

  if (Number.isNaN(date.getTime())) return '';

  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/** `1st Semester` → `First Semester`, as the header spells it. */
const ORDINALS = {
  '1st': 'First', '2nd': 'Second', '3rd': 'Third',
};

export const semesterInWords = (semester) => {
  const text = String(semester ?? '').trim();

  return text.replace(/^(1st|2nd|3rd)\b/i, (match) => ORDINALS[match.toLowerCase()] ?? match);
};

/**
 * The header's term line: `First Semester, 2025-2026`.
 *
 * Built from whatever the printed rows agree on rather than from a filter, so
 * the heading can never name a term the subjects below it did not come from.
 * Rows carrying no school year are not counted as disagreement — they are
 * simply silent, and the ones that do know speak for them.
 */
export const termParts = (rows = [], chosenYear = '') => {
  const semesters = [...new Set(rows.map((r) => r.semester).filter(Boolean))];
  const years = [...new Set(rows.map((r) => r.school_year).filter(Boolean))];

  return {
    semester: semesters.length === 1 ? semesterInWords(semesters[0]) : '',
    // A year chosen by hand settles it: most rows carry no school year of
    // their own, so left to themselves they print a blank where the term goes
    year: chosenYear || (years.length === 1 ? years[0] : years.sort().join(' / ')),
  };
};

export const termLine = (rows = [], chosenYear = '') => {
  const { semester, year } = termParts(rows, chosenYear);

  return [semester, year].filter(Boolean).join(', ');
};

/**
 * The surname a slip is filed under.
 *
 * Names are held "Surname, Given M." so the part before the comma is the
 * surname; a name stored without one falls back to its first word rather than
 * to the whole string, which would put the given names in the file name too.
 */
export const surnameOf = (name) => {
  const text = String(name ?? '').trim();
  if (!text) return '';

  return (text.includes(',') ? text.split(',')[0] : text.split(/\s+/)[0]).trim();
};

/** One printed row, from a grade as the modal holds it. */
export const slipRow = (grade, studentYear) => {
  const final = computeFinalGrade(grade, studentYear, grade?.year);
  const equivalent = getEquivalentGrade(final);
  const remark = remarksFor(grade, studentYear, grade?.year);

  return {
    code: String(grade?.subject_code ?? '').trim(),
    // The slip prints the 1.0-5.0 equivalent here, not the percentage
    grade: equivalent ?? '',
    // A zero is not a subject worth no units, it is a subject whose units
    // nobody recorded — 177 of the 420 on file have none — so it prints blank
    // rather than claiming the student earned nothing for sitting it
    units: Number(grade?.total_units) > 0 ? String(Number(grade.total_units)) : '',
    remarks: remark || '',
  };
};

const setInk = (doc, [r, g, b]) => doc.setTextColor(r, g, b);

/** Shorten to fit the column, with an ellipsis. Font size must already be set. */
const clip = (doc, text, maxWidth) => {
  const value = String(text ?? '').trim();
  if (!value || doc.getTextWidth(value) <= maxWidth) return value;

  let cut = value;
  while (cut.length > 1 && doc.getTextWidth(`${cut}...`) > maxWidth) {
    cut = cut.slice(0, -1);
  }

  return `${cut.trimEnd()}...`;
};

const cellX = (bounds, index, align) => {
  const { from, to } = bounds[index];

  if (align === 'center') return (from + to) / 2;
  if (align === 'right') return to - 1.5;

  return from + 1.5;
};

/** The left and right edge of each column, scaled to fill the sheet exactly. */
const columnBounds = () => {
  const total = COLUMNS.reduce((sum, column) => sum + column.share, 0);
  let x = LEFT;

  return COLUMNS.map((column) => {
    const from = x;
    x += (column.share / total) * WIDTH;

    return { from, to: x };
  });
};

const drawHeader = (doc, logo) => {
  if (logo) {
    try {
      doc.addImage(logo.data, logo.format, LEFT + 2, 3.5, 17, 17);
    } catch (error) {
      // A missing seal must never cost the slip
      console.error('Grade slip logo could not be drawn', error);
    }
  }

  const middle = SLIP_WIDTH / 2 + 6;

  doc.setFont(MONO, 'bold').setFontSize(11.5);
  setInk(doc, INK);
  doc.text(SCHOOL, middle, 8.5, { align: 'center' });

  doc.setFont(MONO, 'normal').setFontSize(6.6);
  [ADDRESS, CITY, TEL, EMAIL].forEach((line, index) => {
    doc.text(line, middle, 12.4 + index * 3.1, { align: 'center' });
  });

  doc.setFont(MONO, 'bold').setFontSize(10.5);
  doc.text('GRADE SLIP', SLIP_WIDTH / 2, 28.6, { align: 'center' });
};

/** The two-by-two box of who the slip is for and which term it covers. */
const drawInfo = (doc, { studentId, name, term, courseAndYear }) => {
  const top = 31;
  const rowHeight = 5.6;

  doc.setDrawColor(...RULE).setLineWidth(0.25);
  doc.rect(LEFT, top, WIDTH, rowHeight * 2);
  doc.line(LEFT, top + rowHeight, RIGHT, top + rowHeight);
  doc.line(INFO_SPLIT, top, INFO_SPLIT, top + rowHeight * 2);

  const cells = [
    [LEFT + 2, top + 3.9, 'Students ID: ', studentId, INFO_SPLIT - LEFT - 4],
    [INFO_SPLIT + 2, top + 3.9, 'School Year and Sem: ', term, RIGHT - INFO_SPLIT - 4],
    [LEFT + 2, top + rowHeight + 3.9, 'Name: ', name, INFO_SPLIT - LEFT - 4],
    [INFO_SPLIT + 2, top + rowHeight + 3.9, 'Course and Year: ', courseAndYear, RIGHT - INFO_SPLIT - 4],
  ];

  cells.forEach(([x, y, label, value, room]) => {
    doc.setFont(MONO, 'bold').setFontSize(7.4);
    setInk(doc, INK);
    doc.text(label, x, y);

    // A trailing space in the label is not measured, so the gap is explicit
    const labelWidth = doc.getTextWidth(label.trimEnd()) + 1.2;
    doc.setFont(MONO, 'normal');
    doc.text(clip(doc, value, room - labelWidth), x + labelWidth, y);
  });

  return top + rowHeight * 2;
};

/**
 * Builds the slip onto a document already sized to the cut sheet.
 *
 * Returns the lowest y any ink reached, so a test can prove the whole slip
 * stayed on the paper rather than trusting that it looked right.
 */
export const drawGradeSlip = (doc, {
  student = {},
  rows = [],
  term = '',
  releasedOn = new Date(),
  logo = null,
  // `{ prepared, approved }` — the scanned signatures, either one optional
  signatures = null,
  blankRows = 2,
  // Set only when a sheet is carrying on from the one before it, so the units
  // stay the term's total rather than restarting at whatever this sheet holds
  unitsTotal = null,
} = {}) => {
  const bounds = columnBounds();

  drawHeader(doc, logo);

  const courseAndYear = [student.courseCode || student.course, student.year]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' ');

  const infoBottom = drawInfo(doc, {
    studentId: student.studentId,
    name: student.name,
    term,
    courseAndYear,
  });

  // ── the table ───────────────────────────────────────────────────────────
  const tableTop = infoBottom + 2.6;
  const headerHeight = 5;

  /*
   * What has to survive below the table, so the rows can be sized to leave
   * room for it: the units total, the closing line, the note, the grading
   * reference and both signature blocks.
   */
  const TAIL = 51;
  const available = SLIP_HEIGHT - TAIL - tableTop - headerHeight;

  /*
   * Rows shrink to fit the sheet, but only so far — below this they stop
   * being readable, and an unreadable grade slip is worse than a second one.
   * A term heavy enough to pass that point spills onto another half sheet
   * rather than running off the bottom of this one.
   */
  const MIN_ROW_HEIGHT = 3.2;
  const totalRow = 1;
  const capacity = Math.max(1, Math.floor(available / MIN_ROW_HEIGHT) - totalRow);

  // Blank lines are the paper's way of showing nothing was added after the
  // last subject. They are the first thing to go when the term is a long one
  const padding = rows.length + blankRows <= capacity ? blankRows : 0;
  const printed = [...rows, ...Array.from({ length: padding }, () => null)];

  const overflow = printed.slice(capacity);
  const onThisSheet = printed.slice(0, capacity);

  const rowHeight = Math.min(4.8, Math.max(
    MIN_ROW_HEIGHT,
    available / (onThisSheet.length + totalRow),
  ));

  doc.setDrawColor(...RULE).setLineWidth(0.25);

  // Header band
  doc.rect(LEFT, tableTop, WIDTH, headerHeight);
  doc.setFont(MONO, 'bold').setFontSize(7.2);
  setInk(doc, INK);
  COLUMNS.forEach((column, index) => {
    doc.text(column.header, cellX(bounds, index, 'center'), tableTop + 3.5, { align: 'center' });
  });

  let y = tableTop + headerHeight;

  onThisSheet.forEach((row) => {
    doc.rect(LEFT, y, WIDTH, rowHeight);

    bounds.slice(0, -1).forEach(({ to }) => doc.line(to, y, to, y + rowHeight));

    if (row) {
      COLUMNS.forEach((column, index) => {
        const value = row[column.key];
        if (!value) return;

        const bold = column.key === 'grade';
        doc.setFont(MONO, bold ? 'bold' : 'normal').setFontSize(7.4);
        setInk(doc, INK);

        const room = bounds[index].to - bounds[index].from - 3;
        doc.text(clip(doc, value, room), cellX(bounds, index, column.align), y + rowHeight - 1.5, {
          align: column.align,
        });
      });
    }

    y += rowHeight;
  });

  // Totalled over every subject, including any carried to the next sheet, so
  // the figure is the term's and not just this page's
  const units = unitsTotal ?? rows.reduce((sum, row) => sum + (parseFloat(row.units) || 0), 0);

  doc.setFont(MONO, 'bold').setFontSize(7.6);
  setInk(doc, INK);
  doc.text('TOTAL UNIT(s)', cellX(bounds, 1, 'center'), y + 3.4, { align: 'center' });
  doc.text(units ? String(units) : '', cellX(bounds, 2, 'center'), y + 3.4, { align: 'center' });

  y += 4.6;

  doc.setFont(MONO, 'bold').setFontSize(7.4);
  doc.text(
    overflow.length
      ? `***************CONTINUED ON NEXT SHEET (${overflow.length} more)***************`
      : '*******************NOTHING FOLLOWS****************',
    SLIP_WIDTH / 2,
    y + 3,
    { align: 'center' },
  );

  y += 6.4;

  // ── note and release date ───────────────────────────────────────────────
  doc.setFont(MONO, 'bolditalic').setFontSize(6.8);
  const note = 'NOTE: For School Purposes Only';
  const noteWidth = doc.getTextWidth(note);

  doc.setFillColor(...HIGHLIGHT);
  doc.rect(LEFT + 50, y - 2.6, noteWidth + 2, 4, 'F');
  setInk(doc, INK);
  doc.text(note, LEFT + 51, y);

  doc.setFont(MONO, 'bold').setFontSize(6.8);
  doc.text(`Date Released: ${slipDate(releasedOn)}`, RIGHT - 42, y, { align: 'left' });

  y += 4.4;

  // ── the grading reference ───────────────────────────────────────────────
  doc.setFont(MONO, 'bold').setFontSize(5.4);
  doc.text('GRADING SYSTEM:', LEFT, y);

  const legendTop = y + 2.4;
  const legendStep = 2.3;
  const columnX = [LEFT, LEFT + 22, LEFT + 44, LEFT + 66, LEFT + 92];

  doc.setFont(MONO, 'normal').setFontSize(4.9);
  setInk(doc, INK);
  GRADING_SYSTEM.forEach((line, rowIndex) => {
    line.forEach((cell, columnIndex) => {
      doc.text(cell, columnX[columnIndex], legendTop + rowIndex * legendStep);
    });
  });

  const legendBottom = legendTop + (GRADING_SYSTEM.length - 1) * legendStep;

  // ── signatures ──────────────────────────────────────────────────────────
  const signTop = Math.max(legendBottom + 5, SLIP_HEIGHT - 14);
  const blocks = [
    { label: 'PREPARED BY:', at: LEFT + 6, who: PREPARED_BY, mark: signatures?.prepared },
    { label: 'APPROVED BY:', at: LEFT + 104, who: APPROVED_BY, mark: signatures?.approved },
  ];

  blocks.forEach(({ label, at, who, mark }) => {
    doc.setFont(MONO, 'bold').setFontSize(6.6);
    setInk(doc, INK);
    doc.text(label, at, signTop);

    const centre = at + 38;
    const ruleY = signTop + 5.6;

    /*
     * The scanned signature sits across the rule, the way a signed one does.
     * Fitted to whichever of height or width runs out first, so the two
     * scans can be different shapes without either being stretched.
     */
    if (mark) {
      try {
        const ratio = mark.width / mark.height;
        let height = 12.5;
        let width = height * ratio;

        if (width > 46) {
          width = 46;
          height = width / ratio;
        }

        doc.addImage(mark.data, mark.format, centre - width / 2, ruleY - height + 1.4, width, height);
      } catch (error) {
        // The ruled line below is still there to sign by hand
        console.error('Signature could not be drawn', error);
      }
    }

    // The line to sign across, drawn whether or not a scan went on it
    doc.setDrawColor(...RULE).setLineWidth(0.2);
    doc.line(centre - 26, ruleY, centre + 26, ruleY);

    doc.setFont(MONO, 'bold').setFontSize(6.8);
    doc.text(who.name, centre, signTop + 8.6, { align: 'center' });

    doc.setFont(MONO, 'bold').setFontSize(6);
    setInk(doc, MUTED);
    doc.text(who.title, centre, signTop + 11.2, { align: 'center' });
  });

  const bottom = signTop + 11.2;

  /*
   * A term too heavy for one cut sheet carries on to another, each one a
   * whole slip in its own right — same heading, same signatures, the term's
   * full unit count — so either half can be handed over and still be read.
   */
  if (overflow.length) {
    doc.addPage([SLIP_WIDTH, SLIP_HEIGHT], 'landscape');

    return drawGradeSlip(doc, {
      student,
      rows: overflow.filter(Boolean),
      term,
      releasedOn,
      logo,
      signatures,
      blankRows,
      unitsTotal: units,
    });
  }

  return bottom;
};
