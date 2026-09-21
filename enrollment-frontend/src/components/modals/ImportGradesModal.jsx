import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExcelJS from 'exceljs';
import {
  X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  Loader2, ArrowLeft, Lock, ChevronDown
} from 'lucide-react';
import { transmuteGrade } from '@/lib/transmutation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Reads the ROUNDED column out of an exported Class Record workbook and fills
 * the grade inputs on the Student Grades page.
 *
 * The file is only ever read in the browser — it is never uploaded or stored.
 * Nothing is saved either: the values land in the inputs and the instructor
 * still reviews them and presses Submit Grades.
 */

const TERMS = [
  { key: 'prelim',    field: 'prelim_grade',    label: 'Prelim',     aliases: ['prelim', 'prelims', 'preliminary'] },
  { key: 'midterm',   field: 'midterm_grade',   label: 'Midterm',    aliases: ['midterm', 'midterms'] },
  { key: 'semifinal', field: 'semifinal_grade', label: 'Semi-Final', aliases: ['semifinal', 'semifinals', 'semi'] },
  { key: 'final',     field: 'final_grade',     label: 'Final',      aliases: ['final', 'finals'] },
];

// "ABELLANOSA, JERALD DEN S." and "Abellanosa,  Jerald Den  S" compare equal
const normalizeName = (value) =>
  String(value ?? '')
    .toUpperCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Same name without a trailing middle initial, used as a fallback match
const withoutMiddleInitial = (value) => normalizeName(value).replace(/\s+[A-Z]$/, '');

const normalizeHeader = (value) => normalizeName(value).replace(/[^A-Z]/g, '');

/** Pulls a number out of a cell, including formula cells (cached result). */
const readNumber = (cell) => {
  const value = cell?.value;
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'object') {
    // Formula cell: { formula, result } — result is what Excel last calculated
    if ('result' in value) return readNumber({ value: value.result });
    if (Array.isArray(value.richText)) {
      return readNumber({ value: value.richText.map(t => t.text).join('') });
    }
  }

  return null;
};

const readText = (cell) => {
  const value = cell?.value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map(t => t.text).join('');
    if ('result' in value) return String(value.result ?? '');
    if ('text' in value) return String(value.text ?? '');
  }
  return '';
};

/**
 * Works out the category blocks of a Class Record sheet: for each category
 * (Attendance, PT, Exam, …) the activity columns, the max points of each, the
 * percentage weight, and the column its Score formula sits in.
 */
const readCategories = (worksheet, catHeaderRow, firstDataCol, lastDataCol) => {
  const headerRow = worksheet.getRow(catHeaderRow);
  const subHeaderRow = worksheet.getRow(catHeaderRow + 1);
  const maxPtsRow = worksheet.getRow(catHeaderRow + 2);

  const categories = [];
  let blockStart = firstDataCol;
  let lastHeader = '';

  for (let c = firstDataCol; c <= lastDataCol; c++) {
    const header = readText(headerRow.getCell(c)).trim();
    if (header) lastHeader = header;

    if (normalizeHeader(readText(subHeaderRow.getCell(c))) !== 'SCORE') continue;

    // "ATTENDANCE (40%)" -> 40
    const pct = parseFloat(lastHeader.match(/\(\s*([\d.]+)\s*%\s*\)/)?.[1] ?? '');
    const columns = [];
    for (let input = blockStart; input < c; input++) {
      columns.push({ col: input, maxPts: readNumber(maxPtsRow.getCell(input)) });
    }

    if (Number.isFinite(pct) && columns.length > 0) {
      categories.push({ pct, columns });
    }
    blockStart = c + 1;
  }

  return categories;
};

/**
 * Recomputes a student's raw final grade the same way the exported formulas do,
 * for files Excel has never saved (a fresh export carries formulas but no
 * results). Blank and "X" cells are excluded from both sides of the ratio,
 * exactly like the SUMPRODUCT(ISNUMBER(...)) in the sheet.
 */
const computeFinal = (row, categories) => {
  if (categories.length === 0) return null;

  let total = 0;
  let sawAnyScore = false;

  for (const category of categories) {
    let earned = 0;
    let possible = 0;

    for (const { col, maxPts } of category.columns) {
      const score = readNumber(row.getCell(col));
      if (score === null || !Number.isFinite(maxPts)) continue;
      earned += score;
      possible += maxPts;
    }

    if (possible > 0) {
      total += (earned / possible) * category.pct;
      sawAnyScore = true;
    }
  }

  return sawAnyScore ? total : null;
};

/**
 * Finds the ROUNDED column in a worksheet and returns one entry per student row.
 * The export puts its headers on row 8, but this searches instead of assuming
 * so a manually adjusted sheet still works.
 */
const extractRows = (worksheet, { transmuted = false } = {}) => {
  let headerRow = null;
  let roundedCol = null;
  let finalCol = null;
  let nameCol = null;
  let transmutedCol = null;

  const lastRowToScan = Math.min(worksheet.rowCount, 30);
  for (let r = 1; r <= lastRowToScan && roundedCol === null; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= 60; c++) {
      const header = normalizeHeader(readText(row.getCell(c)));
      if (!header) continue;
      if (header === 'ROUNDED') { headerRow = r; roundedCol = c; }
      else if (header === 'FINALGRADE') { finalCol = c; }
      else if (header === 'NAME') { nameCol = c; }
      else if (header === 'TRANSMUTED') { transmutedCol = c; }
    }
  }

  if (roundedCol === null) {
    throw new Error('No "ROUNDED" column was found in this sheet. Please upload a Class Record export.');
  }

  const nameColumn = nameCol ?? 2;
  const firstDataCol = nameColumn + 1;
  const lastDataCol = (finalCol ?? roundedCol) - 1;
  const categories = readCategories(worksheet, headerRow, firstDataCol, lastDataCol);

  const rows = [];

  for (let r = headerRow + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const name = readText(row.getCell(nameColumn)).trim();

    // Skip the sub-header / max-points rows and any blank spacer rows
    if (!name || !/[A-Za-z]/.test(name)) continue;
    if (['NAME', 'SCORE'].includes(normalizeHeader(name))) continue;

    const rounded = readNumber(row.getCell(roundedCol));
    const finalGrade = finalCol ? readNumber(row.getCell(finalCol)) : null;

    // The raw (unrounded) grade: what the sheet saved, else recomputed from scores
    const raw = finalGrade ?? computeFinal(row, categories);
    let computed = false;
    let value;

    if (transmuted) {
      // DHT / SHS: the transmuted grade is what goes into the system
      value = transmutedCol ? readNumber(row.getCell(transmutedCol)) : null;
      if (value === null && raw !== null) {
        // Older export without the column, or no saved result — transmute here
        value = raw > 0 ? transmuteGrade(raw) : null;
        computed = value !== null;
      }
    } else {
      value = rounded ?? (raw === null ? null : Math.round(raw));
      computed = rounded === null && value !== null;
    }

    rows.push({ excelRow: r, name, value, computed });
  }

  return rows;
};

const ImportGradesModal = ({
  isOpen,
  onClose,
  students = [],
  subjectLabel = '',
  sectionLabel = '',
  isPeriodOpen,
  onApply,
  // DHT / SHS classes read the TRANSMUTED column instead of ROUNDED
  useTransmuted = false,
}) => {
  const gradeColumnLabel = useTransmuted ? 'TRANSMUTED' : 'ROUNDED';
  const [step, setStep] = useState('term');       // 'term' | 'file' | 'preview'
  const [term, setTerm] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [matches, setMatches] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const workbookRef = useRef(null);

  const reset = () => {
    setStep('term');
    setTerm(null);
    setFileName('');
    setError('');
    setSheetNames([]);
    setActiveSheet('');
    setMatches([]);
    setIsParsing(false);
    workbookRef.current = null;
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Students indexed by name so rows from the file can be looked up quickly
  const studentIndex = useMemo(() => {
    const exact = new Map();
    const loose = new Map();
    students.forEach(student => {
      exact.set(normalizeName(student.name), student);
      loose.set(withoutMiddleInitial(student.name), student);
    });
    return { exact, loose };
  }, [students]);

  const buildMatches = (rows) => rows.map(row => {
    const student =
      studentIndex.exact.get(normalizeName(row.name)) ||
      studentIndex.loose.get(withoutMiddleInitial(row.name)) ||
      null;

    let status = 'ok';
    if (!student) status = 'unmatched';
    else if (row.value === null) status = 'novalue';
    else if (row.value < 0 || row.value > 100) status = 'outofrange';

    return { ...row, student, status };
  });

  /** Picks the worksheet whose name matches the chosen term. */
  const pickSheet = (workbook, termKey) => {
    const aliases = TERMS.find(t => t.key === termKey)?.aliases ?? [];
    const sheets = workbook.worksheets;

    const matched = sheets.find(sheet => {
      const name = normalizeHeader(sheet.name);
      // "FINAL" must not swallow "SEMIFINAL", so compare whole names first
      return aliases.includes(name.toLowerCase());
    });
    if (matched) return matched;

    const startsWith = sheets.find(sheet => {
      const name = normalizeHeader(sheet.name).toLowerCase();
      return aliases.some(alias => name === alias || name.startsWith(alias));
    });
    if (startsWith) return startsWith;

    // Single-sheet file: just use it
    return sheets.length === 1 ? sheets[0] : null;
  };

  const loadSheet = (workbook, sheet) => {
    const rows = extractRows(sheet, { transmuted: useTransmuted });
    if (rows.length === 0) {
      throw new Error(`Sheet "${sheet.name}" has no student rows to read.`);
    }
    setMatches(buildMatches(rows));
    setSheetNames(workbook.worksheets.map(ws => ws.name));
    setActiveSheet(sheet.name);
    setStep('preview');
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) {
      setError('Please upload an .xlsx file exported from the Class Record.');
      return;
    }

    setIsParsing(true);
    setError('');
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      workbookRef.current = workbook;

      const sheet = pickSheet(workbook, term.key);
      if (!sheet) {
        throw new Error(
          `No "${term.label}" sheet was found in this file. Sheets available: ${workbook.worksheets.map(w => w.name).join(', ')}.`
        );
      }

      loadSheet(workbook, sheet);
    } catch (err) {
      console.error('Grade import failed:', err);
      setError(err.message || 'That file could not be read. Please make sure it is a Class Record export.');
      setFileName('');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSheetChange = (name) => {
    const workbook = workbookRef.current;
    const sheet = workbook?.worksheets.find(ws => ws.name === name);
    if (!sheet) return;
    try {
      setError('');
      loadSheet(workbook, sheet);
    } catch (err) {
      setError(err.message);
      setMatches([]);
    }
  };

  const summary = useMemo(() => ({
    ok: matches.filter(m => m.status === 'ok').length,
    unmatched: matches.filter(m => m.status === 'unmatched').length,
    novalue: matches.filter(m => m.status === 'novalue').length,
    outofrange: matches.filter(m => m.status === 'outofrange').length,
  }), [matches]);

  const handleApply = () => {
    const values = matches
      .filter(m => m.status === 'ok')
      .map(m => ({ studentId: m.student.id, value: m.value }));

    onApply(term.field, values);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-800 to-red-700 px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileSpreadsheet size={20} /> Import Grades from Class Record
                </h2>
                <p className="text-sm text-white/80 mt-1 truncate">
                  {subjectLabel}{sectionLabel ? ` · ${sectionLabel}` : ''}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 shrink-0 text-white cursor-pointer hover:bg-white hover:text-red-800">
                <X size={20} />
              </Button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto bg-gray-50/60 flex-1">
            {/* Step 1 — choose the term */}
            {step === 'term' && (
              <div>
                <h3 className="font-semibold text-gray-900">Which term are you importing?</h3>
                <p className="text-sm text-gray-600 mt-1 mb-5">
                  The {gradeColumnLabel} column of that term's sheet will be read into the matching grade column.
                  {useTransmuted && ' This class transmutes its grades (DHT / SHS).'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TERMS.map(t => {
                    const open = isPeriodOpen ? isPeriodOpen(t.key) : true;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        disabled={!open}
                        onClick={() => { setTerm(t); setStep('file'); }}
                        className={`text-left rounded-xl border-2 p-4 transition ${
                          open
                            ? 'bg-white border-gray-200 hover:border-red-700 hover:shadow-sm cursor-pointer'
                            : 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-70'
                        }`}
                      >
                        <span className="font-semibold text-gray-900 flex items-center gap-2">
                          {t.label}
                          {!open && <Lock size={13} className="text-gray-400" />}
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">
                          {open ? `Reads the ${t.label.toUpperCase()} sheet` : 'Grading period is closed'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2 — pick the file */}
            {step === 'file' && (
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('term'); setError(''); }}
                  className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-4 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Change term
                </button>

                <h3 className="font-semibold text-gray-900">
                  Upload the Class Record file for <span className="text-red-800">{term.label}</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1 mb-5">
                  The file is read on this computer only. It is not uploaded or saved anywhere.
                </p>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition ${
                    isDragging ? 'border-red-700 bg-red-50' : 'border-gray-300 bg-white hover:border-red-400'
                  }`}
                >
                  {isParsing ? (
                    <div className="flex flex-col items-center text-gray-600">
                      <Loader2 className="animate-spin mb-2" size={26} />
                      <p className="text-sm">Reading {fileName}…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-600">
                      <Upload className="mb-2 text-gray-400" size={28} />
                      <p className="font-medium text-gray-800">Drop the .xlsx file here</p>
                      <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={(e) => {
                      handleFile(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — review before filling anything in */}
            {step === 'preview' && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => { setStep('file'); setMatches([]); setError(''); }}
                    className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Choose another file
                  </button>

                  {sheetNames.length > 1 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      Sheet:
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-48 justify-between bg-white cursor-pointer">
                            {activeSheet || 'Change sheet…'}
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {sheetNames.map(name => (
                            <DropdownMenuItem
                              key={name}
                              onSelect={() => handleSheetChange(name)}
                              className={name === activeSheet ? 'font-semibold text-red-800' : ''}
                            >
                              {name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border bg-white p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <b>{summary.ok}</b> of <b>{matches.length}</b> rows in <span className="font-mono">{fileName}</span> will
                    fill the <b>{term.label}</b> column.
                  </p>
                  {(summary.unmatched > 0 || summary.novalue > 0 || summary.outofrange > 0) && (
                    <ul className="text-sm text-amber-700 mt-2 space-y-1">
                      {summary.unmatched > 0 && <li>• {summary.unmatched} name(s) are not in the current list — check the section filter.</li>}
                      {summary.novalue > 0 && <li>• {summary.novalue} row(s) have no scores in the file yet and will be left untouched.</li>}
                      {summary.outofrange > 0 && <li>• {summary.outofrange} value(s) fall outside 0–100 and will be skipped.</li>}
                    </ul>
                  )}
                  {matches.some(m => m.status === 'ok' && m.computed) && (
                    <p className="text-xs text-gray-500 mt-2">
                      {useTransmuted
                        ? 'Some rows had no saved TRANSMUTED value, so the grade was transmuted here from the final grade using the Adjusted Transmutation Table.'
                        : 'Some rows had no saved ROUNDED value, so the grade was recalculated from the score columns using the same weights as the sheet.'}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border bg-white overflow-hidden">
                  <div className="max-h-[320px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-600 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">Name in file</th>
                          <th className="px-4 py-2 text-left">Matched student</th>
                          <th className="px-4 py-2 text-center">{term.label}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.map((m, i) => (
                          <tr key={`${m.excelRow}-${i}`} className={`border-t ${m.status === 'ok' ? '' : 'bg-amber-50/60'}`}>
                            <td className="px-4 py-2 text-gray-800">{m.name}</td>
                            <td className="px-4 py-2">
                              {m.student ? (
                                <span className="text-gray-600 flex items-center gap-1.5">
                                  <CheckCircle2 size={14} className="text-green-600" />
                                  {m.student.studentId}
                                </span>
                              ) : (
                                <span className="text-amber-700 flex items-center gap-1.5">
                                  <AlertTriangle size={14} /> Not in this list
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center font-mono font-bold">
                              {m.status === 'ok'
                                ? <span className={m.value < 75 ? 'text-red-600' : 'text-gray-900'}>{m.value}</span>
                                : <span className="text-gray-400">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {step === 'preview' && (
            <div className="border-t bg-white px-6 py-4 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Grades are only placed in the inputs. Nothing is saved until you press Submit Grades.
              </p>
              <div className="flex gap-3 shrink-0">
                <Button variant="outline" onClick={handleClose} className="cursor-pointer">Cancel</Button>
                <Button
                  onClick={handleApply}
                  disabled={summary.ok === 0}
                  className="bg-green-600 hover:bg-green-700 cursor-pointer min-w-[150px]"
                >
                  Fill in {summary.ok} grade{summary.ok === 1 ? '' : 's'}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImportGradesModal;
