import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Inbox, Download, Award, FileText, CheckCircle2, Clock, AlertTriangle,
  Search, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { lmsSubmissionsAPI } from '../api/lmsApi';
import MotionDropdown from '../ui/MotionDropdown';

const noop = () => {};

const fmtFullDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const statusMeta = (status, isLate) => {
  if (status === 'graded')   return { label: 'Graded', cls: 'bg-green-50 text-green-700 border-green-200', Icon: CheckCircle2 };
  if (status === 'submitted')return { label: isLate ? 'Submitted · late' : 'Submitted', cls: isLate ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200', Icon: isLate ? AlertTriangle : Clock };
  return { label: 'Not submitted', cls: 'bg-red-50 text-red-700 border-red-200', Icon: AlertTriangle };
};

// Human label for how late a submission was (matches the student-side wording).
const lateLabel = (row) => {
  if (!row?.is_late) return null;
  const days = row.days_late ?? 0;
  if (days >= 1) return `Done late — ${days} day${days > 1 ? 's' : ''} late`;
  return 'Done late — same day';
};

/**
 * Full roster modal for instructors/admins.
 * Shows every enrolled student for the assignment (scoped to module section),
 * not just those who already submitted. Inline grading kept.
 */
const SubmissionRosterModal = ({ assignment, onClose, notifySuccess = noop, notifyError = noop }) => {
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // all | not_submitted | submitted | graded
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    lmsSubmissionsAPI.roster(assignment.id)
      .then((res) => setRoster(res?.data || null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [assignment.id]);

  const handleDownload = async (sub) => {
    try { await lmsSubmissionsAPI.download(sub.id, sub.original_name); }
    catch { notifyError('Failed to download the submission.'); }
  };

  const handleGrade = async (sub) => {
    if (gradeForm.score === '' || gradeForm.score === null) {
      notifyError('Please enter a score before saving.');
      return;
    }
    setSaving(true);
    try {
      await lmsSubmissionsAPI.grade(sub.id, {
        score: Number(gradeForm.score),
        feedback: gradeForm.feedback,
      });
      notifySuccess('Grade saved.');
      setGradingId(null);
      load();
    } catch (err) {
      notifyError(err?.message || 'Failed to save the grade.');
    } finally {
      setSaving(false);
    }
  };

  const stats = roster?.stats || { total: 0, submitted: 0, graded: 0, missing: 0, late: 0 };

  const rows = useMemo(() => {
    let r = roster?.rows || [];
    if (filter !== 'all') {
      r = r.filter((row) => {
        if (filter === 'not_submitted') return row.status === 'not_submitted';
        if (filter === 'submitted') return row.status === 'submitted';
        if (filter === 'graded') return row.status === 'graded';
        return true;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((row) => (row.name || '').toLowerCase().includes(q) || (row.email || '').toLowerCase().includes(q));
    }
    return r;
  }, [roster, filter, search]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="gradient-primary px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate">Submission Roster</h3>
              <p className="text-xs text-white/85 truncate">
                {assignment.title} · Max {assignment.max_score}
                {assignment.allow_late ? ' · Late submission allowed' : ' · Strict deadline'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-white/20 transition flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stat strip */}
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 grid grid-cols-3 sm:grid-cols-5 gap-2">
          <StatPill label="Total" value={stats.total} tone="gray" />
          <StatPill label="Submitted" value={stats.submitted} tone="blue" />
          <StatPill label="Graded" value={stats.graded} tone="green" />
          <StatPill label="Missing" value={stats.missing} tone="red" />
          <StatPill label="Late" value={stats.late} tone="amber" />
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 bg-white border-b border-gray-100 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or email…"
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-56">
            <MotionDropdown
              value={filter}
              onChange={setFilter}
              icon={Filter}
              options={[
                { value: 'all', label: 'All students' },
                { value: 'not_submitted', label: 'Not submitted' },
                { value: 'submitted', label: 'Submitted · ungraded' },
                { value: 'graded', label: 'Graded' },
              ]}
            />
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 bg-gray-50 flex-1">
          {loading ? (
            <div className="text-sm text-gray-500 py-10 text-center">Loading roster…</div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-10 px-4 text-center bg-white">
              <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {search || filter !== 'all'
                  ? 'No students match the current filter.'
                  : 'No enrolled students for this assignment.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => {
                const meta = statusMeta(row.status, row.is_late);
                const Icon = meta.Icon;
                const sub = row.submission;
                return (
                  <motion.li
                    key={row.user_id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                          {(row.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{row.name}</p>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border rounded-full px-2 py-0.5 ${meta.cls}`}>
                              <Icon className="w-3 h-3" /> {meta.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{row.email}</p>

                          {sub && (
                            <>
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-700">
                                <FileText className="w-3.5 h-3.5 text-(--dominant-red)" />
                                <span className="truncate">{sub.original_name}</span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Submitted {fmtFullDateTime(sub.submitted_at)}
                              </p>
                              {row.is_late && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-2 py-0.5">
                                  <AlertTriangle className="w-3 h-3" /> {lateLabel(row)}
                                </span>
                              )}
                            </>
                          )}

                          {sub && (sub.score !== null && sub.score !== undefined) && (
                            <div className="mt-2 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-2 py-1">
                              <Award className="w-3.5 h-3.5 text-green-700" />
                              <p className="text-[11px] text-green-800">
                                <span className="font-bold">{sub.score}</span> / {assignment.max_score}
                                {sub.grader?.name && <span className="text-green-700/70"> · by {sub.grader.name}</span>}
                              </p>
                            </div>
                          )}
                          {sub?.feedback && (
                            <p className="text-[11px] text-gray-600 italic mt-1.5 bg-gray-50 rounded px-2 py-1">
                              "{sub.feedback}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        {sub ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleDownload(sub)}>
                              <Download className="w-3.5 h-3.5 mr-1" /> Download
                            </Button>
                            <Button
                              size="sm"
                              className="gradient-primary text-white liquid-button"
                              onClick={() => {
                                setGradingId(sub.id);
                                setGradeForm({ score: sub.score ?? '', feedback: sub.feedback ?? '' });
                              }}
                            >
                              <Award className="w-3.5 h-3.5 mr-1" /> {(sub.score !== null && sub.score !== undefined) ? 'Re-grade' : 'Grade'}
                            </Button>
                          </>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic px-1">No submission yet</span>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {sub && gradingId === sub.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-[140px_1fr_auto_auto] gap-2 items-end">
                            <div className="space-y-1">
                              <Label htmlFor={`score-${sub.id}`} className="text-[11px] text-gray-600">
                                Score / {assignment.max_score}
                              </Label>
                              <Input
                                id={`score-${sub.id}`}
                                type="number"
                                min="0"
                                max={assignment.max_score}
                                placeholder="0"
                                value={gradeForm.score}
                                onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`fb-${sub.id}`} className="text-[11px] text-gray-600">
                                Feedback (optional)
                              </Label>
                              <Input
                                id={`fb-${sub.id}`}
                                placeholder="Comments for the student…"
                                value={gradeForm.feedback}
                                onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                              />
                            </div>
                            <Button
                              className="gradient-primary text-white"
                              onClick={() => handleGrade(sub)}
                              disabled={saving}
                            >
                              {saving ? '…' : 'Save'}
                            </Button>
                            <Button variant="outline" onClick={() => setGradingId(null)} disabled={saving}>
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const toneMap = {
  gray:  'bg-white border-gray-200 text-gray-700',
  blue:  'bg-blue-50 border-blue-200 text-blue-800',
  green: 'bg-green-50 border-green-200 text-green-800',
  red:   'bg-red-50 border-red-200 text-red-800',
  amber: 'bg-amber-50 border-amber-200 text-amber-800',
};
const StatPill = ({ label, value, tone = 'gray' }) => (
  <div className={`rounded-lg border px-3 py-2 text-center ${toneMap[tone] || toneMap.gray}`}>
    <p className="text-[10px] uppercase tracking-wider font-semibold opacity-75">{label}</p>
    <p className="text-lg font-bold leading-tight">{value}</p>
  </div>
);

export default SubmissionRosterModal;
