import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TriangleAlert, X, Search, Loader2, Check, ChevronDown, ChevronLeft,
  ChevronRight, Wand2, UserPlus, CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sectionGapAPI } from '@/services/api';

/**
 * Irregular students sitting in a class whose section list does not have them.
 *
 * A back subject is taught by a section the student does not belong to, so
 * enrolling them in the subject is only half the job — and the half that gets
 * forgotten leaves them off the section roster. This finds those students and
 * puts them in the right section.
 *
 * It does NOT pick the section for them. The same subject is usually taught by
 * several sections and nothing in the data records which one a student
 * actually sits in, so choosing would be guessing with someone's enrolment.
 * The likeliest section — one of their own course — is offered first, and the
 * one case that needs no judgement, where a subject is taught by exactly one
 * section, can be done for the whole list in a click.
 */

const PER_PAGE = 15;

const SectionGapsModal = ({ isOpen, onClose, onFixed }) => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({ total_gaps: 0, students_affected: 0, single_option: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState({});   // `${studentId}:${subjectId}` -> sectionId
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState([]);       // keys already assigned this session
  const [error, setError] = useState('');
  // Whether anything was actually assigned, so the page behind only reloads
  // when there is something new to show.
  const changedRef = useRef(false);
  const close = useCallback(() => onClose(changedRef.current), [onClose]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sectionGapAPI.getAll();
      if (res?.success) {
        setStudents(res.data || []);
        setSummary({
          total_gaps: res.total_gaps || 0,
          students_affected: res.students_affected || 0,
          single_option: res.single_option || 0,
        });
      }
    } catch (err) {
      setError(err?.message || 'Could not check section assignments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      load(); setPicked({}); setDone([]); setPage(1); setSearch('');
      changedRef.current = false;
    }
  }, [isOpen, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      (s.name || '').toLowerCase().includes(q)
      || (s.student_id_number || '').toLowerCase().includes(q)
      || s.subjects.some((sub) => (sub.subject_code || '').toLowerCase().includes(q)));
  }, [students, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visible = useMemo(
    () => filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [filtered, currentPage]
  );

  useEffect(() => { setPage(1); }, [search]);

  const sectionFor = (studentId, subject) => {
    const key = `${studentId}:${subject.subject_id}`;
    return picked[key] ?? subject.sections[0]?.section_id ?? null;
  };

  const assign = async (pairs, label) => {
    if (!pairs.length || busy) return;
    setBusy(true);
    setError('');
    try {
      await sectionGapAPI.assign(pairs.map((p) => ({
        pre_enrolled_student_id: p.studentId,
        section_id: p.sectionId,
      })));
      setDone((prev) => [...prev, ...pairs.map((p) => p.key)]);
      changedRef.current = true;
      if (onFixed) onFixed(label);
    } catch (err) {
      setError(err?.message || 'Could not assign. Nothing was changed.');
    } finally {
      setBusy(false);
    }
  };

  /** Every gap whose subject is taught by exactly one section. */
  const obvious = useMemo(() => {
    const out = [];
    students.forEach((s) => s.subjects.forEach((sub) => {
      const key = `${s.student_id}:${sub.subject_id}`;
      if (sub.sections.length === 1 && !done.includes(key)) {
        out.push({ key, studentId: s.student_id, sectionId: sub.sections[0].section_id });
      }
    }));
    return out;
  }, [students, done]);

  const remaining = summary.total_gaps - done.length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Students missing from a section"
        >
          {/* Header — the house style for a modal: maroon band, white text */}
          <div className="flex items-start justify-between gap-4 px-6 py-5 bg-red-800 rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <TriangleAlert className="w-5 h-5 mr-2 text-amber-300" />
                Students missing from a section
              </h2>
              <p className="text-sm text-red-100/90 mt-0.5">
                These students take a subject that none of their sections teaches — so they are
                not on that instructor&rsquo;s list.
              </p>
            </div>
            <button
              onClick={close}
              className="text-white hover:text-red-800 hover:bg-white rounded-md p-1 cursor-pointer transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Summary + bulk action */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-5 text-sm">
              <span className="text-gray-600">
                <strong className="text-gray-900 tabular-nums">{remaining}</strong> to fix
              </span>
              <span className="text-gray-600">
                <strong className="text-gray-900 tabular-nums">{summary.students_affected}</strong> students
              </span>
              {done.length > 0 && (
                <span className="text-green-700 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {done.length} fixed
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Name, ID or subject…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-white"
                />
              </div>
              <Button
                size="sm"
                onClick={() => assign(obvious, `${obvious.length} assigned automatically`)}
                disabled={busy || obvious.length === 0}
                className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer"
                title="Only where the subject is taught by a single section"
              >
                {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1.5" />}
                Fix {obvious.length} obvious
              </Button>
            </div>
          </div>

          {error && (
            <p className="px-6 py-2.5 text-sm text-red-800 bg-red-50 border-b border-red-100">{error}</p>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="py-16 text-center text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />Checking every enrolment…
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-500">
                {students.length === 0
                  ? 'Every student is in a section for all of their subjects.'
                  : 'No one matches that search.'}
              </p>
            ) : visible.map((student) => (
              <StudentGap
                key={student.student_id}
                student={student}
                picked={picked}
                setPicked={setPicked}
                done={done}
                busy={busy}
                sectionFor={sectionFor}
                onAssign={assign}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <span className="text-xs text-gray-500">
              {pageCount > 1
                ? `Page ${currentPage} of ${pageCount} · ${filtered.length} students`
                : `${filtered.length} ${filtered.length === 1 ? 'student' : 'students'}`}
            </span>
            <div className="flex items-center gap-2">
              {pageCount > 1 && (
                <>
                  <Button
                    variant="outline" size="sm" className="cursor-pointer bg-white h-8 w-8 p-0"
                    disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline" size="sm" className="cursor-pointer bg-white h-8 w-8 p-0"
                    disabled={currentPage >= pageCount} onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={close} className="cursor-pointer bg-white">Close</Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/** One student and their orphaned subjects. Memoised: the list runs long. */
const StudentGap = memo(({ student, picked, setPicked, done, busy, sectionFor, onAssign }) => {
  const open = student.subjects.filter((s) => !done.includes(`${student.student_id}:${s.subject_id}`));
  if (open.length === 0) {
    return (
      <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 text-sm text-green-700 bg-green-50/40">
        <CheckCircle2 className="w-4 h-4" />
        <span className="font-medium">{student.name}</span>
        <span className="text-gray-500">— all set</span>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 border-b border-gray-100">
      <div className="flex items-baseline gap-2 mb-2.5">
        <span className="font-semibold text-gray-900 uppercase text-sm">{student.name}</span>
        <span className="text-xs text-gray-400 font-mono">{student.student_id_number}</span>
        <span className="text-xs text-gray-500">{student.course_code} · {student.year}</span>
      </div>

      <div className="space-y-2">
        {open.map((subject) => {
          const key = `${student.student_id}:${subject.subject_id}`;
          const chosen = sectionFor(student.student_id, subject);
          return (
            <div key={subject.subject_id} className="flex flex-wrap items-center gap-3 pl-3 border-l-2 border-amber-200">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-900">{subject.subject_code}</span>
                <span className="text-sm text-gray-500 ml-2 truncate">{subject.descriptive_title}</span>
                <span className="text-xs text-amber-700 ml-2">({subject.subject_year})</span>
              </div>

              {subject.sections.length === 0 ? (
                <span className="text-xs text-gray-500 italic">No section teaches this subject</span>
              ) : (
                <>
                  <SectionPick
                    options={subject.sections}
                    value={chosen}
                    onChange={(id) => setPicked((p) => ({ ...p, [key]: id }))}
                  />
                  <Button
                    size="sm"
                    disabled={busy || !chosen}
                    onClick={() => onAssign([{ key, studentId: student.student_id, sectionId: chosen }], 'Student added to the section')}
                    className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer h-8"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Add
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
StudentGap.displayName = 'StudentGap';

/** Which section to put them in — the app's own dropdown, never a native one. */
const SectionPick = ({ options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const current = options.find((o) => o.section_id === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative w-72" ref={wrap}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={options.length === 1}
        className="w-full flex items-center justify-between gap-2 px-3 h-8 bg-white border border-gray-200
          rounded-lg text-xs text-gray-900 hover:border-gray-300 disabled:opacity-80 cursor-pointer
          disabled:cursor-default"
      >
        <span className="truncate text-left">
          {current?.name}
          {current?.instructor && <span className="text-gray-400"> · {current.instructor}</span>}
        </span>
        {options.length > 1 && (
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200
              rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto"
          >
            {options.map((o) => (
              <li key={o.section_id}>
                <button
                  type="button"
                  onClick={() => { onChange(o.section_id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs cursor-pointer
                    ${o.section_id === value ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 truncate">{o.name}</span>
                    {o.section_id === value && <Check className="w-3 h-3 shrink-0 text-(--dominant-red)" />}
                  </div>
                  <div className="text-gray-500 truncate">
                    {o.instructor || 'No instructor'}{o.meets ? ` · ${o.meets}` : ''}
                    {!o.same_course && <span className="text-amber-600"> · other course</span>}
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SectionGapsModal;
