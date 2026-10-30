/**
 * The arithmetic behind a student's account for one term.
 *
 * Kept in one place because three things have to agree to the centavo: the
 * payment modal on screen, the balance slip the cashier hands over, and the
 * figures saved back to the record. Recomputing it per consumer is how a
 * printed balance ends up contradicting the screen it was printed from.
 */

/** A money field as a number. Blank, null and nonsense all read as zero. */
export const toAmount = (value) => {
  const amount = parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
};

/**
 * The assessment lines, in the order they are charged and printed.
 * Mirrors the fee columns on the payments table.
 */
export const ASSESSMENT_FEES = [
  { key: 'previous_account', label: 'Previous Account' },
  { key: 'registration_fee', label: 'Registration Fee' },
  { key: 'tuition_fee', label: 'Tuition Fee' },
  { key: 'laboratory_fee', label: 'Laboratory Fee' },
  { key: 'miscellaneous_fee', label: 'Miscellaneous Fee' },
  { key: 'other_fees', label: 'Other Fees' },
  { key: 'bundled_program_fee', label: 'Bundled Program Fee' },
];

/** A semester is settled over four term payments. */
export const TERMS_PER_SEMESTER = 4;

/**
 * What the student owes for this term, and what has been credited against it.
 *
 * `termPayments` is the current term's installments only — earlier terms are
 * already carried by Previous Account, so counting them again would credit
 * the same money twice.
 *
 * An overpayment never shows as a negative balance: it lands in `advance`,
 * which is the credit the next term starts with.
 */
export const summarizeAccount = (paymentData = {}, termPayments = []) => {
  const fees = ASSESSMENT_FEES.map((fee) => ({
    ...fee,
    amount: toAmount(paymentData[fee.key]),
  }));

  const assessment = fees.reduce((total, fee) => total + fee.amount, 0);

  const discount = toAmount(paymentData.discount_deduction);
  const downPayment = toAmount(paymentData.payment_amount);
  const installments = (termPayments || []).reduce(
    (total, payment) => total + toAmount(payment?.amount),
    0,
  );

  // Subtracted one credit at a time rather than against their sum. The two
  // are the same arithmetic but not the same floating-point result, and the
  // difference shows up as a one-centavo drift on the rounded peso figure.
  // This order is the one the saved records were computed with.
  const net = assessment - discount - downPayment - installments;

  // Derived back out of the balance so the three printed totals always
  // reconcile on the slip: assessment - credits is the balance, exactly.
  const credits = assessment - net;

  return {
    fees,
    assessment,
    discount,
    discountRate: toAmount(paymentData.discount),
    downPayment,
    installments,
    credits,
    balance: net > 0 ? net : 0,
    advance: net < 0 ? -net : 0,
    /** The installment that would settle the remaining balance over the term. */
    perTerm: net > 0 ? net / TERMS_PER_SEMESTER : 0,
    isSettled: net <= 0,
  };
};

/** Money, to the centavo. */
const round2 = (value) => Math.round(value * 100) / 100;

/**
 * A student's account for the term they are currently enrolled in, or null
 * when they have not been assessed.
 *
 * Only payments stamped with that same term count: earlier terms are already
 * carried by Previous Account, and counting them again credits the same money
 * twice.
 *
 * `paid` is money actually received — the down payment plus the installments.
 * The discount is deliberately left out of it: a discount reduces what is
 * owed but never reaches the drawer, and a collections figure that counts it
 * as cash overstates the day's takings.
 *
 * Null covers two cases that mean the same thing to whoever reads the report:
 * no billing row at all, and a row that was created but never filled in.
 * Nothing charged, nothing received and nothing discounted is not a student
 * who has settled — it is a student nobody has billed yet, and calling that
 * "fully paid" quietly inflates the paid list with people who owe an unknown
 * amount.
 */
export const termAccountFor = (payment, student) => {
  if (!payment) return null;

  const termPayments = (payment.term_payments || []).filter(
    (entry) =>
      entry?.year === student?.year &&
      entry?.semester === student?.semester &&
      entry?.school_year === student?.school_year,
  );

  const account = summarizeAccount(payment, termPayments);

  const assessed = round2(account.assessment);
  const discount = round2(account.discount);
  const paid = round2(account.downPayment + account.installments);

  if (assessed === 0 && discount === 0 && paid === 0) return null;

  return {
    assessed,
    discount,
    paid,
    advance: round2(account.advance),
    remaining: round2(account.balance),
  };
};

/** `12345.5` → `"12,345.50"`. No currency mark: callers choose the prefix. */
export const formatAmount = (value) =>
  toAmount(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * `"12,345.50"` with a currency mark.
 *
 * Spelt PHP rather than ₱ on purpose: the PDF uses the standard Helvetica
 * encoding, which has no peso sign and would print a blank box in its place.
 */
export const formatPeso = (value) => `PHP ${formatAmount(value)}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A payment date as `29 Oct 2026`.
 *
 * Read off the stored `YYYY-MM-DD` directly rather than through `new Date()`,
 * which parses a bare date as UTC midnight and can print the day before.
 */
export const formatSlipDate = (value) => {
  if (!value) return '';

  const parts = String(value).slice(0, 10).split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 0) {
      return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`;
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return `${String(parsed.getDate()).padStart(2, '0')} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
};
