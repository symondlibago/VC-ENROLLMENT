import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive, Plus, Trash2, Save, Loader2, Search, Check, X,
  FileDown, Pencil, ChevronLeft, ChevronRight, ChevronDown, AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ComboInput from '@/components/ui/combo-input';
import { courseAPI, historicalPaymentAPI } from '@/services/api';
import { buildHistoricalPaymentsPdf } from '@/lib/historicalPaymentsPdf';
import SuccessAlert from '../modals/SuccessAlert';

/**
 * Typing up the cashier's old paper ledgers.
 *
 * Built around how the work actually goes: an assistant sits with one term's
 * pages in front of them and copies line after line. The term is set once at
 * the top and stays set, so each line is four fields and the Enter key.
 *
 * The queue flushes itself every fifth line. That is the difference between a
 * tool you trust and one you don't — nobody typing for three hours should be
 * holding an hour of unsaved work, and nobody should have to remember to
 * press Save. Five is small enough that a closed laptop costs almost nothing
 * and large enough that the server is not hit on every line.
 *
 * Every row stays editable — in the queue and after it is saved — because a
 * name misread off a faded ledger is found a line or two later, or a week
 * later, and re-typing it is not a correction workflow.
 *
 * The three tables share one grid template, so the entry row, the queue and
 * the archive line up as a single column of data rather than three tables
 * that happen to sit above each other.
 */

const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer'];
const AUTO_SAVE_AT = 5;
const PER_PAGE = 25;

/** Entry · Name · Course · Paid · Balance · actions */
const GRID = 'grid grid-cols-[2rem_minmax(0,1fr)_10rem_8rem_8rem_4.5rem] gap-3 items-center';

const SCHOOL_YEARS = (() => {
  const end = new Date().getFullYear() + 1;
  const years = [];
  for (let y = end; y >= 2000; y -= 1) years.push(`${y}-${y + 1}`);
  return years;
})();

const peso = (n) => `₱${Number(n || 0).toLocaleString('en-PH', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
})}`;

const BLANK = { student_name: '', course: '', paid_amount: '', balance: '' };

const isComplete = (r) => (
  String(r.student_name || '').trim() !== ''
  && String(r.course || '').trim() !== ''
  && r.paid_amount !== '' && !Number.isNaN(Number(r.paid_amount))
  && r.balance !== '' && !Number.isNaN(Number(r.balance))
);

/**
 * The term last worked on.
 *
 * Without this a reload drops back to no term, the saved list empties, and
 * the work just typed in looks lost when it is only out of view.
 */
const REMEMBERED = 'vipc.historicalPayments.term';
const recallTerm = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(REMEMBERED) || '{}');
    return {
      schoolYear: typeof saved.schoolYear === 'string' ? saved.schoolYear : '',
      semester: SEMESTERS.includes(saved.semester) ? saved.semester : '1st Semester',
    };
  } catch {
    return { schoolYear: '', semester: '1st Semester' };
  }
};

const HistoricalPayments = () => {
  const [schoolYear, setSchoolYear] = useState(() => recallTerm().schoolYear);
  const [semester, setSemester] = useState(() => recallTerm().semester);

  const [draft, setDraft] = useState(BLANK);
  const [queue, setQueue] = useState([]);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });

  const [saved, setSaved] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [editing, setEditing] = useState(null); // { id, ...fields }

  const [terms, setTerms] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportYear, setExportYear] = useState('all');
  const [exportSem, setExportSem] = useState('all');
  const [exporting, setExporting] = useState(false);

  const nameRef = useRef(null);
  const nextKey = useRef(1);
  const flushing = useRef(false);

  const termReady = schoolYear.trim() !== '' && semester !== '';

  useEffect(() => {
    courseAPI.getAll()
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setCourses([...new Set(res.data.map((c) => c.course_code).filter(Boolean))].sort());
        }
      })
      .catch(() => { /* the field still takes free text without them */ });

    historicalPaymentAPI.getSummary()
      .then((res) => { if (res?.success) setTerms(res.data || []); })
      .catch(() => { /* the export falls back to the generated year list */ });
  }, []);

  const loadSaved = useCallback(async () => {
    if (!termReady) { setSaved([]); setMeta({ current_page: 1, last_page: 1, total: 0 }); return; }
    setLoadingSaved(true);
    try {
      const res = await historicalPaymentAPI.getAll({
        school_year: schoolYear, semester,
        search: search.trim() || undefined,
        per_page: PER_PAGE, page,
      });
      if (res?.success) { setSaved(res.data || []); setMeta(res.meta || {}); }
    } catch {
      setSaved([]);
    } finally {
      setLoadingSaved(false);
    }
  }, [schoolYear, semester, search, page, termReady]);

  useEffect(() => { loadSaved(); }, [loadSaved]);
  useEffect(() => { setPage(1); }, [schoolYear, semester, search]);

  // Come back to the same ledger page tomorrow morning.
  useEffect(() => {
    try {
      localStorage.setItem(REMEMBERED, JSON.stringify({ schoolYear, semester }));
    } catch { /* private window — the page just forgets, which is survivable */ }
  }, [schoolYear, semester]);

  // An edit that empties a field stops the auto-save; the footer says so.
  const queueBlocked = queue.length > 0 && !queue.every(isComplete);

  const totals = useMemo(() => queue.reduce((a, r) => ({
    paid: a.paid + Number(r.paid_amount || 0),
    balance: a.balance + Number(r.balance || 0),
  }), { paid: 0, balance: 0 }), [queue]);

  /** Write the queue out. Guarded so the auto-flush cannot double-fire. */
  const flush = useCallback(async (rows) => {
    if (!rows.length || flushing.current) return;
    flushing.current = true;
    setSaving(true);
    try {
      const res = await historicalPaymentAPI.saveBatch(rows.map((r) => ({
        student_name: r.student_name,
        course: r.course,
        school_year: schoolYear.trim(),
        semester,
        paid_amount: Number(r.paid_amount),
        balance: Number(r.balance),
      })));
      // Only the rows that went are dropped — anything typed meanwhile stays.
      const sentKeys = new Set(rows.map((r) => r._key));
      setQueue((prev) => prev.filter((r) => !sentKeys.has(r._key)));
      setAlert({ isVisible: true, message: res?.message || 'Saved.', type: 'success' });
      loadSaved();
    } catch (err) {
      // The server wraps the batch in a transaction: nothing was written, so
      // the rows stay in the queue and can be fixed and sent again.
      setAlert({
        isVisible: true,
        message: err?.message || 'Could not save — the lines are still here, nothing was lost.',
        type: 'error',
      });
    } finally {
      setSaving(false);
      flushing.current = false;
    }
  }, [schoolYear, semester, loadSaved]);

  // Every fifth line goes by itself, as long as all five are complete.
  useEffect(() => {
    if (queue.length >= AUTO_SAVE_AT && !flushing.current && queue.every(isComplete)) {
      flush(queue.slice(0, AUTO_SAVE_AT));
    }
  }, [queue, flush]);

  const addRow = useCallback(() => {
    if (!termReady) {
      setAlert({ isVisible: true, message: 'Set the school year first.', type: 'error' });
      return;
    }
    if (!isComplete(draft)) return;

    setQueue((prev) => [...prev, {
      _key: nextKey.current++,
      student_name: draft.student_name.trim(),
      course: draft.course.trim(),
      paid_amount: Number(draft.paid_amount),
      balance: Number(draft.balance),
    }]);
    // The course usually repeats down a ledger page, so it stays.
    setDraft({ ...BLANK, course: draft.course });
    nameRef.current?.focus();
  }, [draft, termReady]);

  const onDraftKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); addRow(); } };

  const editQueued = (key, field, value) =>
    setQueue((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)));

  const saveEdit = async () => {
    if (!editing || !isComplete(editing)) return;
    try {
      await historicalPaymentAPI.update(editing.id, {
        student_name: editing.student_name,
        course: editing.course,
        school_year: editing.school_year,
        semester: editing.semester,
        paid_amount: Number(editing.paid_amount),
        balance: Number(editing.balance),
      });
      setEditing(null);
      loadSaved();
    } catch (err) {
      setAlert({ isVisible: true, message: err?.message || 'Could not update that entry.', type: 'error' });
    }
  };

  const removeSaved = async (id) => {
    try {
      await historicalPaymentAPI.remove(id);
      loadSaved();
    } catch (err) {
      setAlert({ isVisible: true, message: err?.message || 'Could not remove that entry.', type: 'error' });
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const res = await historicalPaymentAPI.exportRows({
        school_year: exportYear === 'all' ? undefined : exportYear,
        semester: exportSem === 'all' ? undefined : exportSem,
      });
      const rows = res?.data || [];
      if (!rows.length) {
        setAlert({ isVisible: true, message: 'Nothing recorded for that selection yet.', type: 'error' });
        return;
      }
      const scope = [
        exportYear === 'all' ? 'All school years' : exportYear,
        exportSem === 'all' ? 'All semesters' : exportSem,
      ].join('  ·  ');
      const doc = await buildHistoricalPaymentsPdf({ rows, scopeLabel: scope });
      doc.save(`historical-term-payments-${exportYear}-${exportSem}.pdf`.replace(/\s+/g, '-').toLowerCase());
      setExportOpen(false);
    } catch (err) {
      setAlert({ isVisible: true, message: err?.message || 'Could not build the PDF.', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const recordedYears = useMemo(
    () => [...new Set(terms.map((t) => t.school_year))].sort().reverse(),
    [terms]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <SuccessAlert
        isVisible={alert.isVisible}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert((a) => ({ ...a, isVisible: false }))}
      />

      {/* ── Title + export ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold heading-bold text-gray-900 flex items-center">
            <Archive className="w-6 h-6 text-(--dominant-red) mr-2.5" />
            Historical Term Payments
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Set the term once, then one line per student. Every {AUTO_SAVE_AT} lines save themselves.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setExportOpen(true)}
          className="bg-white border-gray-200 hover:bg-red-50 hover:text-red-800 hover:border-red-800 cursor-pointer"
        >
          <FileDown className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* ── Export ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {exportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setExportOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Export historical payments"
            >
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <FileDown className="w-5 h-5 mr-2 text-(--dominant-red)" />
                    Export to PDF
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">Choose what the report should cover.</p>
                </div>
                <button
                  onClick={() => setExportOpen(false)}
                  className="text-gray-400 hover:text-gray-700 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    School year
                  </label>
                  <PickList
                    value={exportYear}
                    onChange={setExportYear}
                    options={[
                      { value: 'all', label: 'All school years' },
                      ...recordedYears.map((y) => ({ value: y, label: y })),
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Semester
                  </label>
                  <PickList
                    value={exportSem}
                    onChange={setExportSem}
                    options={[
                      { value: 'all', label: 'All semesters' },
                      ...SEMESTERS.map((s) => ({ value: s, label: s })),
                    ]}
                  />
                </div>

                {recordedYears.length === 0 && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                    Nothing has been recorded yet.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-50 rounded-b-2xl">
                <Button variant="outline" onClick={() => setExportOpen(false)} className="cursor-pointer bg-white">
                  Cancel
                </Button>
                <Button
                  onClick={exportPdf}
                  disabled={exporting || recordedYears.length === 0}
                  className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer"
                >
                  {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                  {exporting ? 'Building…' : 'Download'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── The term being worked on ───────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div className="w-56">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              School Year
            </label>
            <ComboInput
              value={schoolYear}
              onChange={setSchoolYear}
              options={SCHOOL_YEARS}
              // Not "2015-2016": a plausible value as placeholder reads as a
              // value already chosen, and the list below looks empty for no
              // apparent reason.
              placeholder="Select or type…"
              aria-label="School year"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Semester
            </label>
            <div className="relative inline-flex bg-gray-100 rounded-lg p-1">
              {SEMESTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSemester(s)}
                  className="relative z-10 px-3.5 py-1.5 text-sm rounded-md cursor-pointer"
                >
                  {semester === s && (
                    <motion.div
                      layoutId="histSemPill"
                      className="absolute inset-0 bg-white shadow-sm rounded-md"
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 whitespace-nowrap ${semester === s ? 'text-(--dominant-red) font-semibold' : 'text-gray-600'}`}>
                    {s}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-6">
            <Stat label="In this term" value={meta.total ?? 0} />
            <Stat label="Waiting" value={queue.length} accent={queue.length > 0} />
          </div>
        </div>

        {!termReady && (
          <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            Pick a school year to start.
          </p>
        )}
      </div>

      {/* ── Entry + queue, one continuous surface ──────────────── */}
      {/* No overflow-hidden: the course suggestions drop out of the entry row
          and would be clipped by it. Corners are rounded on the first and
          last strips instead. */}
      <div className={`bg-white border rounded-xl transition-colors
        ${termReady ? 'border-gray-200' : 'border-gray-200 opacity-60 pointer-events-none'}`}>

        {/* Column headings, shared by the entry row and the queue */}
        <div className={`${GRID} px-5 py-2.5 bg-gray-50 border-b border-gray-200 rounded-t-xl`}>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">#</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Student Name</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Course</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 text-right">Paid</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 text-right">Balance</span>
          <span />
        </div>

        {/* The line being typed */}
        <div className={`${GRID} px-5 py-3 bg-red-50/40 border-b border-gray-200`}>
          <Plus className="w-4 h-4 text-(--dominant-red)" />
          <Input
            ref={nameRef}
            value={draft.student_name}
            onChange={(e) => setDraft((d) => ({ ...d, student_name: e.target.value }))}
            onKeyDown={onDraftKey}
            placeholder="Surname, First Name"
            className="h-9 uppercase bg-white"
          />
          <ComboInput
            value={draft.course}
            onChange={(v) => setDraft((d) => ({ ...d, course: v }))}
            onEnter={addRow}
            options={courses}
            placeholder="Course"
            className="h-9 py-0"
            aria-label="Course"
          />
          <Input
            type="number" step="0.01" min="0" inputMode="decimal"
            value={draft.paid_amount}
            onChange={(e) => setDraft((d) => ({ ...d, paid_amount: e.target.value }))}
            onKeyDown={onDraftKey}
            placeholder="0.00"
            className="h-9 text-right tabular-nums bg-white"
          />
          <Input
            type="number" step="0.01" min="0" inputMode="decimal"
            value={draft.balance}
            onChange={(e) => setDraft((d) => ({ ...d, balance: e.target.value }))}
            onKeyDown={onDraftKey}
            placeholder="0.00"
            className="h-9 text-right tabular-nums bg-white"
          />
          <Button
            onClick={addRow}
            disabled={!isComplete(draft)}
            size="sm"
            className="h-9 bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer"
            title="Add line (Enter)"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* The queue — still editable, still yours */}
        <AnimatePresence initial={false}>
          {queue.map((row, i) => (
            <motion.div
              key={row._key}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className={`${GRID} px-5 py-2 border-b border-gray-100 hover:bg-gray-50/80`}
            >
              <span className="text-xs text-gray-400 tabular-nums">{i + 1}</span>
              <Input
                value={row.student_name}
                onChange={(e) => editQueued(row._key, 'student_name', e.target.value)}
                className="h-8 uppercase border-transparent hover:border-gray-200 focus:border-(--dominant-red) bg-transparent"
              />
              <ComboInput
                value={row.course}
                onChange={(v) => editQueued(row._key, 'course', v)}
                options={courses}
                className="h-8 py-0 border-transparent hover:border-gray-200 bg-transparent"
                aria-label="Course"
              />
              <Input
                type="number" step="0.01" min="0"
                value={row.paid_amount}
                onChange={(e) => editQueued(row._key, 'paid_amount', e.target.value)}
                className="h-8 text-right tabular-nums border-transparent hover:border-gray-200 focus:border-(--dominant-red) bg-transparent"
              />
              <Input
                type="number" step="0.01" min="0"
                value={row.balance}
                onChange={(e) => editQueued(row._key, 'balance', e.target.value)}
                className="h-8 text-right tabular-nums border-transparent hover:border-gray-200 focus:border-(--dominant-red) bg-transparent"
              />
              <button
                onClick={() => setQueue((prev) => prev.filter((r) => r._key !== row._key))}
                className="justify-self-center text-gray-300 hover:text-red-700 cursor-pointer"
                title="Remove line"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Queue footer: how close the auto-save is, and the manual way out */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-gray-50/60 rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="flex gap-1" title={`Saves automatically at ${AUTO_SAVE_AT}`}>
              {Array.from({ length: AUTO_SAVE_AT }, (_, i) => (
                <span
                  key={i}
                  className={`w-5 h-1.5 rounded-full transition-colors
                    ${i < queue.length ? 'bg-(--dominant-red)' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            <span className={`text-xs ${queueBlocked ? 'text-amber-700 font-medium' : 'text-gray-500'}`}>
              {saving
                ? 'Saving…'
                : queueBlocked
                  // Say so plainly: otherwise auto-save just quietly stops.
                  ? 'A line above is incomplete — fill it in and saving resumes'
                  : queue.length === 0
                    ? `Nothing waiting · saves itself every ${AUTO_SAVE_AT} lines`
                    : `${queue.length} waiting · ${AUTO_SAVE_AT - queue.length <= 0 ? 'saving now' : `${AUTO_SAVE_AT - queue.length} more to auto-save`}`}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {queue.length > 0 && (
              <span className="text-xs text-gray-600 tabular-nums">
                Paid <strong className="text-gray-900">{peso(totals.paid)}</strong>
                <span className="mx-1.5 text-gray-300">·</span>
                Balance <strong className="text-gray-900">{peso(totals.balance)}</strong>
              </span>
            )}
            <Button
              size="sm"
              onClick={() => flush(queue)}
              disabled={!queue.length || saving || !queue.every(isComplete)}
              variant="outline"
              className="cursor-pointer bg-white"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
              Save now
            </Button>
          </div>
        </div>
      </div>

      {/* ── What is already in ─────────────────────────────────── */}
      {/* Same reason: a row being edited opens its course list downward. */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-200 rounded-t-xl">
          <h2 className="text-sm font-bold text-gray-900">
            Saved
            {termReady && (
              <span className="ml-2 font-normal text-gray-500">
                {schoolYear} · {semester} · {meta.total ?? 0} {meta.total === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search name or course…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
              disabled={!termReady}
            />
          </div>
        </div>

        <div className={`${GRID} px-5 py-2.5 bg-gray-50 border-b border-gray-200`}>
          <span />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Student Name</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Course</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 text-right">Paid</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 text-right">Balance</span>
          <span />
        </div>

        {loadingSaved ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…
          </p>
        ) : saved.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            {termReady ? 'Nothing saved for this term yet.' : 'Pick a school year to see what is already in.'}
          </p>
        ) : saved.map((row) => (
          editing?.id === row.id ? (
            <div key={row.id} className={`${GRID} px-5 py-2 border-b border-gray-100 bg-amber-50/50`}>
              <Pencil className="w-3.5 h-3.5 text-amber-600" />
              <Input
                value={editing.student_name}
                onChange={(e) => setEditing((d) => ({ ...d, student_name: e.target.value }))}
                className="h-8 uppercase bg-white"
                autoFocus
              />
              <ComboInput
                value={editing.course}
                onChange={(v) => setEditing((d) => ({ ...d, course: v }))}
                options={courses}
                className="h-8 py-0"
                aria-label="Course"
              />
              <Input
                type="number" step="0.01" min="0"
                value={editing.paid_amount}
                onChange={(e) => setEditing((d) => ({ ...d, paid_amount: e.target.value }))}
                className="h-8 text-right tabular-nums bg-white"
              />
              <Input
                type="number" step="0.01" min="0"
                value={editing.balance}
                onChange={(e) => setEditing((d) => ({ ...d, balance: e.target.value }))}
                className="h-8 text-right tabular-nums bg-white"
              />
              <div className="flex items-center gap-1 justify-self-center">
                <button onClick={saveEdit} className="text-green-600 hover:text-green-800 cursor-pointer" title="Save">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer" title="Cancel">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div key={row.id} className={`${GRID} px-5 py-2.5 border-b border-gray-100 hover:bg-gray-50/80 group`}>
              <span />
              <span className="text-sm font-medium text-gray-900 uppercase truncate" title={row.student_name}>
                {row.student_name}
              </span>
              <span className="text-sm text-gray-600 truncate">{row.course}</span>
              <span className="text-sm text-gray-900 text-right tabular-nums">{peso(row.paid_amount)}</span>
              <span className={`text-sm text-right tabular-nums ${Number(row.balance) > 0 ? 'text-red-700 font-medium' : 'text-gray-400'}`}>
                {peso(row.balance)}
              </span>
              <div className="flex items-center gap-1 justify-self-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing({ ...row })}
                  className="text-gray-400 hover:text-(--dominant-red) cursor-pointer"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeSaved(row.id)}
                  className="text-gray-400 hover:text-red-700 cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        ))}

        {(meta.last_page ?? 1) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50/60">
            <span className="text-xs text-gray-500">
              Page {meta.current_page} of {meta.last_page} · {meta.total} entries
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="sm" className="cursor-pointer bg-white h-8 w-8 p-0"
                disabled={meta.current_page <= 1} onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline" size="sm" className="cursor-pointer bg-white h-8 w-8 p-0"
                disabled={meta.current_page >= meta.last_page} onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value, accent }) => (
  <div className="text-right">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`text-xl font-bold leading-tight tabular-nums ${accent ? 'text-(--dominant-red)' : 'text-gray-900'}`}>
      {Number(value).toLocaleString()}
    </p>
  </div>
);

/**
 * A plain chooser for a fixed list — the app's own dropdown, not a native
 * `select`, so it looks the same on every machine.
 */
const PickList = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative" ref={wrap}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200
          rounded-lg text-sm text-gray-900 hover:border-gray-300 focus:border-(--dominant-red)
          focus:ring-2 focus:ring-(--dominant-red)/20 focus:outline-none cursor-pointer"
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200
              rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto"
          >
            {options.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between cursor-pointer
                    ${o.value === value ? 'bg-red-50 text-red-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check className="w-3.5 h-3.5 shrink-0 text-(--dominant-red)" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoricalPayments;
