// Grading Sheet -> .docx generator. Mirrors the layout/logic of the PDF
// exporters (DownloadGradingSheet.jsx / Exportgradingsheet.jsx) so the Word
// file matches the PDF: logo image, two-column header info, the grades table,
// the grading legend, and three side-by-side signature blocks.
// Uses the dependency-free docx writer in ./docx.
import { saveAs } from 'file-saver';
import { createDocxBlob, para, table, spacer, pageBreak, image } from './docx';

const FAIL = 'DC2626';
const LOGO_REL = 'rId100';
// Match the PDF logo box (140mm x 30mm). 1mm = 36000 EMU.
const LOGO_CX = 140 * 36000;
const LOGO_CY = 30 * 36000;

export const gradeEquivalent = (val) => {
  if (val === null || val === undefined) return '';
  const g = Math.round(val);
  const map = {
    100: '1.0', 99: '1.1', 98: '1.2', 97: '1.25', 96: '1.3', 95: '1.4', 94: '1.5', 93: '1.6',
    92: '1.7', 91: '1.75', 90: '1.8', 89: '1.9', 88: '2.0', 87: '2.1', 86: '2.2', 85: '2.25',
    84: '2.3', 83: '2.4', 82: '2.5', 81: '2.6', 80: '2.7', 79: '2.75', 78: '2.8', 77: '2.9',
    76: '3.0', 75: '3.0', 74: '3.1', 73: '3.2', 72: '3.25', 71: '3.3', 70: '3.4',
  };
  if (g >= 100) return '1.0';
  return map[g] || '5.0';
};

const fmt = (v) => (v != null && v !== '' ? parseFloat(v).toFixed(2) : '');
const failColor = (v) => {
  const n = parseFloat(v);
  return !isNaN(n) && Math.round(n) < 75 ? FAIL : '000000';
};

const LEGEND = [
  { g: '1.0', r: '99-100' }, { g: '1.1', r: '99' }, { g: '1.2', r: '98' }, { g: '1.25', r: '97' },
  { g: '1.3', r: '96' }, { g: '1.4', r: '95' }, { g: '1.5', r: '94' }, { g: '1.6', r: '93' },
  { g: '1.7', r: '92' }, { g: '1.75', r: '91' }, { g: '1.8', r: '90' }, { g: '1.9', r: '89' },
  { g: '2.0', r: '88' }, { g: '2.1', r: '87' }, { g: '2.2', r: '86' }, { g: '2.25', r: '85' },
  { g: '2.3', r: '84' }, { g: '2.4', r: '83' }, { g: '2.5', r: '82' }, { g: '2.6', r: '81' },
  { g: '2.7', r: '80' }, { g: '2.75', r: '79' }, { g: '2.8', r: '78' }, { g: '2.9', r: '77' },
  { g: '3.0', r: '76-75' }, { g: '3.1', r: '74' }, { g: '3.2', r: '73' }, { g: '3.25', r: '72' },
  { g: '3.3', r: '71' }, { g: '3.4', r: '70' }, { g: '5.0', r: 'Below 75' },
  { g: 'NFE', r: 'NO FINAL EXAM' }, { g: 'NFR', r: 'NO FINAL REQUIREMENT' },
  { g: 'INC', r: 'INCOMPLETE' }, { g: 'DA', r: 'DROP DUE TO ABSENCES' },
];

// A label/value line for the header info columns (value in bold).
const infoLine = (label, value) =>
  para([{ text: `${label} `, size: 18 }, { text: String(value ?? ''), bold: true, size: 18 }], { spacingAfter: 30 });

function buildSectionXml(subject, sectionName, students, hasLogo) {
  const sample = students[0] || {};
  const isDHT = sample.courseName?.includes('Diploma') ||
                sample.courseName?.toUpperCase?.().startsWith('DHT') ||
                sample.courseCode?.toUpperCase?.().startsWith('DHT') ||
                subject.subject_code?.includes('DHT');
  const isSHS = sample.year?.includes('Grade');
  const showPercent = !isDHT && !isSHS;

  const calcFinal = (s) => {
    const { prelim_grade: p, midterm_grade: m, semifinal_grade: sm, final_grade: f } = s.grades || {};
    if ([p, m, sm, f].some((v) => v == null || v === '')) return null;
    return Math.round((p + m + sm + f) / 4); // all terms equal weight (25% each)
  };

  // ── Header: logo image (fallback to school name) + GRADING SHEET title ──
  const head =
    (hasLogo
      ? image(LOGO_REL, { cx: LOGO_CX, cy: LOGO_CY, name: 'Logo' })
      : para('VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE, INC.', { bold: true, size: 24, align: 'center', spacingAfter: 20 })) +
    para('GRADING SHEET', { bold: true, size: 26, align: 'center', spacingAfter: 80 });

  // ── Two-column info block (matches the PDF's left/right columns) ──
  const leftCol =
    infoLine('Course Code:', subject.subject_code) +
    infoLine('Course Name:', subject.descriptive_title) +
    infoLine('Class Schedule:', subject.schedule_info || 'TBA') +
    para([
      { text: 'Lec: ', size: 18 }, { text: `${subject.lec_hrs ?? 0}    `, bold: true, size: 18 },
      { text: 'Lab: ', size: 18 }, { text: `${subject.lab_hrs ?? 0}    `, bold: true, size: 18 },
      { text: 'No. of Hours: ', size: 18 }, { text: `${subject.number_of_hours ?? 0}    `, bold: true, size: 18 },
      { text: 'Total Units: ', size: 18 }, { text: `${subject.total_units ?? 0}`, bold: true, size: 18 },
    ], { spacingAfter: 30 });
  const rightCol =
    infoLine('Course & Year:', `${sample.courseCode || ''} - ${sample.year || ''}`) +
    infoLine('Sem. & A.Y.:', `${subject.semester || ''}, ${subject.school_year || ''}`) +
    infoLine('Section:', sectionName);
  const infoTable = table([[{ content: leftCol }, { content: rightCol }]], {
    widths: [6200, 4600],
    borders: false,
    vMargin: 0,
  });

  // ── Grades table ──
  const headerCell = (t) => ({ text: t, bold: true, align: 'center', size: 15, fill: 'FFFFFF' });
  const gradeHeaders = [
    headerCell('Student Name'),
    headerCell(showPercent ? 'Prelim (25%)' : 'Prelim'),
    headerCell(showPercent ? 'Midterm (25%)' : 'Midterm'),
    headerCell(showPercent ? 'Semi (25%)' : 'Semi'),
    headerCell(showPercent ? 'Final (25%)' : 'Final'),
    headerCell('Final Grade'),
    headerCell('Equivalent'),
    headerCell('Remarks'),
  ];

  const gradeRows = students.map((s) => {
    const g = s.grades || {};
    const final = calcFinal(s);
    let remarks = g.status || '';
    if (final !== null) remarks = final >= 75 ? 'PASSED' : 'FAILED';
    const equiv = final !== null ? gradeEquivalent(final) : '';
    const finalColor = final !== null && final < 75 ? FAIL : '000000';
    return [
      { text: (s.name || '').toUpperCase(), align: 'left', size: 14 },
      { text: fmt(g.prelim_grade), align: 'center', size: 14, color: failColor(g.prelim_grade) },
      { text: fmt(g.midterm_grade), align: 'center', size: 14, color: failColor(g.midterm_grade) },
      { text: fmt(g.semifinal_grade), align: 'center', size: 14, color: failColor(g.semifinal_grade) },
      { text: fmt(g.final_grade), align: 'center', size: 14, color: failColor(g.final_grade) },
      { text: final !== null ? final.toFixed(2) : '', align: 'center', bold: true, size: 14, color: finalColor },
      { text: equiv, align: 'center', bold: true, size: 14, color: finalColor },
      { text: remarks, align: 'center', size: 13, color: remarks === 'FAILED' ? FAIL : '000000' },
    ];
  });

  const gradesTable = table([gradeHeaders, ...gradeRows], {
    widths: [3000, 1050, 1050, 1050, 1050, 1150, 1050, 1400],
    fontSize: 14,
    vMargin: 8,
  });

  // ── Legend ──
  const rowsPerCol = 7;
  const numCols = Math.ceil(LEGEND.length / rowsPerCol);
  const legendHeader = [];
  for (let c = 0; c < numCols; c++) {
    legendHeader.push({ text: 'Grade', bold: true, align: 'center', size: 13 }, { text: 'Equivalent', bold: true, align: 'center', size: 13 });
  }
  const legendBody = [];
  for (let r = 0; r < rowsPerCol; r++) {
    const row = [];
    for (let c = 0; c < numCols; c++) {
      const item = LEGEND[c * rowsPerCol + r];
      row.push({ text: item ? item.g : '', bold: true, size: 13, align: 'center' }, { text: item ? item.r : '', size: 13 });
    }
    legendBody.push(row);
  }
  const legendWidths = [];
  for (let c = 0; c < numCols; c++) legendWidths.push(750, 1950);
  const legendTable = table([legendHeader, ...legendBody], { widths: legendWidths, fontSize: 13, borders: false, vMargin: 2 });

  // ── Signatures (3 side-by-side blocks, kept on one page) ──
  const sigBlock = (label, name, title) =>
    para([{ text: label, size: 16 }], { spacingAfter: 260 }) +
    para([{ text: name, bold: true, size: 18 }], { spacingAfter: 0 }) +
    para([{ text: title, size: 14 }], { spacingAfter: 0 });
  const sigTable = table([[
    { content: sigBlock('Prepared by:', subject.instructorName || 'INSTRUCTOR', "Instructor's signature") },
    { content: sigBlock('Approved by:', 'LOYDA B. DACANAY, LPT, MBA', 'Program Head') },
    { content: sigBlock('Certified True & Correct:', 'ARCHIE MAY L. MANANGKILA', 'Registrar') },
  ]], { widths: [3600, 3600, 3600], borders: false, vMargin: 0, keepRows: true });

  return head + infoTable + spacer() + gradesTable + spacer() +
    para('GRADING SYSTEM:', { bold: true, size: 16, spacingBefore: 100, spacingAfter: 40 }) +
    legendTable + spacer() + spacer() + sigTable;
}

async function fetchImageBytes(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// sections: [{ name, students }]
export async function downloadGradingSheetDocx({ subject, sections, instructorName, fileName }) {
  const subjectWithInstructor = { ...subject, instructorName: (instructorName || '').toUpperCase() };
  const logo = await fetchImageBytes('/vipc.png');
  const images = logo ? [{ id: LOGO_REL, name: 'logo.png', ext: 'png', data: logo }] : [];

  const body = sections
    .map((sec, i) => (i > 0 ? pageBreak() : '') + buildSectionXml(subjectWithInstructor, sec.name, sec.students, !!logo))
    .join('');

  const blob = createDocxBlob(body, { paper: 'legal', images });
  saveAs(blob, `${fileName}.docx`);
}
