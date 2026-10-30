/**
 * The payment status report as a printable PDF.
 *
 * The same list the Payment Status Report modal shows: enrolled students
 * grouped by course and then year level, one detailed row each, with a
 * running total per group and a grand total at the end.
 *
 * Flowed through autoTable rather than laid out by hand — unlike the balance
 * slip, this runs to hundreds of rows and has to paginate, repeat its column
 * headings and keep a group's heading with the rows beneath it.
 */

import autoTable from 'jspdf-autotable';
import { formatAmount } from './accountBalance.js';

/** Long bond, portrait — what the school's printers are loaded with. */
export const REPORT_FORMAT = [215.9, 330.2];

const BRAND = [156, 38, 44];
const DEEP = [107, 26, 30];
const INK = [17, 17, 17];
const MUTED = [107, 114, 128];
const WASH = [243, 244, 246];
const PAPER = [255, 255, 255];

const MARGIN = 10;
const BODY_TOP = 42;

const SCHOOL = 'VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE, INC.';
const ADDRESS = 'Prince Pad Bldg., Antonio Luna St., Mabulay Subd., Cagayan de Oro City';

/**
 * Column widths as proportions, not millimetres.
 *
 * Scaled to fill the printable width exactly. Declared in millimetres they
 * drift the moment anyone adds a column or changes the margin, and autoTable
 * answers a one-tenth overflow by quietly dropping content off the edge.
 */
const COLUMNS = [
  { header: 'No.', width: 9, align: 'right' },
  { header: 'Student ID', width: 24, align: 'left' },
  { header: 'Name', width: 62, align: 'left' },
  { header: 'Course', width: 22, align: 'left' },
  { header: 'Year', width: 18, align: 'left' },
  { header: 'Semester / S.Y.', width: 33, align: 'left' },
  { header: 'Balance (PHP)', width: 24, align: 'right' },
];

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
 * What the Course column prints.
 *
 * The code where there is one, because the full course name is already the
 * heading above these rows and repeating it in a 22mm column only buys an
 * ellipsis. Where there is no code, the degree title is shortened instead.
 */
export const courseLabel = (student) => {
  if (student.courseCode) return student.courseCode;

  const name = String(student.course ?? '').trim();
  const match = SHORT_FORMS.find(([pattern]) => pattern.test(name));

  return match ? name.replace(match[0], match[1]) : name;
};

/** The printable width, and the scale that makes the columns fill it. */
export const USABLE_WIDTH = REPORT_FORMAT[0] - MARGIN * 2;
const WIDTH_SCALE = USABLE_WIDTH / COLUMNS.reduce((sum, column) => sum + column.width, 0);

export const columnWidths = () => COLUMNS.map((column) => column.width * WIDTH_SCALE);

const stampedAt = (now) =>
  `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ` +
  now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();

/**
 * What a student's last column says.
 *
 * A student with no billing record is called out rather than shown as zero:
 * nothing assessed is not the same as nothing owed, and the cashier is the
 * one who has to tell them apart.
 */
const balanceCell = (student, showBalance) => {
  if (!showBalance) return 'Fully Paid';
  if (!student.hasRecord) return 'No record';
  return formatAmount(student.remaining);
};

const bandRow = (text, amount, { fill, color, size, bold = true }) => [
  {
    content: text,
    colSpan: COLUMNS.length - 1,
    styles: { fillColor: fill, textColor: color, fontStyle: bold ? 'bold' : 'normal', fontSize: size },
  },
  {
    content: amount ?? '',
    styles: {
      fillColor: fill,
      textColor: color,
      fontStyle: bold ? 'bold' : 'normal',
      fontSize: size,
      halign: 'right',
    },
  },
];

/**
 * Builds the report onto a document already sized to {@link REPORT_FORMAT}.
 *
 * Returns the number of body rows written, so a caller — or a test — can tell
 * an empty report from one that simply did not render.
 */
export const drawPaymentStatusReport = (doc, {
  groups = [],
  title = 'PAYMENT STATUS REPORT',
  subtitle = '',
  termLabel = '',
  showBalance = true,
  studentCount = 0,
  grandTotal = 0,
  logo = null,
  now = new Date(),
}) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const header = () => {
    if (logo) {
      try {
        doc.addImage(logo.data, logo.format, MARGIN, 9, 14, 14);
      } catch (error) {
        // A missing seal must never cost the report
        console.error('Report logo could not be drawn', error);
      }
    }

    const textX = logo ? MARGIN + 18 : MARGIN;

    doc.setFontSize(11).setFont('helvetica', 'bold').setTextColor(...BRAND);
    doc.text(SCHOOL, textX, 15);

    doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(...MUTED);
    doc.text(ADDRESS, textX, 19.5);

    doc.setFontSize(13).setFont('helvetica', 'bold').setTextColor(...INK);
    doc.text(title, pageWidth / 2, 29, { align: 'center' });

    doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(...MUTED);
    doc.text(
      [subtitle, termLabel, `${studentCount} student${studentCount === 1 ? '' : 's'}`, `Generated ${stampedAt(now)}`]
        .filter(Boolean)
        .join('   •   '),
      pageWidth / 2,
      34,
      { align: 'center' },
    );

    doc.setDrawColor(...BRAND).setLineWidth(0.6);
    doc.line(MARGIN, 37, pageWidth - MARGIN, 37);
  };

  // One flat body: group headings ride along as full-width rows so autoTable
  // paginates them with their students instead of orphaning a heading at the
  // foot of a page.
  const body = [];
  let printed = 0;

  groups.forEach((group) => {
    body.push(bandRow(
      `${group.course}  —  ${group.count} student${group.count === 1 ? '' : 's'}`,
      showBalance ? formatAmount(group.total) : '',
      { fill: DEEP, color: PAPER, size: 8.5 },
    ));

    group.years.forEach((yearGroup) => {
      body.push(bandRow(
        `${yearGroup.year}  (${yearGroup.students.length})`,
        showBalance ? formatAmount(yearGroup.total) : '',
        { fill: WASH, color: INK, size: 7.5 },
      ));

      yearGroup.students.forEach((student, index) => {
        printed += 1;
        body.push([
          index + 1,
          student.studentId || '—',
          student.name,
          courseLabel(student),
          student.year,
          [student.semester, student.schoolYear].filter(Boolean).join(' · '),
          balanceCell(student, showBalance),
        ]);
      });
    });
  });

  autoTable(doc, {
    head: [COLUMNS.map((column) => column.header)],
    body,
    startY: BODY_TOP,
    margin: { top: BODY_TOP, left: MARGIN, right: MARGIN, bottom: 16 },
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: { top: 1.1, bottom: 1.1, left: 1.6, right: 1.6 },
      lineWidth: 0.1,
      lineColor: [214, 214, 214],
      textColor: INK,
      // Wrapped, never clipped: a truncated name is a student the cashier
      // cannot identify, which defeats the point of the list
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
      COLUMNS.map((column, index) => [
        index,
        { cellWidth: column.width * WIDTH_SCALE, halign: column.align },
      ]),
    ),
    didParseCell: (data) => {
      if (data.section !== 'body' || data.row.raw.length !== COLUMNS.length) return;

      // The balance itself, on a student row: the figure people scan for
      if (data.column.index === COLUMNS.length - 1 && typeof data.cell.raw === 'string') {
        if (data.cell.raw === 'Fully Paid') {
          data.cell.styles.textColor = [21, 94, 48];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'No record') {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fontStyle = 'bold';
        } else if (showBalance) {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: header,
  });

  if (showBalance) {
    let y = doc.lastAutoTable.finalY + 6;

    // A total marooned on its own page reads as a different document
    if (y > pageHeight - 24) {
      doc.addPage();
      header();
      y = BODY_TOP + 6;
    }

    doc.setFillColor(...BRAND);
    doc.rect(MARGIN, y, pageWidth - MARGIN * 2, 11, 'F');

    doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(...PAPER);
    doc.text('TOTAL OUTSTANDING', MARGIN + 4, y + 7);

    doc.setFontSize(12);
    doc.text(`PHP ${formatAmount(grandTotal)}`, pageWidth - MARGIN - 4, y + 7.3, { align: 'right' });
  }

  // Page numbers last, once the count is known
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(6.8).setFont('helvetica', 'normal').setTextColor(...MUTED);
    doc.text(
      'Figures are each student\'s balance for their current term. Not an official receipt.',
      MARGIN,
      pageHeight - 8,
    );
    doc.text(`Page ${page} of ${pages}`, pageWidth - MARGIN, pageHeight - 8, { align: 'right' });
  }

  return printed;
};
