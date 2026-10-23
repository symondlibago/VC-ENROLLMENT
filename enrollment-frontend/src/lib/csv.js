import { saveAs } from 'file-saver';

/**
 * CSV the way spreadsheets expect it.
 *
 * Quoting is unconditional, because a descriptive title holding a comma, a
 * surname holding a quote and a remark holding a newline are all ordinary here.
 */

/** Escapes one value: everything is quoted, inner quotes are doubled. */
const cell = (value) => {
  if (value === null || value === undefined) return '""';
  return `"${String(value).replace(/"/g, '""')}"`;
};

/**
 * columns: [{ key, label }] — the order and headings of the sheet.
 * rows: objects keyed by `key`.
 */
export const toCsv = (columns, rows) => {
  const header = columns.map((column) => cell(column.label)).join(',');
  const body = rows.map((row) => columns.map((column) => cell(row[column.key])).join(','));
  return [header, ...body].join('\r\n');
};

/**
 * Hands the browser a .csv. The byte-order mark is what makes Excel read it
 * as UTF-8 rather than mangling accented names.
 */
export const downloadCsv = (fileName, columns, rows) => {
  const blob = new Blob([`﻿${toCsv(columns, rows)}`], { type: 'text/csv;charset=utf-8;' });
  const safe = String(fileName).replace(/[\\/:*?"<>|]/g, '-');
  saveAs(blob, safe.endsWith('.csv') ? safe : `${safe}.csv`);
};
