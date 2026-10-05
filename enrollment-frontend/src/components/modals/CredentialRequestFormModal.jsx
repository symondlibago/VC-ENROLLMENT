import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X, Search, Loader2, UserPlus, AlertCircle, Check, FilePlus2, UserRound, PenLine,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { credentialAPI } from '@/services/api';
import {
  CREDENTIAL_TYPES, CREDENTIAL_LABELS, PURPOSE_OPTIONS, PURPOSE_LABELS, PAGE_CHOICES,
} from '@/lib/credentialOptions';

/**
 * The registrar's intake form. A student can be looked up — which fills the
 * details in but leaves every one of them editable, since emails change — or
 * typed in from scratch for alumni who finished before the system existed.
 */

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'];
const SEMESTERS = ['1st', '2nd', 'Summer'];

const EMPTY = {
  pre_enrolled_student_id: null,
  student_name: '',
  student_id_number: '',
  course: '',
  year_level: '',
  semester: '',
  school_year: '',
  email: '',
  contact_number: '',
  purposes: [],
  purpose_other: '',
  remarks: '',
};

const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {label} {required && <span className="text-(--dominant-red)">*</span>}
    </label>
    <div className="mt-1.5">{children}</div>
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const inputClass =
  'h-10 border-2 border-gray-200 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-white';

/** A single-choice dropdown that matches the rest of the app. */
const ChoiceDropdown = ({ value, options, placeholder, onChange, allowClear = true }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="outline"
        className="w-full h-10 justify-between bg-white border-2 border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-normal cursor-pointer"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || placeholder}</span>
        <span className="text-gray-400">▾</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
      {allowClear && (
        <DropdownMenuItem onSelect={() => onChange('')} className="text-gray-500 cursor-pointer">
          {placeholder}
        </DropdownMenuItem>
      )}
      {options.map((option) => (
        <DropdownMenuItem key={option} onSelect={() => onChange(option)} className="cursor-pointer">
          {option}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const CredentialRequestFormModal = ({ isOpen, onClose, onSubmit, isSaving, editing }) => {
  const [mode, setMode] = useState('search'); // 'search' | 'manual'
  const [form, setForm] = useState(EMPTY);
  // Each requested credential: { type, label, pages, remarks }
  const [lines, setLines] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const searchBox = useRef(null);

  const isEdit = !!editing;

  useEffect(() => {
    if (!isOpen) return;

    if (editing) {
      setForm({
        pre_enrolled_student_id: editing.student?.id ?? null,
        student_name: editing.student?.name ?? '',
        student_id_number: editing.student?.student_id_number ?? '',
        course: editing.student?.course ?? '',
        year_level: editing.student?.year_level ?? '',
        semester: editing.student?.semester ?? '',
        school_year: editing.student?.school_year ?? '',
        email: editing.student?.email ?? '',
        contact_number: editing.student?.contact_number ?? '',
        purposes: editing.purposes ?? [],
        purpose_other: editing.purpose_other ?? '',
        remarks: editing.remarks ?? '',
      });
      setLines((editing.credentials ?? []).map((line) => ({
        type: line.type,
        label: line.label ?? CREDENTIAL_LABELS[line.type] ?? '',
        pages: line.pages ?? null,
        remarks: line.remarks ?? '',
      })));
      setMode(editing.student?.is_linked ? 'search' : 'manual');
    } else {
      setForm(EMPTY);
      setLines([]);
      setMode('search');
    }

    setQuery('');
    setResults([]);
    setShowResults(false);
    setError('');
  }, [isOpen, editing]);

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
        const res = await credentialAPI.searchStudents(query.trim());
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

  // Close the result list when clicking elsewhere
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
      semester: student.semester || '',
      school_year: student.school_year || '',
      email: student.email || '',
      contact_number: student.contact_number || '',
    }));
    setQuery('');
    setResults([]);
    setShowResults(false);
    setError('');
  };

  const switchMode = (next) => {
    setMode(next);
    if (next === 'manual') {
      // Typed-in requests are not tied to a student record
      setForm((prev) => ({ ...prev, pre_enrolled_student_id: null }));
    }
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const selectedTypes = useMemo(() => lines.map((line) => line.type), [lines]);

  const toggleCredential = (type) => {
    setError('');
    setLines((prev) =>
      prev.some((line) => line.type === type)
        ? prev.filter((line) => line.type !== type)
        : [...prev, { type, label: type === 'others' ? '' : CREDENTIAL_LABELS[type], pages: null, remarks: '' }]
    );
  };

  const updateLine = (type, patch) =>
    setLines((prev) => prev.map((line) => (line.type === type ? { ...line, ...patch } : line)));

  const togglePurpose = (value) => {
    setError('');
    setForm((prev) => ({
      ...prev,
      purposes: prev.purposes.includes(value)
        ? prev.purposes.filter((p) => p !== value)
        : [...prev.purposes, value],
    }));
  };

  const submit = () => {
    if (!form.student_name.trim()) return setError('Enter the student\'s name.');
    if (lines.length === 0) return setError('Choose at least one credential to request.');

    const othersLine = lines.find((line) => line.type === 'others');
    if (othersLine && !othersLine.label.trim()) {
      return setError('Specify what the "Others" credential is.');
    }
    if (form.purposes.includes('others') && !form.purpose_other.trim()) {
      return setError('Specify the other purpose.');
    }
    if (!form.email.trim()) {
      return setError('An email address is needed — the claim stub is sent there.');
    }

    onSubmit({
      ...form,
      pre_enrolled_student_id: mode === 'manual' ? null : form.pre_enrolled_student_id,
      credentials: lines.map((line) => ({
        type: line.type,
        label: line.type === 'others' ? line.label.trim() : CREDENTIAL_LABELS[line.type],
        pages: line.pages || null,
        remarks: line.remarks?.trim() || null,
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-(--dominant-red) text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <FilePlus2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold heading-bold">
                {isEdit ? `Edit ${editing.request_number}` : 'File Credential Request'}
              </h2>
              <p className="text-white/80 text-sm">
                {isEdit
                  ? 'Correct the details before the documents are released.'
                  : 'Encoded at the registrar, then routed for clearance.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/15 rounded-lg p-1.5 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto">
          {/* ── Student */}
          <section className="px-6 py-5 border-b">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Student</h3>

              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                {[
                  { key: 'search', label: 'Search student', icon: UserRound },
                  { key: 'manual', label: 'Enter manually', icon: PenLine },
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
                  <div data-lenis-prevent className="absolute z-20 mt-1 w-full rounded-xl border bg-white shadow-xl max-h-60 overflow-y-auto">
                    {results.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        {searching ? 'Searching…' : (
                          <>
                            No student found.
                            <button
                              onClick={() => switchMode('manual')}
                              className="block mx-auto mt-2 text-(--dominant-red) font-medium hover:underline cursor-pointer"
                            >
                              Enter the details manually instead
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
                          {student.email && <span className="text-gray-400">{student.email}</span>}
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
                Linked to a student record — every field below can still be edited for this request.
              </div>
            )}

            {mode === 'manual' && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                <UserPlus className="w-4 h-4 mt-0.5 shrink-0" />
                For alumni who are not in the system. The request stands on its own, with the details you type here.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Full name" required>
                  <Input
                    value={form.student_name}
                    onChange={(e) => { set('student_name', e.target.value); setError(''); }}
                    placeholder="DELA CRUZ, JUAN M."
                    className={`${inputClass} uppercase`}
                  />
                </Field>
              </div>

              <Field label="Student ID">
                <Input
                  value={form.student_id_number}
                  onChange={(e) => set('student_id_number', e.target.value)}
                  placeholder="2024-0001"
                  className={`${inputClass} font-mono`}
                />
              </Field>

              <Field label="Course">
                <Input
                  value={form.course}
                  onChange={(e) => set('course', e.target.value)}
                  placeholder="BSBA-HRM"
                  className={inputClass}
                />
              </Field>

              <Field label="Year level">
                <ChoiceDropdown
                  value={form.year_level}
                  options={YEAR_LEVELS}
                  placeholder="Select year level"
                  onChange={(value) => set('year_level', value)}
                />
              </Field>

              <Field label="Semester">
                <ChoiceDropdown
                  value={form.semester}
                  options={SEMESTERS}
                  placeholder="Select semester"
                  onChange={(value) => set('semester', value)}
                />
              </Field>

              <Field label="Academic year">
                <Input
                  value={form.school_year}
                  onChange={(e) => set('school_year', e.target.value)}
                  placeholder="2025-2026"
                  className={inputClass}
                />
              </Field>

              <Field label="Contact number">
                <Input
                  value={form.contact_number}
                  onChange={(e) => set('contact_number', e.target.value)}
                  placeholder="09XX XXX XXXX"
                  className={inputClass}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Email address" required hint="The claim stub is emailed here — correct it if the student has a new one.">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => { set('email', e.target.value); setError(''); }}
                    placeholder="student@email.com"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* ── Credentials */}
          <section className="px-6 py-5 border-b">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Credentials requested</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
                  >
                    {lines.length > 0 ? `${lines.length} selected` : 'Choose credentials'}
                    <span className="ml-2 text-gray-400">▾</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Select all that apply</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {CREDENTIAL_TYPES.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={selectedTypes.includes(option.value)}
                      onCheckedChange={() => toggleCredential(option.value)}
                      onSelect={(e) => e.preventDefault()}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {lines.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                No credentials chosen yet.
              </div>
            ) : (
              <div className="space-y-3">
                {lines.map((line) => (
                  <div key={line.type} className="rounded-xl border-2 border-gray-200 p-4 bg-gray-50/50">
                    <div className="flex items-start justify-between gap-3">
                      {line.type === 'others' ? (
                        <Input
                          value={line.label}
                          onChange={(e) => updateLine('others', { label: e.target.value })}
                          placeholder="Please specify the document…"
                          className={`${inputClass} max-w-sm`}
                        />
                      ) : (
                        <p className="font-semibold text-sm text-gray-900 pt-1">{CREDENTIAL_LABELS[line.type]}</p>
                      )}
                      <button
                        onClick={() => toggleCredential(line.type)}
                        className="text-gray-400 hover:text-(--dominant-red) cursor-pointer shrink-0"
                        aria-label="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      <div>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pages</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          {PAGE_CHOICES.map((page) => {
                            const active = line.pages === page;
                            return (
                              <label
                                key={page}
                                className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-sm font-semibold cursor-pointer transition-colors ${
                                  active
                                    ? 'border-(--dominant-red) bg-(--dominant-red) text-white'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={active}
                                  onChange={() => updateLine(line.type, { pages: active ? null : page })}
                                />
                                {page}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Remarks</span>
                        <Input
                          value={line.remarks}
                          onChange={(e) => updateLine(line.type, { remarks: e.target.value })}
                          placeholder="e.g. for CHED authentication"
                          className={`${inputClass} mt-1.5`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Purpose */}
          <section className="px-6 py-5 border-b">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Purpose</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
                  >
                    {form.purposes.length > 0 ? `${form.purposes.length} selected` : 'Choose purpose'}
                    <span className="ml-2 text-gray-400">▾</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Select all that apply</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {PURPOSE_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={form.purposes.includes(option.value)}
                      onCheckedChange={() => togglePurpose(option.value)}
                      onSelect={(e) => e.preventDefault()}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {form.purposes.length === 0 ? (
              <p className="text-sm text-gray-400">No purpose chosen yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {form.purposes.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-3 py-1.5 text-sm text-red-900"
                  >
                    {PURPOSE_LABELS[value]}
                    <button
                      onClick={() => togglePurpose(value)}
                      className="text-red-400 hover:text-red-700 cursor-pointer"
                      aria-label="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {form.purposes.includes('others') && (
              <div className="mt-3">
                <Field label="Please specify" required>
                  <Input
                    value={form.purpose_other}
                    onChange={(e) => { set('purpose_other', e.target.value); setError(''); }}
                    placeholder="e.g. visa application"
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </section>

          {/* ── Notes */}
          <section className="px-6 py-5">
            <Field label="Notes" hint="Anything the next desk should know. Optional.">
              <textarea
                value={form.remarks}
                onChange={(e) => set('remarks', e.target.value)}
                rows={2}
                placeholder="e.g. student is leaving for abroad on the 20th"
                className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-red-800 focus:ring-2 focus:ring-red-800/20 focus:outline-none"
              />
            </Field>

            {error && (
              <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-gray-500 hidden sm:block">
            Filing sends this to the library, laboratory and program head for clearance.
          </p>
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancel</Button>
            <Button
              onClick={submit}
              disabled={isSaving}
              className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer min-w-[150px]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save changes' : 'File request'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CredentialRequestFormModal;
