/**
 * The payment status report as a printable PDF.
 *
 * The same list the Payment Status Report modal shows: enrolled students
 * grouped by course and then year level, one row each.
 *
 * Both sheets — outstanding and settled — use the same columns, so the two
 * read as one report split in half rather than two different documents. Each
 * row carries what the student has handed over, what is left, and a Status
 * that says which of those two numbers matters.
 *
 * Assessed and discount are deliberately not columns here. They made the page
 * cramped, and showing an assessment beside a smaller collected figure reads
 * as a shortfall when it is a discount. Collected and Balance stand on their
 * own: paid this much, owes that much. The spreadsheet export carries the
 * full fee breakdown for anyone who needs to work through it.
 *
 * Flowed through autoTable rather than laid out by hand — unlike the balance
 * slip, this runs to hundreds of rows and has to paginate, repeat its column
 * headings and keep a group's heading with the rows beneath it.
 */

import autoTable from 'jspdf-autotable';
import { formatAmount } from './accountBalance.js';

/** Long bond, portrait — twice the rows per sheet that landscape manages. */
export const REPORT_FORMAT = [215.9, 330.2];
export const REPORT_ORIENTATION = 'portrait';

const BRAND = [156, 38, 44];
const INK = [17, 17, 17];
const MUTED = [107, 114, 128];
const WASH = [243, 244, 246];
const PAPER = [255, 255, 255];
const OWED = [185, 28, 28];
const SETTLED = [21, 94, 48];
const FLAGGED = [180, 83, 9];

const MARGIN = 10;
const BODY_TOP = 42;
const BAND_HEIGHT = 14;

/**
 * One colour per list, so a section is recognisable from across the desk.
 *
 * Four sections printed under the same maroon heading are impossible to tell
 * apart while flipping — you end up searching the PDF for the word to find
 * where the withdrawn students start, which nobody in an accounting office
 * is going to do.
 */
/** A deeper shade of a tone, for the course bands under its banner. */
const deepen = ([r, g, b]) => [r, g, b].map((channel) => Math.round(channel * 0.72));

export const TONES = {
  owed: [156, 38, 44],
  settled: [21, 94, 48],
  withdrawn: [55, 65, 81],
  scholars: [146, 64, 14],
};

const SCHOOL = 'VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE, INC.';
const ADDRESS = 'Prince Pad Bldg., Antonio Luna St., Mabulay Subd., Cagayan de Oro City';

/**
 * Column widths as proportions, not millimetres.
 *
 * Scaled to fill the printable width exactly. Declared in millimetres they
 * drift the moment anyone adds a column or changes the margin, and autoTable
 * answers a one-tenth overflow by quietly dropping content off the edge.
 */
const BASE_COLUMNS = [
  // Wide enough that "No." still fits on one line once the scholars sheet
  // squeezes everything to make room for its extra column
  { header: 'No.', width: 10, align: 'right' },
  { header: 'Student ID', width: 22, align: 'left' },
  { header: 'Name', width: 45, align: 'left' },
  // Shortened rather than wrapped: the full course name is the heading
  // directly above these rows, so nothing is actually lost here
  { header: 'Course', width: 14, align: 'left', overflow: 'ellipsize' },
  { header: 'Year', width: 16, align: 'left' },
  { header: 'Semester / S.Y.', width: 37, align: 'left' },
  // Currency named once in the footer rather than twice in the headings,
  // which wrapped the header row onto two lines
  { header: 'Collected', width: 22, align: 'right' },
  { header: 'Balance', width: 22, align: 'right' },
  { header: 'Status', width: 25, align: 'left' },
];

/**
 * The scholars sheet names each student's scholarship on their own row as
 * well as in the heading above them, so a page photocopied on its own still
 * says who is a City Scholar and who is a Student Assistant.
 */
const SCHOLARSHIP_COLUMN = { header: 'Scholarship', width: 30, align: 'left' };

/** The first of the two money columns. Fixed: nothing is inserted before it. */
const MONEY_FROM = 6;

export const USABLE_WIDTH = REPORT_FORMAT[0] - MARGIN * 2;

/**
 * The columns for a sheet, scaled to fill the printable width exactly.
 *
 * Declared as proportions rather than millimetres: in millimetres they drift
 * the moment a column is added, and autoTable answers a one-tenth overflow by
 * quietly dropping content off the edge.
 */
export const layoutFor = (showScholarship = false) => {
  const columns = showScholarship
    ? [...BASE_COLUMNS.slice(0, -1), SCHOLARSHIP_COLUMN, BASE_COLUMNS[BASE_COLUMNS.length - 1]]
    : BASE_COLUMNS;

  const scale = USABLE_WIDTH / columns.reduce((sum, column) => sum + column.width, 0);

  return {
    columns,
    scale,
    widths: columns.map((column) => column.width * scale),
    scholarshipAt: showScholarship ? columns.length - 2 : -1,
    statusAt: columns.length - 1,
  };
};

export const columnWidths = (showScholarship = false) => layoutFor(showScholarship).widths;

/** The right-hand edge of each column, for aligning the totals beneath them. */
const columnRightEdges = (widths) => {
  let x = MARGIN;
  return widths.map((width) => (x += width));
};

/** Degree titles shortened the way the school writes them on a roster. */
const SHORT_FORMS = [
  [/^bachelor of science in\s+/i, 'BS '],
  [/^bachelor of arts in\s+/i, 'AB '],
  [/^bachelor of\s+/i, 'B '],
  [/^master of science in\s+/i, 'MS '],
  [/^master of arts in\s+/i, 'MA '],
  [/^master of\s+/i, 'M '],
  [/^diploma in\s+/i, 'Dip. '],
  [/^associate in\s+/i, 'Assoc. '],
  [/^certificate in\s+/i, 'Cert. '],
];

/**
 * What the Course column prints: the code where there is one, otherwise the
 * degree title shortened.
 */
export const courseLabel = (student) => {
  if (student.courseCode) return student.courseCode;

  const name = String(student.course ?? '').trim();
  const match = SHORT_FORMS.find(([pattern]) => pattern.test(name));

  return match ? name.replace(match[0], match[1]) : name;
};

/**
 * `1st Semester · 2026-2027`, or `1st Sem · 2026-2027` when the sheet carries
 * an extra column and the full word no longer fits on one line.
 */
export const termCell = (student, compact = false) => {
  const semester = compact
    ? String(student.semester ?? '').replace(/\bSemester\b/i, 'Sem')
    : student.semester;

  return [semester, student.schoolYear].filter(Boolean).join(' · ');
};

export const STATUS = {
  UNASSESSED: 'Not Yet Assessed',
  UNPAID: 'Unpaid',
  PARTIAL: 'Partially Paid',
  SETTLED: 'Fully Paid',
};

/**
 * Where a student stands, in two words.
 *
 * Partially paid is held apart from unpaid on purpose: both owe money, but
 * one of them has been turning up at the counter and the other has not, and
 * that is the difference between a reminder and a follow-up.
 */
export const statusFor = (student) => {
  if (!student.hasRecord) return STATUS.UNASSESSED;
  if ((student.remaining || 0) > 0.005) {
    return (student.paid || 0) > 0.005 ? STATUS.PARTIAL : STATUS.UNPAID;
  }
  return STATUS.SETTLED;
};

const STATUS_COLOUR = {
  [STATUS.UNASSESSED]: FLAGGED,
  [STATUS.UNPAID]: OWED,
  [STATUS.PARTIAL]: OWED,
  [STATUS.SETTLED]: SETTLED,
};

const stampedAt = (now) =>
  `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ` +
  now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();

/**
 * Totals for a set of rows.
 *
 * Summed from the students rather than carried down from the group, so a
 * subtotal can never disagree with the rows printed directly above it.
 */
export const totalsFor = (students = []) =>
  students.reduce(
    (totals, student) => ({
      assessed: totals.assessed + (student.assessed || 0),
      discount: totals.discount + (student.discount || 0),
      paid: totals.paid + (student.paid || 0),
      balance: totals.balance + (student.remaining || 0),
      advance: totals.advance + (student.advance || 0),
      // Carried beside the money because a heading reading "10 students,
      // 14,750.01 due" means something quite different once you know nine of
      // them have no fees on record at all
      unbilled: totals.unbilled + (student.hasRecord ? 0 : 1),
    }),
    { assessed: 0, discount: 0, paid: 0, balance: 0, advance: 0, unbilled: 0 },
  );

/** `26 students` or `26 students, 9 not assessed`. */
const countLabel = (count, unbilled) =>
  `${count} student${count === 1 ? '' : 's'}${unbilled ? `, ${unbilled} not assessed` : ''}`;

/**
 * A student's two money cells.
 *
 * A student who has not been assessed shows dashes rather than zeroes:
 * nothing charged is not the same as nothing owed, and a zero balance on an
 * empty record is not a student who paid.
 */
const moneyCells = (student) =>
  (student.hasRecord ? [formatAmount(student.paid), formatAmount(student.remaining)] : ['—', '—']);

/**
 * A full-width band spanning the table.
 *
 * With `totals` it is a subtotal, its figures aligned under the columns they
 * total; with null it is a heading and the money cells stay empty. Headings
 * run above their rows and subtotals below them, which is the order an
 * accountant reads: what am I looking at, then what does it come to.
 */
const bandRow = (label, totals, columnCount, { fill, color, size, align = 'left' }) => {
  const style = { fillColor: fill, textColor: color, fontStyle: 'bold', fontSize: size };
  const trailing = columnCount - MONEY_FROM - 2;
  const money = totals ? [formatAmount(totals.paid), formatAmount(totals.balance)] : ['', ''];

  return [
    { content: label, colSpan: MONEY_FROM, styles: { ...style, halign: align } },
    ...money.map((amount) => ({ content: amount, styles: { ...style, halign: 'right' } })),
    ...Array.from({ length: trailing }, () => ({ content: '', styles: style })),
  ];
};

/**
 * The furniture at the top of every page: seal, school, and the coloured
 * banner naming the list.
 *
 * Repeated on every page of a section, so no page is ambiguous about which
 * list it belongs to — including a page torn off and passed on. Shared with
 * the reconciliation sheet so the last page of the file is recognisably part
 * of the same document.
 */
const drawPageHeader = (doc, {
  title, sectionTitle, accent, subtitle, termLabel, countText, logo, now,
}) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  if (logo) {
    try {
      doc.addImage(logo.data, logo.format, MARGIN, 7, 12, 12);
    } catch (error) {
      // A missing seal must never cost the report
      console.error('Report logo could not be drawn', error);
    }
  }

  const textX = logo ? MARGIN + 15.5 : MARGIN;

  doc.setFontSize(9.5).setFont('helvetica', 'bold').setTextColor(...BRAND);
  doc.text(SCHOOL, textX, 12);

  doc.setFontSize(6.5).setFont('helvetica', 'normal').setTextColor(...MUTED);
  doc.text(ADDRESS, textX, 16);

  doc.setFontSize(7.5).setFont('helvetica', 'bold').setTextColor(...MUTED);
  doc.text(title, pageWidth - MARGIN, 12, { align: 'right' });

  // The band that makes the section unmistakable
  doc.setFillColor(...accent);
  doc.rect(MARGIN, 20, pageWidth - MARGIN * 2, 10.5, 'F');

  doc.setFontSize(13).setFont('helvetica', 'bold').setTextColor(...PAPER);
  doc.text(sectionTitle || title, MARGIN + 4, 27.3);

  doc.setFontSize(7.5).setFont('helvetica', 'normal');
  doc.text(
    [countText, termLabel].filter(Boolean).join('   •   '),
    pageWidth - MARGIN - 4,
    27.1,
    { align: 'right' },
  );

  doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(...MUTED);
  doc.text(
    [subtitle, `Generated ${stampedAt(now)}`].filter(Boolean).join('   •   '),
    MARGIN,
    34.5,
  );

  doc.setDrawColor(...accent).setLineWidth(0.6);
  doc.line(MARGIN, 36.8, pageWidth - MARGIN, 36.8);
};

/**
 * Builds the report onto a document already sized to {@link REPORT_FORMAT}.
 *
 * Returns the number of student rows written, so a caller — or a test — can
 * tell an empty report from one that simply did not render.
 */
export const drawPaymentStatusReport = (doc, {
  groups = [],
  title = 'PAYMENT STATUS REPORT',
  sectionTitle = '',
  accent = TONES.owed,
  subtitle = '',
  termLabel = '',
  studentCount = 0,
  termSummary = null,
  showScholarship = false,
  newPage = false,
  logo = null,
  now = new Date(),
}) => {
  // Each list starts its own sheet of paper, so the withdrawn students never
  // share a page with the ones still studying
  if (newPage) doc.addPage(REPORT_FORMAT, REPORT_ORIENTATION);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { columns, widths, scholarshipAt, statusAt } = layoutFor(showScholarship);

  const header = () => drawPageHeader(doc, {
    title, sectionTitle, accent, subtitle, termLabel, logo, now,
    countText: countLabel(studentCount, 0),
  });

  // One flat body: group headings ride along as full-width rows so autoTable
  // paginates them with their students instead of orphaning a heading at the
  // foot of a page.
  const body = [];
  let printed = 0;

  const GROUP_BAND = { fill: deepen(accent), color: PAPER, size: 8 };
  const SECTION_BAND = { fill: WASH, color: INK, size: 7.2 };

  groups.forEach((group) => {
    const groupStudents = group.sections.flatMap((section) => section.students);
    const groupTotals = totalsFor(groupStudents);

    // Names the rows that follow. No figures: a total printed before the rows
    // it totals is read as an opening balance, and it meant adding up the page
    // backwards to check it
    body.push(bandRow(
      `${group.heading}  —  ${countLabel(groupStudents.length, groupTotals.unbilled)}`,
      null,
      columns.length,
      GROUP_BAND,
    ));

    group.sections.forEach((section) => {
      const sectionTotals = totalsFor(section.students);

      body.push(bandRow(
        `${section.heading}  (${countLabel(section.students.length, sectionTotals.unbilled)})`,
        null,
        columns.length,
        SECTION_BAND,
      ));

      section.students.forEach((student, index) => {
        printed += 1;
        body.push([
          index + 1,
          student.studentId || '—',
          student.name,
          courseLabel(student),
          student.year,
          termCell(student, showScholarship),
          ...moneyCells(student),
          ...(showScholarship ? [student.scholarship || '—'] : []),
          statusFor(student),
        ]);
      });

      // Skipped where the group holds a single section: its subtotal and the
      // group total directly beneath it would be the same figures twice.
      // Right-aligned otherwise, so the label sits beside the figures it
      // belongs to rather than stranded at the far side of the page
      if (group.sections.length > 1) {
        body.push(bandRow(
          `Subtotal  —  ${section.heading}`,
          sectionTotals,
          columns.length,
          { ...SECTION_BAND, align: 'right' },
        ));
      }
    });

    body.push(bandRow(
      `TOTAL  —  ${group.heading}`,
      groupTotals,
      columns.length,
      { ...GROUP_BAND, align: 'right' },
    ));
  });

  autoTable(doc, {
    head: [columns.map((column) => column.header)],
    body,
    startY: BODY_TOP,
    margin: { top: BODY_TOP, left: MARGIN, right: MARGIN, bottom: 16 },
    theme: 'grid',
    styles: {
      fontSize: 6.9,
      cellPadding: { top: 1, bottom: 1, left: 1.4, right: 1.4 },
      lineWidth: 0.1,
      lineColor: [214, 214, 214],
      textColor: INK,
      // Wrapped, never clipped: a truncated name is a student the cashier
      // cannot identify, and a truncated figure is worse
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [55, 65, 81],
      textColor: PAPER,
      fontSize: 7.2,
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [55, 65, 81],
    },
    columnStyles: Object.fromEntries(
      columns.map((column, index) => [
        index,
        {
          cellWidth: widths[index],
          halign: column.align,
          ...(column.overflow ? { overflow: column.overflow } : {}),
        },
      ]),
    ),
    didParseCell: (data) => {
      if (data.section !== 'body' || data.row.raw.length !== columns.length) return;

      // The balance, and the status that explains it, are what people scan for
      if (data.column.index === MONEY_FROM + 1 && data.cell.raw !== '—') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = data.cell.raw === '0.00' ? SETTLED : OWED;
      }

      if (data.column.index === scholarshipAt) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = accent;
      }

      if (data.column.index === statusAt) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = STATUS_COLOUR[data.cell.raw] ?? INK;
      }
    },
    didDrawPage: header,
  });

  // ── the summary band ────────────────────────────────────────────────────
  const grand = totalsFor(groups.flatMap((g) => g.sections.flatMap((s) => s.students)));
  let y = doc.lastAutoTable.finalY + 6;

  // A total marooned on its own page reads as a different document
  if (y > pageHeight - (BAND_HEIGHT + 22)) {
    doc.addPage();
    header();
    y = BODY_TOP + 6;
  }

  doc.setFillColor(...accent);
  doc.rect(MARGIN, y, pageWidth - MARGIN * 2, BAND_HEIGHT, 'F');

  doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(...PAPER);
  doc.text(`TOTAL  —  ${countLabel(studentCount, grand.unbilled)}`, MARGIN + 4, y + 9);

  const edges = columnRightEdges(widths);

  [['Collected', grand.paid], ['Outstanding', grand.balance]].forEach(([label, amount], index) => {
    const right = edges[MONEY_FROM + index] - 1.4;

    doc.setFontSize(5.4).setFont('helvetica', 'normal').setTextColor(255, 255, 255);
    doc.text(label.toUpperCase(), right, y + 5, { align: 'right' });

    doc.setFontSize(8.5).setFont('helvetica', 'bold');
    doc.text(formatAmount(amount), right, y + 10.5, { align: 'right' });
  });

  doc.setFontSize(6.6).setFont('helvetica', 'normal').setTextColor(...MUTED);
  let noteY = y + BAND_HEIGHT + 4.5;

  // Overpayments have nowhere to show once Balance floors at zero
  if (grand.advance > 0.005) {
    doc.text(
      `PHP ${formatAmount(grand.advance)} of what was collected is advance payment, carried forward to the next term.`,
      MARGIN,
      noteY,
    );
    noteY += 4;
  }

  /*
   * Where this list sits in the term.
   *
   * Without it the Collected figure above reads as the term's takings, when
   * it is only what this half of the students has handed over — most of the
   * money comes from people who have paid something and still owe.
   */
  if (termSummary) {
    doc.text(
      `This list covers ${studentCount} of ${termSummary.students} enrolled students`
      + `${termSummary.scope ? ` ${termSummary.scope}` : ''}. `
      + `Across all of them: PHP ${formatAmount(termSummary.collected)} collected, `
      + `PHP ${formatAmount(termSummary.outstanding)} outstanding.`,
      MARGIN,
      noteY,
    );
  }

  return printed;
};

/** The name the reconciliation sheet is known by, in the banner and footer. */
export const RECONCILIATION = 'TERM RECONCILIATION';

/**
 * The last page: all four lists, adding up to the term.
 *
 * The lists stopped overlapping when a scholar was taken out of the unpaid
 * list and given their own, which is correct but means Not Fully Paid plus
 * Fully Paid no longer reaches the term total — the scholars and the
 * withdrawn students are the difference. Adding three bands across two
 * separate files to prove that is not a reasonable thing to ask of anyone, so
 * the file does it here instead.
 *
 * Every list is named, including the ones printed in the other file, because
 * the figure that will not reconcile is always the one that is somewhere else.
 *
 * `lists` are `{ name, students, collected, outstanding, here }`.
 */
export const drawReconciliation = (doc, {
  lists = [],
  title = 'PAYMENT STATUS REPORT',
  otherFile = '',
  termLabel = '',
  accent = TONES.owed,
  logo = null,
  now = new Date(),
}) => {
  doc.addPage(REPORT_FORMAT, REPORT_ORIENTATION);

  const total = lists.reduce(
    (sum, list) => ({
      students: sum.students + list.students,
      collected: sum.collected + list.collected,
      outstanding: sum.outstanding + list.outstanding,
    }),
    { students: 0, collected: 0, outstanding: 0 },
  );

  drawPageHeader(doc, {
    title,
    sectionTitle: RECONCILIATION,
    accent,
    subtitle: 'Every enrolled student is counted on exactly one of the lists below',
    termLabel,
    countText: countLabel(total.students, 0),
    logo,
    now,
  });

  // Same proportional trick as the student table: declared as shares of the
  // printable width so nothing drifts off the edge
  const shares = [52, 46, 22, 38, 38];
  const scale = USABLE_WIDTH / shares.reduce((sum, share) => sum + share, 0);
  const widths = shares.map((share) => share * scale);

  autoTable(doc, {
    head: [['List', 'Printed', 'Students', 'Collected', 'Outstanding']],
    body: lists.map((list) => [
      list.name,
      list.here ? 'In this file' : `Separate file${otherFile ? ` — ${otherFile}` : ''}`,
      String(list.students),
      formatAmount(list.collected),
      formatAmount(list.outstanding),
    ]),
    foot: [[
      'ALL ENROLLED STUDENTS',
      '',
      String(total.students),
      formatAmount(total.collected),
      formatAmount(total.outstanding),
    ]],
    startY: BODY_TOP,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: {
      fontSize: 8.4,
      cellPadding: { top: 2.4, bottom: 2.4, left: 2, right: 2 },
      lineWidth: 0.1,
      lineColor: [214, 214, 214],
      textColor: INK,
    },
    headStyles: {
      fillColor: [55, 65, 81], textColor: PAPER, fontSize: 8, fontStyle: 'bold',
      lineWidth: 0.1, lineColor: [55, 65, 81],
    },
    footStyles: {
      fillColor: accent, textColor: PAPER, fontSize: 9.2, fontStyle: 'bold',
      lineWidth: 0.1, lineColor: accent,
    },
    columnStyles: {
      0: { cellWidth: widths[0], fontStyle: 'bold' },
      1: { cellWidth: widths[1], textColor: MUTED },
      2: { cellWidth: widths[2], halign: 'right' },
      3: { cellWidth: widths[3], halign: 'right' },
      4: { cellWidth: widths[4], halign: 'right' },
    },
    didParseCell: (data) => {
      // Column alignment does not reach the foot on its own, and a grand total
      // sitting under its columns rather than beside them is the whole point
      if (data.section === 'foot') {
        data.cell.styles.halign = data.column.index === 0 ? 'left' : 'right';
      }

      if (data.section === 'body' && data.column.index === 4 && data.cell.raw !== '0.00') {
        data.cell.styles.textColor = OWED;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.setFontSize(7.4).setFont('helvetica', 'normal').setTextColor(...MUTED);

  // Wrapped to the printable width rather than split by hand, so renaming a
  // list can never leave a line running off the page
  const note =
    'The four lists do not overlap. A scholar is counted only under Scholars and a withdrawn student only '
    + 'under Withdrawn, so neither appears in Not Fully Paid or Fully Paid — adding just those two falls short '
    + 'of the term total by whatever the scholars and withdrawn students hold. All four lines above are needed '
    + 'to reach it.';

  doc.text(doc.splitTextToSize(note, USABLE_WIDTH), MARGIN, doc.lastAutoTable.finalY + 7);

  return total;
};

/**
 * Stamps the footer and page numbers across the finished document.
 *
 * Held apart from drawing a section because the report is one file holding
 * several lists, and the page count is only known once the last of them is
 * on the page. Numbering each section as it was drawn would restart at one
 * four times over, and print each footer on top of the last.
 */
export const finishReport = (doc, sections = []) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();

  /**
   * Which section a page belongs to.
   *
   * Named in the footer as well as the heading so the section is legible
   * from the page numbers alone — flipping to "Withdrawn, page 1 of 1"
   * beats hunting for where one list ends and the next begins.
   */
  const sectionAt = (page) => {
    let from = 1;

    for (const section of sections) {
      if (page <= section.to) {
        return { label: section.label, page: page - from + 1, of: section.to - from + 1 };
      }
      from = section.to + 1;
    }

    return null;
  };

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(6.8).setFont('helvetica', 'normal').setTextColor(...MUTED);
    doc.text(
      'Amounts in Philippine pesos, for each student\'s current term. '
      + 'The full fee breakdown is in the spreadsheet export. Not an official receipt.',
      MARGIN,
      pageHeight - 8,
    );

    const section = sectionAt(page);
    doc.setFont('helvetica', 'bold');
    doc.text(
      section
        ? `${section.label} — page ${section.page} of ${section.of}   ·   Page ${page} of ${pages}`
        : `Page ${page} of ${pages}`,
      pageWidth - MARGIN,
      pageHeight - 8,
      { align: 'right' },
    );
  }

  return pages;
};
