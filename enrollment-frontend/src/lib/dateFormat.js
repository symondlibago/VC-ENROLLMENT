/**
 * CustomCalendar hands back a display date ("10/08/2026"); the API stores and
 * validates ISO dates. This converts between the two without going through
 * UTC, so the day never slips by one.
 */
export const toIsoDate = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/** Today as an ISO date, in the browser's own timezone. */
export const todayIso = () => toIsoDate(new Date());

/** An ISO date a number of days from today. */
export const isoDaysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};
