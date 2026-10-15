import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X, Search, Loader2, AlertCircle, Check, Scissors, UserRound, PenLine, UserPlus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CustomCalendar from '../layout/CustomCalendar';
import { fabricAPI } from '@/services/api';
import { toIsoDate, todayIso } from '@/lib/dateFormat';
import { fabricLabel } from '@/lib/fabric';

/**
 * The cashier's counter form: find the student, key in the metres taken of
 * each fabric, record the O.R. Available stock sits beside every field so an
 * oversell is visible before it is saved rather than after.
 */

const EMPTY = {
  pre_enrolled_student_id: null,
  student_name: '',
  student_id_number: '',
  course: '',
  year_level: '',
  or_number: '',
  amount: '',
  notes: '',
};

const inputClass =
  'h-11 text-base border-2 border-gray-200 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-white';

const meters = (value) => `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} m`;

const FabricSaleModal = ({ isOpen, onClose, onSubmit, isSaving, summary = [] }) => {
  const [mode, setMode] = useState('search');
  const [form, setForm] = useState(EMPTY);
  const [date, setDate] = useState(todayIso());
  // Metres keyed by fabric type id
  const [cut, setCut] = useState({});
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [allowOversell, setAllowOversell] = useState(false);
  const [error, setError] = useState('');
  const searchBox = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setMode('search');
    setForm(EMPTY);
    setDate(todayIso());
    setCut({});
    setQuery('');
    setResults([]);
    setShowResults(false);
    setAllowOversell(false);
    setError('');
  }, [isOpen]);

  // Debounced student lookup
  useEffect(() => {
    if (mode !== 'search' || query.trim().length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fabricAPI.searchStudents(query.trim());
        if (!cancelled) {
          setResults(res.success ? res.data : []);
          setShowResults(true);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, mode]);

  useEffect(() => {
    const handler = (event) => {
      if (searchBox.current && !searchBox.current.contains(event.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickStudent = (student) => {
    setForm((prev) => ({
      ...prev,
      pre_enrolled_student_id: student.id,
      student_name: student.name || '',
      student_id_number: student.student_id_number || '',
      course: student.course || '',
      year_level: student.year_level ? String(student.year_level) : '',
    }));
    setQuery('');
    setResults([]);
    setShowResults(false);
    setError('');
  };

  const switchMode = (next) => {
    setMode(next);
    if (next === 'manual') setForm((prev) => ({ ...prev, pre_enrolled_student_id: null }));
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const totalMeters = useMemo(
    () => Object.values(cut).reduce((sum, value) => sum + (parseFloat(value) || 0), 0),
    [cut]
  );

  /** Fabrics being taken past what is on hand. */
  const shortages = useMemo(
    () => summary
      .map((fabric) => {
        const entered = parseFloat(cut[fabric.id]) || 0;
        return entered > fabric.remaining_meters
          ? { id: fabric.id, name: fabricLabel(fabric), short: entered - fabric.remaining_meters }
          : null;
      })
      .filter(Boolean),
    [summary, cut]
  );

  const submit = () => {
    if (!form.student_name.trim()) return setError('Find the student, or type their name in.');
    if (!form.or_number.trim()) return setError('Enter the O.R. number.');
    if (totalMeters <= 0) return setError('Enter the metres for at least one fabric.');
    if (shortages.length > 0 && !allowOversell) {
      return setError('There is not enough fabric on hand — see below.');
    }

    onSubmit({
      ...form,
      pre_enrolled_student_id: mode === 'manual' ? null : form.pre_enrolled_student_id,
      amount: form.amount === '' ? null : Number(form.amount),
      purchase_date: date,
      allow_oversell: allowOversell,
      items: summary.map((fabric) => ({
        fabric_type_id: fabric.id,
        meters: parseFloat(cut[fabric.id]) || 0,
      })),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-(--dominant-red) text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold heading-bold">Record Fabric Purchase</h2>
              <p className="text-white/80 text-sm">Metres cut for a student, against one O.R.</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/15 rounded-lg p-1.5 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto">
          {/* Student */}
          <section className="px-6 py-5 border-b">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Student</h3>
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                {[
                  { key: 'search', label: 'Search', icon: UserRound },
                  { key: 'manual', label: 'Type in', icon: PenLine },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => switchMode(key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                      mode === key ? 'bg-white text-(--dominant-red) shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'search' && (
              <div className="relative mb-4" ref={searchBox}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                  onFocus={() => results.length > 0 && setShowResults(true)}
                  placeholder="Search by name or student ID…"
                  className={`${inputClass} pl-10 pr-10`}
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}

                {showResults && query.trim().length >= 2 && (
                  <div
                    data-lenis-prevent
                    className="absolute z-20 mt-1 w-full rounded-xl border bg-white shadow-xl max-h-56 overflow-y-auto"
                  >
                    {results.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        {searching ? 'Searching…' : (
                          <>
                            No student found.
                            <button
                              onClick={() => switchMode('manual')}
                              className="block mx-auto mt-2 text-(--dominant-red) font-medium hover:underline cursor-pointer"
                            >
                              Type the name in instead
                            </button>
                          </>
                        )}
                      </div>
                    ) : results.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => pickStudent(student)}
                        className="w-full text-left px-4 py-3 hover:bg-red-50/60 border-b last:border-0 cursor-pointer"
                      >
                        <div className="font-semibold text-sm text-gray-900 uppercase">{student.name}</div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-x-3">
                          <span className="font-mono">{student.student_id_number}</span>
                          {student.course && <span>{student.course}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mode === 'search' && form.pre_enrolled_student_id && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                <Check className="w-4 h-4 shrink-0" />
                Linked to a student record.
              </div>
            )}

            {mode === 'manual' && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                <UserPlus className="w-4 h-4 mt-0.5 shrink-0" />
                For anyone not in the system — the purchase is still counted in the stock.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Name <span className="text-(--dominant-red)">*</span>
                </label>
                <Input
                  value={form.student_name}
                  onChange={(e) => { set('student_name', e.target.value); setError(''); }}
                  placeholder="DELA CRUZ, JUAN M."
                  className={`${inputClass} mt-1.5 uppercase`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Student ID</label>
                <Input
                  value={form.student_id_number}
                  onChange={(e) => set('student_id_number', e.target.value)}
                  placeholder="2025-0001"
                  className={`${inputClass} mt-1.5 font-mono`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Course</label>
                <Input
                  value={form.course}
                  onChange={(e) => set('course', e.target.value)}
                  placeholder="DHT"
                  className={`${inputClass} mt-1.5`}
                />
              </div>
            </div>
          </section>

          {/* Fabric */}
          <section className="px-6 py-5 border-b">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Metres taken</h3>
              <span className="text-sm text-gray-500">
                Total <b className="text-gray-900">{meters(totalMeters)}</b>
              </span>
            </div>

            <div className="space-y-3">
              {summary.map((fabric) => {
                const entered = parseFloat(cut[fabric.id]) || 0;
                const left = fabric.remaining_meters - entered;
                const short = left < 0;

                return (
                  <div
                    key={fabric.id}
                    className={`rounded-xl border-2 p-3 flex items-center gap-4 ${
                      entered > 0 ? 'border-(--dominant-red) bg-red-50/30' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{fabricLabel(fabric)}</p>
                      <p className={`text-xs ${short ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {short
                          ? `Over stock by ${meters(Math.abs(left))}`
                          : `${meters(fabric.remaining_meters)} on hand${entered > 0 ? ` · ${meters(left)} left after` : ''}`}
                      </p>
                    </div>

                    <div className="relative w-32 shrink-0">
                      <Input
                        type="number" min="0" step="0.25"
                        value={cut[fabric.id] ?? ''}
                        onChange={(e) => {
                          setCut((prev) => ({ ...prev, [fabric.id]: e.target.value }));
                          setError('');
                        }}
                        placeholder="0"
                        className={`${inputClass} pr-8 text-right font-semibold`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">m</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stock is short — saying so is not enough, it has to be agreed to */}
            {shortages.length > 0 && (
              <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
                  <div className="text-sm text-amber-900">
                    <p className="font-semibold">Not enough fabric on hand</p>
                    <ul className="mt-1 space-y-0.5 text-xs">
                      {shortages.map((item) => (
                        <li key={item.id}>
                          {item.name} — short by <b>{meters(item.short)}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <label className="mt-3 flex items-start gap-3 cursor-pointer border-t border-amber-200 pt-3">
                  <input
                    type="checkbox"
                    checked={allowOversell}
                    onChange={(e) => { setAllowOversell(e.target.checked); setError(''); }}
                    className="mt-0.5 w-4 h-4 accent-amber-600 cursor-pointer"
                  />
                  <span className="text-xs text-amber-900">
                    <span className="font-semibold">Record it anyway.</span>{' '}
                    The cloth is on hand but its delivery has not been encoded yet — add that delivery
                    afterwards so the stock reads correctly.
                  </span>
                </label>
              </div>
            )}
          </section>

          {/* Receipt */}
          <section className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  O.R. Number <span className="text-(--dominant-red)">*</span>
                </label>
                <Input
                  value={form.or_number}
                  onChange={(e) => { set('or_number', e.target.value); setError(''); }}
                  placeholder="e.g. 9613"
                  className={`${inputClass} mt-1.5 font-semibold`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</label>
                <CustomCalendar
                  value={date}
                  onChange={(picked) => setDate(toIsoDate(picked))}
                  placeholder="Select date"
                  position="above"
                  className="mt-1.5"
                  triggerClassName="py-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount paid</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.amount}
                    onChange={(e) => set('amount', e.target.value)}
                    placeholder="0.00"
                    className={`${inputClass} pl-7 font-semibold`}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Optional.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes</label>
                <Input
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="e.g. for the PE uniform"
                  className={`${inputClass} mt-1.5`}
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-gray-500 hidden sm:block">The metres come straight off the stock on hand.</p>
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancel</Button>
            <Button
              onClick={submit}
              disabled={isSaving}
              className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer min-w-[160px]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Record ${meters(totalMeters)}`}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FabricSaleModal;
