
import { saveAs } from 'file-saver';
import { createDocxBlob, para, table, spacer, pageBreak } from './docx';

const RED = 'B91C1C';

function buildScheduleXml(instructorName, cs) {
  const header =
    para('VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE', { size: 18, color: '646464', spacingAfter: 40 }) +
    para([{ text: 'Instructor: ', bold: true, size: 28 }, { text: instructorName, bold: true, size: 28 }], { spacingAfter: 60 }) +
    para([{ text: 'Subject: ', size: 22 }, { text: `${cs.subject_code} - ${cs.descriptive_title}`, size: 22 }], { spacingAfter: 20 }) +
    para([{ text: 'Section: ', size: 22 }, { text: String(cs.section_name ?? ''), size: 22 }], { spacingAfter: 20 }) +
    para([{ text: 'Schedule: ', size: 22 }, { text: `${cs.schedule_time || 'TBA'} | Room: ${cs.room || 'TBA'}`, size: 22 }], { spacingAfter: 80 });

  const headerCell = (t) => ({ text: t, bold: true, align: 'center', size: 18, color: 'FFFFFF', fill: RED });
  const headRow = [headerCell('#'), headerCell('Student ID'), headerCell('Name'), headerCell('Course'), headerCell('Year'), headerCell('Gender')];

  const rows = (cs.students || []).map((s, i) => [
    { text: String(i + 1), align: 'center', size: 18 },
    { text: String(s.student_id ?? ''), align: 'center', size: 18 },
    { text: (s.name || '').toUpperCase(), align: 'left', size: 18 },
    { text: String(s.course ?? ''), align: 'left', size: 18 },
    { text: String(s.year ?? ''), align: 'center', size: 18 },
    { text: String(s.gender ?? ''), align: 'center', size: 18 },
  ]);

  const tbl = table([headRow, ...rows], {
    widths: [700, 1900, 3700, 2200, 1300, 1200],
    fontSize: 18,
  });

  const footer = para(`Generated on ${new Date().toLocaleDateString()}`, { size: 14, color: '969696', spacingBefore: 120 });

  return header + tbl + spacer() + footer;
}

// rosterData: array of class schedules (same shape as the PDF export uses).
export function downloadRosterDocx({ instructorName, rosterData, fileName }) {
  const name = (instructorName || '').toString();
  const body = rosterData
    .map((cs, i) => (i > 0 ? pageBreak() : '') + buildScheduleXml(name, cs))
    .join('');
  const blob = createDocxBlob(body, { paper: 'letter' });
  saveAs(blob, `${fileName}.docx`);
}
