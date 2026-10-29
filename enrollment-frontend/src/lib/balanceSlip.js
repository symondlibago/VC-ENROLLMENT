/**
 * The student balance slip: a statement of account on one third of a short
 * bond sheet, the strip the cashier's office already cuts and files.
 *
 * Every coordinate is in millimetres from the top-left of that strip. The
 * layout is drawn by hand rather than flowed, because a flowed table that
 * grows by one row on a 93mm page spills onto a second sheet — and a balance
 * whose total prints on a strip of paper nobody kept is worse than no slip.
 * For the same reason the row counts are fixed: seven assessment lines, seven
 * credit lines, with anything beyond that collapsed into a carried line.
 */

import {
  TERMS_PER_SEMESTER,
  formatAmount,
  formatPeso,
  formatSlipDate,
  summarizeAccount,
  toAmount,
} from './accountBalance.js';

/** 8.5in wide by one crosswise third of an 11in sheet. */
export const SLIP_WIDTH = 215.9;
export const SLIP_HEIGHT = 93.1;

const BRAND = [156, 38, 44]; // --dominant-red, #9c262c
const SETTLED = [21, 94, 48];
const INK = [17, 17, 17];
const MUTED = [110, 110, 110];
const HAIRLINE = [178, 178, 178];
const WASH = [245, 245, 245];
const PAPER = [255, 255, 255];

const EDGE = 4; // the printed border, inset from the cut
const LEFT = 8.5;
const RIGHT = SLIP_WIDTH - 8.5;
const SPLIT = 107.75; // the divider between assessment and credits
const COL_A_END = SPLIT - 3.75;
const COL_B_START = SPLIT + 3.75;

const ROW_STEP = 3.4;
const ROW_COUNT = 7;
const FIRST_ROW_Y = 42.0;
const RULE_Y = 64.0;
const TOTAL_Y = 67.4;

const SCHOOL = 'VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE, INC.';
const ADDRESS = 'Prince Pad Bldg., Antonio Luna St., Mabulay Subd., Cagayan de Oro City';
const CONTACT = '(088) 856 8646  /  +63 963 947 7295';
const SIGNATORY = 'ESTEPHANIE E. TRIGUEROS';
const SIGNATORY_TITLE = 'Cashier / Finance Officer';

/** Shorten to fit, with an ellipsis. Assumes the font size is already set. */
const clip = (doc, text, maxWidth) => {
  const value = String(text ?? '').trim();
  if (!value || doc.getTextWidth(value) <= maxWidth) return value;

  let cut = value;
  while (cut.length > 1 && doc.getTextWidth(`${cut}...`) > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}...`;
};

const setInk = (doc, [r, g, b]) => doc.setTextColor(r, g, b);
const setStroke = (doc, [r, g, b]) => doc.setDrawColor(r, g, b);
const setFill = (doc, [r, g, b]) => doc.setFillColor(r, g, b);

const rule = (doc, x1, x2, y, { width = 0.1, color = HAIRLINE } = {}) => {
  setStroke(doc, color);
  doc.setLineWidth(width);
  doc.line(x1, y, x2, y);
};

/**
 * One statement line: a label on the left, an amount hard against the right,
 * and a dotted leader bridging whatever gap is left.
 */
const statementRow = (doc, { y, left, right, label, amount, note, noteX, size = 6.3, bold = false, color = INK }) => {
  doc.setFontSize(size).setFont('helvetica', bold ? 'bold' : 'normal');
  setInk(doc, color);

  const labelText = clip(doc, label, (right - left) * 0.6);
  doc.text(labelText, left, y);
  let leaderStart = left + doc.getTextWidth(labelText) + 1.5;

  if (note) {
    const noteText = clip(doc, note, right - noteX - 20);
    doc.text(noteText, noteX, y);
    leaderStart = noteX + doc.getTextWidth(noteText) + 1.5;
  }

  const amountText = amount === null || amount === undefined ? '' : formatAmount(amount);
  if (amountText) {
    doc.text(amountText, right, y, { align: 'right' });
    const leaderEnd = right - doc.getTextWidth(amountText) - 1.5;

    if (!bold && leaderEnd - leaderStart > 3) {
      setStroke(doc, HAIRLINE);
      doc.setLineWidth(0.1);
      doc.setLineDashPattern([0.3, 0.7], 0);
      doc.line(leaderStart, y - 0.7, leaderEnd, y - 0.7);
      doc.setLineDashPattern([], 0);
    }
  }
};

const columnHeading = (doc, { x, endX, text }) => {
  doc.setFontSize(6.4).setFont('helvetica', 'bold');
  setInk(doc, BRAND);
  doc.text(text, x, 37.6);
  rule(doc, x, endX, 38.8, { width: 0.3, color: BRAND });
};

const field = (doc, { labelX, valueX, y, label, value, valueEnd }) => {
  doc.setFontSize(5.6).setFont('helvetica', 'bold');
  setInk(doc, MUTED);
  doc.text(label, labelX, y);

  doc.setFontSize(7.2).setFont('helvetica', 'bold');
  setInk(doc, INK);
  doc.text(clip(doc, value || '—', valueEnd - valueX), valueX, y);
};

const drawHeader = (doc, { logo, reference, printedAt }) => {
  if (logo) {
    try {
      doc.addImage(logo.data, logo.format, LEFT, 5.0, 11, 11);
    } catch (error) {
      // A missing logo must never cost the cashier the slip
      console.error('Balance slip logo could not be drawn', error);
    }
  }

  const textX = logo ? LEFT + 14 : LEFT;

  doc.setFontSize(8.6).setFont('helvetica', 'bold');
  setInk(doc, BRAND);
  doc.text(SCHOOL, textX, 9.0);

  doc.setFontSize(5.4).setFont('helvetica', 'normal');
  setInk(doc, MUTED);
  doc.text(ADDRESS, textX, 12.2);
  doc.text(CONTACT, textX, 15.0);

  doc.setFontSize(10).setFont('helvetica', 'bold');
  setInk(doc, INK);
  doc.text('STATEMENT OF ACCOUNT', RIGHT, 8.6, { align: 'right' });

  doc.setFontSize(5.8).setFont('helvetica', 'normal');
  setInk(doc, MUTED);
  doc.text('Balance Inquiry  •  Student Copy', RIGHT, 12.0, { align: 'right' });
  doc.text(`Ref ${reference}  •  Printed ${printedAt}`, RIGHT, 15.0, { align: 'right' });

  rule(doc, LEFT, RIGHT, 17.6, { width: 0.6, color: BRAND });
  rule(doc, LEFT, RIGHT, 18.5);
};

const drawStudentBand = (doc, { student }) => {
  setFill(doc, WASH);
  setStroke(doc, HAIRLINE);
  doc.setLineWidth(0.1);
  doc.rect(LEFT, 19.2, RIGHT - LEFT, 14.4, 'FD');

  doc.line(114, 20.2, 114, 32.6);

  const rows = [23.1, 27.7, 32.3];
  const course = student?.course?.course_code
    ? `[${student.course.course_code}] ${student.course.course_name || ''}`.trim()
    : student?.course?.course_name || '';
  const section = student?.sections?.[0]?.name;

  const name = [student?.last_name, student?.first_name]
    .filter(Boolean)
    .join(', ')
    .concat(student?.middle_name ? ` ${student.middle_name[0]}.` : '')
    .toUpperCase();

  field(doc, { labelX: 11, valueX: 33.5, valueEnd: 112, y: rows[0], label: 'STUDENT NO.', value: student?.student_id_number });
  field(doc, { labelX: 11, valueX: 33.5, valueEnd: 112, y: rows[1], label: 'NAME', value: name });
  field(doc, { labelX: 11, valueX: 33.5, valueEnd: 112, y: rows[2], label: 'COURSE', value: course });

  field(doc, { labelX: 118, valueX: 146, valueEnd: RIGHT - 2.5, y: rows[0], label: 'SCHOOL YEAR', value: student?.school_year ? `A.Y. ${student.school_year}` : '' });
  field(doc, {
    labelX: 118,
    valueX: 146,
    valueEnd: RIGHT - 2.5,
    y: rows[1],
    label: 'YEAR / SEM',
    value: [student?.year, student?.semester].filter(Boolean).join('  •  '),
  });
  field(doc, {
    labelX: 118,
    valueX: 146,
    valueEnd: RIGHT - 2.5,
    y: rows[2],
    label: 'SECTION / SCHOLARSHIP',
    value: [section, student?.scholarship].filter(Boolean).join('  •  '),
  });
};

const drawAssessment = (doc, { summary }) => {
  columnHeading(doc, { x: LEFT, endX: COL_A_END, text: 'ASSESSMENT FOR THIS TERM' });

  summary.fees.forEach((fee, index) => {
    statementRow(doc, {
      y: FIRST_ROW_Y + index * ROW_STEP,
      left: LEFT,
      right: COL_A_END,
      label: fee.label,
      amount: fee.amount,
    });
  });

  rule(doc, LEFT, COL_A_END, RULE_Y, { width: 0.3, color: INK });
  statementRow(doc, {
    y: TOTAL_Y,
    left: LEFT,
    right: COL_A_END,
    label: 'TOTAL ASSESSMENT',
    amount: summary.assessment,
    size: 7.4,
    bold: true,
  });
};

/**
 * The credit lines, in a fixed number of slots.
 *
 * Down payment and discount always take the first two. The installments fill
 * what is left, newest last; anything that does not fit is summed into a
 * single carried line so the total still reconciles on the page.
 */
export const creditLines = (summary, termPayments) => {
  const lines = [
    { label: 'Down Payment', amount: summary.downPayment },
    {
      label: summary.discountRate ? `Discount (${formatAmount(summary.discountRate).replace(/\.00$/, '')}%)` : 'Discount',
      amount: summary.discount,
    },
  ];

  const posted = [...(termPayments || [])]
    .filter((payment) => toAmount(payment?.amount) !== 0 || payment?.or_number)
    .sort((a, b) => String(a?.payment_date ?? '').localeCompare(String(b?.payment_date ?? '')));

  const slots = ROW_COUNT - lines.length;

  if (posted.length === 0) {
    lines.push({ label: 'No term payment posted yet', amount: null, muted: true });
    return lines;
  }

  const shown = posted.length > slots ? posted.slice(posted.length - (slots - 1)) : posted;
  const carried = posted.slice(0, posted.length - shown.length);

  if (carried.length > 0) {
    lines.push({
      label: `${carried.length} earlier payment${carried.length === 1 ? '' : 's'}`,
      amount: carried.reduce((total, payment) => total + toAmount(payment.amount), 0),
      muted: true,
    });
  }

  shown.forEach((payment) => {
    lines.push({
      label: formatSlipDate(payment.payment_date),
      note: payment.or_number ? `OR# ${payment.or_number}` : 'OR# —',
      amount: toAmount(payment.amount),
    });
  });

  return lines;
};

const drawCredits = (doc, { summary, termPayments }) => {
  columnHeading(doc, { x: COL_B_START, endX: RIGHT, text: 'PAYMENTS & CREDITS APPLIED' });

  creditLines(summary, termPayments).slice(0, ROW_COUNT).forEach((line, index) => {
    statementRow(doc, {
      y: FIRST_ROW_Y + index * ROW_STEP,
      left: COL_B_START,
      right: RIGHT,
      noteX: COL_B_START + 22,
      color: line.muted ? MUTED : INK,
      ...line,
    });
  });

  rule(doc, COL_B_START, RIGHT, RULE_Y, { width: 0.3, color: INK });
  statementRow(doc, {
    y: TOTAL_Y,
    left: COL_B_START,
    right: RIGHT,
    label: 'TOTAL CREDITS',
    amount: summary.credits,
    size: 7.4,
    bold: true,
  });
};

const drawBalanceBand = (doc, { summary, agreedTerm }) => {
  const settled = summary.balance === 0;

  setFill(doc, settled ? SETTLED : BRAND);
  doc.rect(LEFT, 70.0, RIGHT - LEFT, 9.8, 'F');

  doc.setFontSize(7.6).setFont('helvetica', 'bold');
  setInk(doc, PAPER);
  doc.text(settled ? 'FULLY PAID FOR THIS TERM' : 'REMAINING BALANCE', LEFT + 3.5, 76.6);

  doc.setFontSize(13).setFont('helvetica', 'bold');
  doc.text(formatPeso(summary.balance), LEFT + 56, 76.6);

  doc.setFontSize(5.8).setFont('helvetica', 'normal');
  doc.text(
    settled
      ? 'No further installment due for this term.'
      : `Installment per term (${TERMS_PER_SEMESTER}x):  ${formatPeso(agreedTerm)}`,
    RIGHT - 3.5,
    74.2,
    { align: 'right' },
  );
  doc.text(
    summary.advance > 0
      ? `Advance payment carried forward:  ${formatPeso(summary.advance)}`
      : 'No advance payment on file for this term.',
    RIGHT - 3.5,
    78.2,
    { align: 'right' },
  );
};

const drawFooter = (doc, { priorPayments }) => {
  doc.setFontSize(5.6).setFont('helvetica', 'italic');
  setInk(doc, MUTED);
  doc.text('This is a statement of account for balance inquiry only. It is NOT an official receipt.', LEFT, 84.0);

  const prior = (priorPayments || []).reduce((total, payment) => total + toAmount(payment?.amount), 0);
  doc.setFont('helvetica', 'normal');
  doc.text(
    priorPayments?.length
      ? `Earlier terms on record: ${priorPayments.length} payment${priorPayments.length === 1 ? '' : 's'} totalling ${formatPeso(prior)}, already carried in Previous Account.`
      : 'Settle balances at the Cashier\'s Office before the examination permit is released.',
    LEFT,
    87.3,
  );

  const lineStart = 150;
  const lineEnd = RIGHT;
  const center = (lineStart + lineEnd) / 2;

  doc.setFontSize(6.5).setFont('helvetica', 'bold');
  setInk(doc, INK);
  doc.text(SIGNATORY, center, 84.6, { align: 'center' });

  rule(doc, lineStart, lineEnd, 85.4, { width: 0.3, color: INK });

  doc.setFontSize(5.6).setFont('helvetica', 'normal');
  setInk(doc, MUTED);
  doc.text(SIGNATORY_TITLE, center, 88.6, { align: 'center' });

  return 89.2; // the lowest ink on the page
};

/** `SOA-2024000123-2610291545`, unique per print and readable over the phone. */
export const slipReference = (student, now = new Date()) => {
  const stamp = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');

  return `SOA-${student?.student_id_number || student?.id || '0'}-${stamp}`;
};

const printedStamp = (now) => {
  const time = now
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toUpperCase();
  return `${formatSlipDate(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  )} ${time}`;
};

/**
 * Draw the slip onto an already-sized document.
 *
 * Returns the y of the lowest ink drawn, so a test can assert the layout
 * still clears the bottom edge rather than trusting that it looks right.
 */
export const drawBalanceSlip = (doc, { student, paymentData, termPayments = [], priorPayments = [], logo = null, now = new Date() }) => {
  const summary = summarizeAccount(paymentData, termPayments);

  // The installment the student agreed to, which is what they came to ask
  // about. Falls back to an even split when nothing was recorded.
  const agreedTerm = toAmount(paymentData?.term_payment) || summary.perTerm;

  setStroke(doc, BRAND);
  doc.setLineWidth(0.7);
  doc.rect(EDGE, 3, SLIP_WIDTH - EDGE * 2, SLIP_HEIGHT - 6);

  drawHeader(doc, { logo, reference: slipReference(student, now), printedAt: printedStamp(now) });
  drawStudentBand(doc, { student });
  drawAssessment(doc, { summary });
  drawCredits(doc, { summary, termPayments });
  drawBalanceBand(doc, { summary, agreedTerm });

  return drawFooter(doc, { priorPayments });
};
