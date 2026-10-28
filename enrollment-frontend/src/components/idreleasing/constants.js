// Shared vocabulary for the ID board. The strings here are the ones the API
// stores, so a status or reason is named in exactly one place.

export const CARD_STATUS = {
  awaiting: { label: 'Awaiting Print', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
  pending: { label: 'For Printing', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
  printed: { label: 'Printed', tone: 'bg-blue-100 text-blue-800 border-blue-200' },
  released: { label: 'Released', tone: 'bg-green-100 text-green-800 border-green-200' },
  lost: { label: 'Lost', tone: 'bg-red-100 text-red-800 border-red-200' },
  voided: { label: 'Voided', tone: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const CARD_REASON = {
  initial: 'First ID',
  lost: 'Replacement — lost',
  damaged: 'Replacement — damaged',
  renewal: 'Renewal',
  correction: 'Reprint — correction',
};

export const REPLACEMENT_REASONS = [
  { value: 'lost', label: 'Lost' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'correction', label: 'Correction of details' },
];

export const SUPPLY_CATEGORIES = [
  { value: 'sling', label: 'Sling' },
  { value: 'holder', label: 'ID Holder' },
  { value: 'card', label: 'Card Stock' },
  { value: 'other', label: 'Other' },
];

export const BOARD_FILTERS = [
  { value: 'all', label: 'All students' },
  { value: 'awaiting', label: 'Awaiting print' },
  { value: 'printed', label: 'Printed, not released' },
  { value: 'released', label: 'Released' },
  { value: 'lost', label: 'Reported lost' },
];

export const statusOf = (card) => (card ? card.status : 'awaiting');

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const peso = (value) =>
  value === null || value === undefined
    ? '—'
    : `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
