import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, Trash2, Upload, Eye, Calendar as CalendarIcon,
  FileText, Award, Clock, Lock, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { lmsAssignmentsAPI, lmsSubmissionsAPI } from '../api/lmsApi';
import SubmissionRosterModal from '../modals/SubmissionRosterModal';

// Notification helpers fall back to no-ops if parent didn't provide them.
const noop = () => {};
const noopConfirm = ({ onConfirm }) => onConfirm?.();

// --------------- helpers ---------------
const fmtFullDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const buildIsoFromParts = (date, timeStr) => {
  if (!date) return null;
  const [h = 23, m = 59] = (timeStr || '23:59').split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

// Human label for how late a submission was, based on backend is_late/days_late.
const lateLabel = (sub) => {
  if (!sub?.is_late) return null;
  const days = sub.days_late ?? 0;
  if (days >= 1) return `Done late — ${days} day${days > 1 ? 's' : ''} late`;
  return 'Done late — same day';
};

// --------------- main panel ---------------
const ModuleAssignmentsPanel = ({
  module,
  role,
  onChanged,
  notifications = {},
}) => {
  const notifySuccess = notifications.success || noop;
  const notifyError = notifications.error || noop;
  const confirmDelete = notifications.confirmDelete || noopConfirm;

  const canManage = role === 'admin' || role === 'instructor';
  const isStudent = role === 'student';

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newA, setNewA] = useState({ title: '', instructions: '', date: null, time: '23:59', max_score: 100, allow_late: false });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [viewSubsFor, setViewSubsFor] = useState(null);
  const [togglingLate, setTogglingLate] = useState(null); // assignment id being toggled

  const load = () => {
    setLoading(true);
    lmsAssignmentsAPI.listByModule(module.id)
      .then((res) => setAssignments(res?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [module.id]);

  const resetForm = () => {
    setNewA({ title: '', instructions: '', date: null, time: '23:59', max_score: 100, allow_late: false });
    setFormError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newA.title.trim()) {
      setFormError('Title is required.');
      notifyError('Assignment title is required.');
      return;
    }
    setCreating(true);
    try {
      await lmsAssignmentsAPI.create({
        module_id: module.id,
        title: newA.title,
        instructions: newA.instructions,
        due_at: buildIsoFromParts(newA.date, newA.time),
        max_score: Number(newA.max_score) || 100,
        allow_late: newA.allow_late,
      });
      notifySuccess('Assignment created.');
      resetForm();
      setShowForm(false);
      load();
      onChanged?.();
    } catch (err) {
      const msg = err?.message || 'Failed to create assignment.';
      setFormError(msg);
      notifyError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (a) => {
    confirmDelete({
      title: 'Delete assignment',
      itemName: a.title,
      message: 'Deleting this assignment will also remove all student submissions for it. This cannot be undone.',
      onConfirm: async () => {
        try {
          await lmsAssignmentsAPI.remove(a.id);
          notifySuccess('Assignment deleted.');
          load();
        } catch (err) {
          notifyError(err?.message || 'Failed to delete assignment.');
        }
      },
    });
  };

  const handleToggleLate = async (a, next) => {
    setTogglingLate(a.id);
    // Optimistic update so the switch feels instant.
    setAssignments((prev) => prev.map((x) => (x.id === a.id ? { ...x, allow_late: next } : x)));
    try {
      await lmsAssignmentsAPI.update(a.id, { allow_late: next });
      notifySuccess(next ? 'Late submission enabled.' : 'Late submission disabled (strict deadline).');
    } catch (err) {
      // Roll back on failure.
      setAssignments((prev) => prev.map((x) => (x.id === a.id ? { ...x, allow_late: !next } : x)));
      notifyError(err?.message || 'Failed to update late submission setting.');
    } finally {
      setTogglingLate(null);
    }
  };

  const handleSubmit = async (aid, file) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      notifyError('Only PDF and DOCX files are allowed.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      notifyError('File exceeds the 20 MB limit.');
      return;
    }
    try {
      await lmsSubmissionsAPI.submit(aid, file);
      notifySuccess('Submission uploaded.');
      load();
    } catch (err) {
      notifyError(err?.message || 'Failed to upload your submission.');
    }
  };

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center">
            <ClipboardList className="w-4 h-4" />
          </div>
          <p className="text-sm font-semibold text-gray-800">Assignments</p>
          <span className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
            {assignments.length}
          </span>
        </div>
        {canManage && !showForm && (
          <Button
            size="sm"
            className="gradient-primary text-white liquid-button"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> New Assignment
          </Button>
        )}
      </div>

      {/* Create form */}
      <AnimatePresence initial={false}>
        {canManage && showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleCreate}
              className="bg-(--whitish-pink) border border-red-100 rounded-xl p-5 mb-5 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="a-title" className="text-xs font-semibold text-gray-700">
                    Title <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="a-title"
                    placeholder="e.g. Module 1 Reflection Paper"
                    value={newA.title}
                    onChange={(e) => setNewA({ ...newA, title: e.target.value })}
                    disabled={creating}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="a-instr" className="text-xs font-semibold text-gray-700">
                    Instructions
                  </Label>
                  <Input
                    id="a-instr"
                    placeholder="Short instructions for students…"
                    value={newA.instructions}
                    onChange={(e) => setNewA({ ...newA, instructions: e.target.value })}
                    disabled={creating}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Due date & time</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 justify-start text-left font-normal"
                          disabled={creating}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2 text-(--dominant-red)" />
                          {newA.date
                            ? new Date(newA.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                            : <span className="text-gray-400">Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newA.date || undefined}
                          onSelect={(d) => setNewA({ ...newA, date: d })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={newA.time}
                      onChange={(e) => setNewA({ ...newA, time: e.target.value })}
                      disabled={creating}
                      className="w-28"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="a-max" className="text-xs font-semibold text-gray-700">
                    Maximum score
                  </Label>
                  <Input
                    id="a-max"
                    type="number"
                    min="1"
                    max="1000"
                    value={newA.max_score}
                    onChange={(e) => setNewA({ ...newA, max_score: e.target.value })}
                    disabled={creating}
                  />
                </div>

                {/* Late submission toggle */}
                <div className={`md:col-span-2 flex items-center justify-between gap-3 rounded-lg border-2 px-3 py-3 transition-colors ${newA.allow_late ? 'border-amber-400 bg-amber-50' : 'border-gray-300 bg-white'}`}>
                  <div className="min-w-0">
                    <Label htmlFor="a-allow-late" className="text-sm font-semibold text-gray-900 cursor-pointer">
                      Allow late submission
                    </Label>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {newA.allow_late
                        ? 'Students can submit after the deadline; their work will be marked late.'
                        : 'Strict deadline — students cannot submit once the due date passes.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold ${newA.allow_late ? 'text-amber-700' : 'text-gray-400'}`}>
                      {newA.allow_late ? 'ON' : 'OFF'}
                    </span>
                    <Switch
                      id="a-allow-late"
                      checked={newA.allow_late}
                      onCheckedChange={(v) => setNewA({ ...newA, allow_late: v })}
                      disabled={creating}
                      className="h-6 w-10 border border-gray-400 data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-amber-500 [&>span]:size-5"
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" className="gradient-primary text-white liquid-button min-w-32" disabled={creating}>
                  {creating
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Plus className="w-4 h-4 mr-1" /> Create</>}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignment list */}
      {loading ? (
        <div className="text-sm text-gray-400 py-4 text-center">Loading assignments…</div>
      ) : assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 px-4 text-center">
          <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No assignments yet for this module.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {assignments.map((a) => {
            const deadlinePassed = !!(a.due_at && new Date(a.due_at).getTime() < Date.now());
            const allowLate = !!a.allow_late;
            // Students may submit before the deadline, or after it when late
            // submission is enabled for this assignment.
            const canStudentSubmit = isStudent && (!deadlinePassed || allowLate);
            const submittedLate = lateLabel(a.my_submission);
            return (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-xl p-4 bg-white transition-all ${
                deadlinePassed && isStudent
                  ? 'border-amber-200 hover:border-amber-300'
                  : 'border-gray-200 hover:border-(--dominant-red)/30 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">{a.title}</h4>
                  {a.instructions && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{a.instructions}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-500">
                    {a.due_at && (
                      <span className={`inline-flex items-center gap-1 ${deadlinePassed ? 'text-amber-700 font-semibold' : ''}`}>
                        <Clock className="w-3 h-3" /> Due {fmtFullDateTime(a.due_at)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Award className="w-3 h-3" /> Max {a.max_score}
                    </span>
                    {deadlinePassed && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5 font-semibold">
                        <AlertTriangle className="w-3 h-3" /> Deadline passed
                      </span>
                    )}
                    {allowLate ? (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">
                        <Clock className="w-3 h-3" /> Late submission allowed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-2 py-0.5">
                        <Lock className="w-3 h-3" /> Strict deadline
                      </span>
                    )}
                  </div>

                  {/* Instructor / admin: quick toggle for late submission */}
                  {canManage && (
                    <div className={`mt-2 inline-flex items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 transition-colors ${allowLate ? 'border-amber-400 bg-amber-50' : 'border-gray-300 bg-gray-50'}`}>
                      <Switch
                        id={`late-${a.id}`}
                        checked={allowLate}
                        onCheckedChange={(v) => handleToggleLate(a, v)}
                        disabled={togglingLate === a.id}
                        className="h-6 w-10 border border-gray-400 data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-amber-500 [&>span]:size-5"
                      />
                      <Label htmlFor={`late-${a.id}`} className="text-[11px] font-medium text-gray-700 cursor-pointer">
                        Allow late submission
                      </Label>
                      <span className={`text-[10px] font-bold ${allowLate ? 'text-amber-700' : 'text-gray-400'}`}>
                        {allowLate ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  )}

                  {isStudent && a.my_submission && (
                    <div className={`mt-3 rounded-lg p-3 border ${submittedLate ? 'bg-amber-50 border-amber-200' : 'bg-(--whitish-pink) border-red-100'}`}>
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${submittedLate ? 'text-amber-700' : 'text-(--dominant-red)'}`} />
                        <p className={`text-xs font-medium truncate ${submittedLate ? 'text-amber-800' : 'text-(--dominant-red)'}`}>
                          {a.my_submission.original_name}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Submitted {fmtFullDateTime(a.my_submission.submitted_at)}
                      </p>
                      {submittedLate && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-2 py-0.5">
                          <AlertTriangle className="w-3 h-3" /> {submittedLate}
                        </span>
                      )}
                      {(a.my_submission.score !== null && a.my_submission.score !== undefined) && (
                        <p className="text-[11px] mt-1.5">
                          Score: <span className="font-bold text-gray-900">{a.my_submission.score}</span>
                          <span className="text-gray-500"> / {a.max_score}</span>
                        </p>
                      )}
                      {a.my_submission.feedback && (
                        <p className="text-[11px] italic text-gray-600 mt-1">"{a.my_submission.feedback}"</p>
                      )}
                    </div>
                  )}

                  {isStudent && deadlinePassed && allowLate && (
                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-amber-900">
                        <p className="font-semibold">Late submission is allowed.</p>
                        <p className="mt-0.5">
                          The deadline has passed, but you can still submit. Your work will be marked as <strong>late</strong> and show how many days late it was.
                        </p>
                      </div>
                    </div>
                  )}

                  {isStudent && deadlinePassed && !allowLate && (
                    <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3 flex items-start gap-2">
                      <Lock className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-gray-700">
                        <p className="font-semibold">Submissions are closed.</p>
                        <p className="mt-0.5">
                          The deadline has passed and this assignment has a strict deadline. You can no longer submit unless your instructor reopens it.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {canStudentSubmit && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc"
                        className="hidden"
                        onChange={(e) => handleSubmit(a.id, e.target.files?.[0])}
                      />
                      <span className={`inline-flex items-center text-xs px-3 py-1.5 rounded-md text-white hover:opacity-90 transition ${deadlinePassed ? 'bg-amber-600' : 'gradient-primary'}`}>
                        <Upload className="w-3.5 h-3.5 mr-1" />
                        {a.my_submission ? 'Resubmit' : 'Submit'}{deadlinePassed ? ' (late)' : ''}
                      </span>
                    </label>
                  )}
                  {isStudent && deadlinePassed && !allowLate && (
                    <span className="inline-flex items-center text-xs bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md cursor-not-allowed" title="Submissions are closed">
                      <Lock className="w-3.5 h-3.5 mr-1" /> Closed
                    </span>
                  )}
                  {canManage && (
                    <>
                      <button
                        className="text-(--dominant-red) hover:bg-(--whitish-pink) p-2 rounded-md transition"
                        onClick={() => setViewSubsFor(a)}
                        title="View submissions"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:bg-red-50 p-2 rounded-md transition"
                        onClick={() => handleDelete(a)}
                        title="Delete assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.li>
            );
          })}
        </ul>
      )}

      {/* Legend */}
      {!loading && assignments.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 border-t border-gray-100 pt-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Strict deadline
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late submission allowed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> "Done late — N day(s) late" = submitted after the deadline
          </span>
        </div>
      )}

      <AnimatePresence>
        {viewSubsFor && (
          <SubmissionRosterModal
            assignment={viewSubsFor}
            onClose={() => setViewSubsFor(null)}
            notifySuccess={notifySuccess}
            notifyError={notifyError}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModuleAssignmentsPanel;
