import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { loadSchoolLogo } from '@/lib/schoolLogo';

/**
 * The historical payment archive as a printable report.
 *
 * One term or all of them. When the selection spans several terms each gets
 * its own banded heading and its own subtotal, because a single run of two
 * thousand names with one total at the end answers nothing — the question
 * being asked of this archive is always "what did that term collect".
 */

const RED = [153, 27, 27];
const INK = [17, 24, 39];
const SOFT = [107, 114, 128];

const peso = (n) => `PHP ${Number(n || 0).toLocaleString('en-PH', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
})}`;

const SEM_ORDER = { '1st Semester': 1, '2nd Semester': 2, Summer: 3 };

/** Rows grouped into the terms they belong to, oldest term first. */
const byTerm = (rows) => {
  const groups = new Map();
  rows.forEach((row) => {
    const key = `${row.school_year}||${row.semester}`;
    if (!groups.has(key)) {
      groups.set(key, { school_year: row.school_year, semester: row.semester, rows: [] });
    }
    groups.get(key).rows.push(row);
  });

  return [...groups.values()].sort((a, b) =>
    a.school_year.localeCompare(b.school_year)
    || (SEM_ORDER[a.semester] ?? 9) - (SEM_ORDER[b.semester] ?? 9));
};

const sum = (rows, field) => rows.reduce((n, r) => n + Number(r[field] || 0), 0);

export const buildHistoricalPaymentsPdf = async ({ rows, scopeLabel }) => {
  const logo = await loadSchoolLogo();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // --- Masthead ---
  if (logo) {
    try { doc.addImage(logo, 'JPEG', 14, 10, 18, 18); } catch { /* print without it */ }
  }

  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...INK);
  doc.text('VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE', logo ? 36 : 14, 16);

  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...RED);
  doc.text('Historical Term Payments', logo ? 36 : 14, 22);

  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...SOFT);
  doc.text(scopeLabel, logo ? 36 : 14, 27);

  const stamp = new Date().toLocaleDateString('en-PH', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  doc.text(`Generated ${stamp}`, pageW - 14, 27, { align: 'right' });

  doc.setDrawColor(229, 231, 235).setLineWidth(0.3);
  doc.line(14, 31, pageW - 14, 31);

  // --- Overall figures, before the detail ---
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...INK);
  doc.text(
    `${rows.length.toLocaleString()} ${rows.length === 1 ? 'entry' : 'entries'}`
    + `     Paid ${peso(sum(rows, 'paid_amount'))}`
    + `     Balance ${peso(sum(rows, 'balance'))}`,
    14, 38,
  );

  let cursor = 44;
  const groups = byTerm(rows);

  groups.forEach((group, index) => {
    const body = group.rows.map((r, i) => [
      i + 1,
      (r.student_name || '').toUpperCase(),
      r.course || '',
      peso(r.paid_amount),
      peso(r.balance),
    ]);

    // The term's own subtotal, so each section stands on its own
    body.push([
      '', 'TOTAL', '',
      peso(sum(group.rows, 'paid_amount')),
      peso(sum(group.rows, 'balance')),
    ]);

    autoTable(doc, {
      startY: index === 0 ? cursor : cursor + 4,
      head: [[
        { content: `${group.school_year}  ·  ${group.semester}`, colSpan: 3 },
        { content: `${group.rows.length} ${group.rows.length === 1 ? 'entry' : 'entries'}`, colSpan: 2 },
      ], ['#', 'Student Name', 'Course', 'Paid', 'Balance']],
      body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.6, textColor: INK, lineColor: [229, 231, 235], lineWidth: 0.1 },
      headStyles: { fillColor: RED, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      alternateRowStyles: { fillColor: [250, 250, 251] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'right', textColor: SOFT },
        1: { cellWidth: 62 },
        2: { cellWidth: 34 },
        3: { cellWidth: 36, halign: 'right' },
        4: { cellWidth: 36, halign: 'right' },
      },
      // The last row is the subtotal, not a student
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [243, 244, 246];
        }
      },
      margin: { left: 14, right: 14, bottom: 18 },
    });

    cursor = doc.lastAutoTable.finalY;
  });

  // --- Page numbers, once every page exists ---
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...SOFT);
    doc.text('VIPC Enroll · Historical Term Payments', 14, doc.internal.pageSize.getHeight() - 8);
    doc.text(`Page ${p} of ${pages}`, pageW - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }

  return doc;
};
