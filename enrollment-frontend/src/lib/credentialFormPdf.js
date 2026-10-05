import jsPDF from 'jspdf';
import circleLogo from '../assets/circlelogo.jpg';
import { CREDENTIAL_ROWS } from './credentialOptions';

/**
 * Credential Request Form (VIPC-RO-15) — the printed form the registrar issues,
 * reproduced so a released request has a soft copy: the request itself, the
 * clearance signatures it collected, and the claim stub at the foot.
 */

export const SIGNATORIES = {
  registrar: 'ARCHIE MAY L. MANANGKILA',
};

const SCHOOL = {
  name: 'VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE',
  address: 'Prince Padi Bldg., A. Luna Street, Mabulay Subdivision',
  city: 'Cagayan de Oro City, Philippines 9000',
  tel: 'Tel. Nos. (088) 856-8646 / (08822) 729-419',
  email: 'E-mail Address: vipc_cdo07@yahoo.com.ph',
};

/** The clearance desks as they are laid out on the printed form. */
const CLEARANCE_LAYOUT = [
  [{ key: 'cashier', label: 'Finance Officer/Cashier:' }, { key: 'laboratory', label: 'Laboratory:' }],
  [{ key: 'librarian', label: 'Librarian:' }, { key: 'registrar', label: 'Registrar:' }],
  [{ key: 'program_head', label: 'Program Head:' }],
];

/**
 * Loads the seal as a data URL — passing a bundled asset path straight to
 * addImage is not dependable. Resolves to null and the form falls back to text.
 */
export const loadLogo = () =>
  new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext('2d').drawImage(image, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width: image.naturalWidth, height: image.naturalHeight });
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = circleLogo;
  });

/** A value sitting on an underline, the way the printed form is filled in. */
const onLine = (pdf, value, x, y, width, { size = 9, bold = false, align = 'left' } = {}) => {
  pdf.setLineWidth(0.25);
  pdf.line(x, y + 1, x + width, y + 1);

  if (!value) return;

  pdf.setFont('helvetica', bold ? 'bold' : 'normal');
  pdf.setFontSize(size);
  const text = String(value);
  const centred = align === 'center';
  pdf.text(text, centred ? x + width / 2 : x + 1, y, {
    align: centred ? 'center' : 'left',
    maxWidth: width,
  });
  pdf.setFont('helvetica', 'normal');
};

/** What a requested credential shows on its line: pages and any note. */
const credentialValue = (entry) => {
  if (!entry) return '';
  const parts = [];
  if (entry.pages) parts.push(`${entry.pages} page${Number(entry.pages) === 1 ? '' : 's'}`);
  if (entry.remarks) parts.push(entry.remarks);
  return parts.join(' — ') || '✓';
};

/**
 * @param {object} form   one request shaped by buildCredentialForm()
 * @param {jsPDF} [doc]   existing document to append a page to
 * @param {object} [logo] result of loadLogo()
 */
export const drawCredentialForm = (form, doc = null, logo = null) => {
  const pdf = doc || new jsPDF({ unit: 'mm', format: 'letter' });
  if (doc) pdf.addPage();

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = 18;
  const right = pageWidth - 18;
  let y = 18;

  // ── Letterhead: the seal at the left, the school block centred beside it
  const textCentre = left + 16 + (right - left - 16) / 2;

  if (logo?.dataUrl) {
    const size = 24;
    pdf.addImage(logo.dataUrl, 'PNG', left, y - 2, size, size);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text(SCHOOL.name, textCentre, y + 3, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text(SCHOOL.address, textCentre, y + 8.5, { align: 'center' });
  pdf.text(SCHOOL.city, textCentre, y + 13, { align: 'center' });
  pdf.text(SCHOOL.tel, textCentre, y + 17.5, { align: 'center' });
  pdf.text(SCHOOL.email, textCentre, y + 22, { align: 'center' });

  y += 27;
  pdf.setLineWidth(0.6);
  pdf.line(left, y, right, y);

  // ── Title and date
  y += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text('CREDENTIAL REQUEST FORM', left + 28, y);

  y += 10;
  pdf.setFontSize(9.5);
  pdf.text('Date:', right - 68, y);
  onLine(pdf, form.date, right - 56, y, 56);

  // ── The request sentence
  y += 11;
  pdf.text('I', left, y);
  onLine(pdf, form.studentName, left + 4, y, 74, { bold: true });
  pdf.text('with a course of', left + 81, y);
  onLine(pdf, form.course, left + 110, y, 40, { bold: true });
  pdf.text('in the', left + 152, y);

  y += 7;
  onLine(pdf, form.semester, left, y, 22, { align: 'center' });
  pdf.text('semester, Academic Year', left + 24, y);
  onLine(pdf, form.schoolYear, left + 68, y, 38, { align: 'center' });
  pdf.text('will request the following:', left + 108, y);

  // ── Credential lines
  y += 10;
  const valueX = left + 62;
  const valueWidth = right - valueX;

  CREDENTIAL_ROWS.forEach(([key, label]) => {
    pdf.setFontSize(9.5);
    pdf.text(label, left, y);
    pdf.text(':', valueX - 4, y);
    onLine(pdf, credentialValue(form.entries?.[key]), valueX, y, valueWidth);
    y += 6.6;
  });

  // Others, with its own "please specify" blank
  pdf.text('Others', left, y);
  pdf.text('Please Specify:', left + 36, y);
  onLine(pdf, form.othersText, left + 70, y, right - (left + 70));

  y += 6.6;
  pdf.text('Purpose:', left + 36, y);
  onLine(pdf, form.purposeText, left + 56, y, right - (left + 56));

  // ── Clearance
  y += 11;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Clearance', left, y);
  pdf.setLineWidth(0.3);
  pdf.line(left, y + 1, left + pdf.getTextWidth('Clearance'), y + 1);
  pdf.setFont('helvetica', 'normal');

  y += 8;
  const columnX = [left, left + 100];

  CLEARANCE_LAYOUT.forEach((row) => {
    row.forEach((cell, columnIndex) => {
      const x = columnX[columnIndex];
      pdf.setFontSize(9.5);
      pdf.text(cell.label, x, y);

      const labelWidth = pdf.getTextWidth(cell.label) + 2;
      const lineX = x + labelWidth;
      const lineWidth = (columnIndex === 0 ? columnX[1] - 8 : right) - lineX;
      const signed = form.clearance?.[cell.key];

      onLine(pdf, signed?.name, lineX, y, lineWidth, { size: 8.5, align: 'center' });

      if (signed?.date) {
        pdf.setFontSize(6.5);
        pdf.setTextColor(120, 120, 120);
        pdf.text(signed.date, lineX + lineWidth / 2, y + 4, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
      }
    });
    y += 9;
  });

  // ── Claim stub
  y += 4;
  pdf.setLineWidth(0.3);
  pdf.setLineDashPattern([1.4, 1.4], 0);
  pdf.line(left, y, right, y);
  pdf.setLineDashPattern([], 0);

  y += 7;
  pdf.setFontSize(11);
  pdf.text('CLAIM STUB', pageWidth / 2, y, { align: 'center' });

  y += 9;
  pdf.setFontSize(9.5);
  pdf.text('Name:', left, y);
  onLine(pdf, form.claim?.name, left + 14, y, 104, { bold: true });
  pdf.text('Course:', left + 122, y);
  onLine(pdf, form.claim?.course, left + 140, y, right - (left + 140));

  y += 8;
  pdf.text('Requested on:', left, y);
  onLine(pdf, form.claim?.requestedOn, left + 28, y, 46, { align: 'center' });
  pdf.text('Please claim on:', left + 78, y);
  onLine(pdf, form.claim?.claimOn, left + 110, y, 62, { bold: true, align: 'center' });

  // ── Release
  y += 14;
  pdf.text('Released by:', left, y);

  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.text(SIGNATORIES.registrar, left, y);
  pdf.setLineWidth(0.3);
  pdf.line(left, y + 1, left + pdf.getTextWidth(SIGNATORIES.registrar), y + 1);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text('Received by:', left + 110, y);
  onLine(pdf, '', left + 134, y, right - (left + 134));

  y += 5;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.text('School Registrar', left + 6, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text('Signature over Printed Name', left + 143, y);

  // ── Form identifiers
  y += 16;
  pdf.setFontSize(8.5);
  pdf.setTextColor(60, 60, 60);
  pdf.text('Revision code: 0', right - 42, y);
  pdf.text('Issue date: February 2009', right - 42, y + 4.5);

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(9);
  pdf.text('VIPC-RO-15', left, y + 9);
  pdf.setFont('helvetica', 'normal');

  if (form.requestNumber) {
    pdf.setFontSize(7.5);
    pdf.setTextColor(140, 140, 140);
    pdf.text(`Ref. ${form.requestNumber}`, left, y + 13.5);
  }

  // ── Footer quote
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.text(
    '“We measure our success in terms of our graduates’ gainful employment.”',
    pageWidth / 2,
    pageHeight - 18,
    { align: 'center' }
  );
  pdf.setFont('helvetica', 'normal');

  return pdf;
};

/** One PDF holding a page per request. */
export const downloadCredentialForms = async (forms, fileName = 'Credential_Request_Form') => {
  if (!forms.length) return;

  const logo = await loadLogo();

  let doc = null;
  forms.forEach((form) => {
    doc = drawCredentialForm(form, doc, logo);
  });
  doc.save(`${fileName}.pdf`);
};
