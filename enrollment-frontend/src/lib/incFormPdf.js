import jsPDF from 'jspdf';
import vineyardLogo from '../assets/vineyard.png';

/**
 * Loads the letterhead logo as a data URL so jsPDF can embed it reliably
 * (passing a bundled asset path straight to addImage is not dependable).
 * Resolves to null if it cannot be loaded, and the form falls back to text.
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
    image.src = vineyardLogo;
  });

/**
 * Builds the INC completion form, following the printed VIPC form: a
 * certification paragraph, the subject line, the four signatories and the
 * requirements list at the foot.
 */

export const SIGNATORIES = {
  programHead: 'JONAS DIU GAMBA',
  cashier: 'Estephanie E. Trigueros',
  registrar: 'ARCHIE MAY L. MANANGKILA',
};

const SCHOOL = {
  name: 'Vineyard International Polytechnic College',
  address: 'Prince Padi Bldg., A. Luna St., Cagayan de Oro City, Philippines 9000',
  tel: 'Tel. Nos. (088) 856-8646; (08822) 72-94-19',
  footerAddress: 'Antonio Luna Street, Cagayan de Oro City',
  footerTel: '(088) 856 - 8646 / (08822) 72 - 9419',
  email: 'askvineyard@vipc.edu.ph',
  website: 'www.vipc.edu.ph',
};

const REQUIREMENTS = [
  'Covered within 6 week-period within the term.',
  'The completion is done by the student on the date specified by the Dean for the special examination, and will be submitted within ten (10) days after the specified date.',
  'The student should attach the Special Examination Permit/ Receipt of Payment for completion charges.',
  'The instructor should attached the academic requirement to justify the rating given and is required to take note carefully the Course Code, Descriptive Title and School Year the subject was actually taken by the student.',
  "This form is to submit by the College Secretary to the Registrar' Office.",
];

/** Draws a value sitting on an underline, the way the printed form does. */
const underlinedValue = (doc, value, x, y, width, { align = 'center', size = 10 } = {}) => {
  doc.setLineWidth(0.3);
  doc.line(x, y + 1, x + width, y + 1);
  if (value) {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'normal');
    const textX = align === 'center' ? x + width / 2 : x;
    doc.text(String(value), textX, y, { align: align === 'center' ? 'center' : 'left' });
  }
};

/**
 * @param {object} form  one INC record shaped by buildFormData()
 * @param {jsPDF} [doc]  existing document to append a page to
 */
export const drawIncForm = (form, doc = null, logo = null) => {
  const pdf = doc || new jsPDF({ unit: 'mm', format: 'letter' });
  if (doc) pdf.addPage();

  const pageWidth = pdf.internal.pageSize.getWidth();
  const left = 18;
  const right = pageWidth - 18;
  const contentWidth = right - left;
  let y = 20;

  // ── Letterhead: the Vineyard logo, or plain text if it could not be loaded
  if (logo?.dataUrl) {
    const logoWidth = 52;
    const logoHeight = logo.height && logo.width
      ? (logo.height / logo.width) * logoWidth
      : 13;
    pdf.addImage(logo.dataUrl, 'PNG', (pageWidth - logoWidth) / 2, y - 6, logoWidth, logoHeight);
    y += Math.max(logoHeight - 6, 6);
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(60, 60, 60);
    pdf.text('Vineyard', left, y);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('INTERNATIONAL POLYTECHNIC   COLLEGE', left, y + 5);
    y += 8;
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  y += 6;
  pdf.text(SCHOOL.address, pageWidth / 2, y, { align: 'center' });
  y += 4.5;
  pdf.text(SCHOOL.tel, pageWidth / 2, y, { align: 'center' });

  // ── Certification paragraph
  y += 14;
  pdf.setFontSize(10);
  pdf.text('This is to certify that Mr./Ms.', left, y);
  underlinedValue(pdf, form.studentName, left + 50, y, 62);
  pdf.text('is/was officially enrolled as', left + 114, y);
  underlinedValue(pdf, form.courseCode, right - 28, y, 28);

  y += 8;
  pdf.text('Student in the College of', left, y);
  underlinedValue(pdf, form.college, left + 43, y, 26);
  pdf.text('during the', left + 71, y);
  underlinedValue(pdf, form.semesterOrdinal, left + 89, y, 16);
  pdf.text('Semester of School Year', left + 107, y);
  underlinedValue(pdf, form.schoolYear, left + 150, y, 28);
  pdf.text('.', left + 179, y);

  y += 8;
  pdf.text('This is to complete his/her INC mark of the subject enrolled during the', left, y);
  underlinedValue(pdf, form.incSemesterOrdinal, left + 118, y, 16);
  pdf.text('Semester, School Year', left + 136, y);
  y += 8;
  underlinedValue(pdf, form.incSchoolYear, left, y, 30);
  pdf.text('.', left + 31, y);

  // ── Subject table
  y += 12;
  const columns = [
    { label: 'Course Code', x: left, width: 30, value: form.subjectCode },
    { label: 'Descriptive Title', x: left + 34, width: 66, value: form.descriptiveTitle },
    { label: 'Rating', x: left + 104, width: 20, value: form.rating },
    { label: 'Units', x: left + 128, width: 18, value: form.units },
    { label: 'Remarks', x: left + 150, width: 28, value: form.remarks },
  ];

  pdf.setFontSize(10);
  columns.forEach((col) => {
    pdf.text(col.label, col.x + col.width / 2, y, { align: 'center' });
  });

  y += 10;
  columns.forEach((col) => {
    const text = col.value == null ? '' : String(col.value);
    // Long titles are shrunk rather than wrapped, to keep the row on one line
    const size = col.label === 'Descriptive Title' && text.length > 34 ? 7.5 : 9.5;
    pdf.setFontSize(size);
    pdf.setLineWidth(0.3);
    pdf.line(col.x, y + 1, col.x + col.width, y + 1);
    if (text) pdf.text(text, col.x + col.width / 2, y, { align: 'center', maxWidth: col.width });
  });

  pdf.setFontSize(10);
  y += 10;
  pdf.text('The above subject has been completed with the submission of the following hereto attached.', left, y);
  y += 8;
  pdf.line(left, y, right, y);

  y += 8;
  pdf.text('This certification issued for submission to the Registrar\'s Office.', left, y);

  // ── Signatories
  y += 14;
  const colLeft = left;
  const colRight = left + 100;

  pdf.text('Attested by:', colLeft, y);
  pdf.text('Grade Given by:', colRight, y);

  y += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.text(SIGNATORIES.programHead, colLeft, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(form.instructorName || '', colRight, y);

  // Underline both names
  pdf.line(colLeft, y + 1, colLeft + pdf.getTextWidth(SIGNATORIES.programHead), y + 1);
  if (form.instructorName) {
    pdf.line(colRight, y + 1, colRight + pdf.getTextWidth(form.instructorName), y + 1);
  }

  y += 5;
  pdf.setFontSize(9);
  pdf.text('Program Head', colLeft, y);
  pdf.text('Signature over printed name of Instructor', colRight, y);

  y += 14;
  pdf.setFontSize(10);
  pdf.text('Approved by:', colLeft, y);

  y += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.text(SIGNATORIES.registrar, colLeft, y);
  pdf.setFont('helvetica', 'normal');
  pdf.line(colLeft, y + 1, colLeft + pdf.getTextWidth(SIGNATORIES.registrar), y + 1);

  y += 5;
  pdf.setFontSize(9);
  pdf.text('College Registrar', colLeft, y);

  // Payment details, so the form carries its own proof of payment
  if (form.orNumber) {
    y += 10;
    pdf.setFontSize(9);
    pdf.text(
      `O.R. No. ${form.orNumber}   ·   Amount: PHP ${Number(form.amount || 0).toFixed(2)}` +
        (form.paymentDate ? `   ·   Paid: ${form.paymentDate}` : '') +
        `   ·   Received by: ${SIGNATORIES.cashier}`,
      colLeft,
      y
    );
  }

  // ── Requirements
  y += 12;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('REQUIREMENTS FOR APPROVAL OF COMPLETION RATING:', left, y);

  y += 6;
  pdf.setFontSize(9);
  REQUIREMENTS.forEach((text, i) => {
    const lines = pdf.splitTextToSize(`${i + 1}.  ${text}`, contentWidth - 4);
    pdf.text(lines, left + 2, y);
    y += lines.length * 4 + 1.5;
  });

  y += 4;
  pdf.setFont('helvetica', 'bold');
  pdf.text('THE STUDENT IS NOT ALLOWED TO HANDCARRY THIS FORM.', pageWidth / 2, y, { align: 'center' });

  // ── Footer
  const footerY = pdf.internal.pageSize.getHeight() - 22;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);
  pdf.text(SCHOOL.name, right, footerY, { align: 'right' });
  pdf.text(SCHOOL.footerAddress, right, footerY + 4, { align: 'right' });
  pdf.text(SCHOOL.footerTel, right, footerY + 8, { align: 'right' });
  pdf.text(SCHOOL.email, right, footerY + 12, { align: 'right' });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text(SCHOOL.website, left, footerY + 12);

  return pdf;
};

/** One PDF holding a page per selected INC record. */
export const downloadIncForms = async (forms, fileName = 'INC_Completion_Form') => {
  if (!forms.length) return;

  const logo = await loadLogo();

  let doc = null;
  forms.forEach((form) => {
    doc = drawIncForm(form, doc, logo);
  });
  doc.save(`${fileName}.pdf`);
};
