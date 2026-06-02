import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Layers, ClipboardList, Calendar as CalendarIcon, Award, Loader2, Save, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { lmsModulesAPI, lmsAssignmentsAPI, lmsSubjectsAPI } from '../api/lmsApi';
import MotionDropdown from '../ui/MotionDropdown';

const INPUT_BORDER = 'bg-white border border-gray-300 focus:border-(--dominant-red) focus:ring-1 focus:ring-(--dominant-red)/30';

const buildIsoFromParts = (date, timeStr) => {
  if (!date) return null;
  const [h = 23, m = 59] = (timeStr || '23:59').split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const isoToDate = (iso) => (iso ? new Date(iso) : null);
const isoToTime = (iso) => {
  if (!iso) return '23:59';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const EditModuleModal = ({ isOpen, module, subjectId, onClose, onSuccess, onValidationError }) => {
  const firstAssignment = (module?.assignments || [])[0] || null;

  const [form, setForm] = useState({
    title: '',
    description: '',
    section_id: '',
    instructions: '',
    max_score: 100,
    due_date: null,
    due_time: '23:59',
    allow_late: false,
    clear_deadline: false,
  });
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !module) return;
    setForm({
      title: module.title || '',
      description: module.description || '',
      section_id: module.section_id ? String(module.section_id) : '',
      instructions: firstAssignment?.instructions || '',
      max_score: firstAssignment?.max_score ?? 100,
      due_date: isoToDate(firstAssignment?.due_at),
      due_time: isoToTime(firstAssignment?.due_at),
      allow_late: !!firstAssignment?.allow_late,
      clear_deadline: false,
    });
    setSaving(false);

    setSectionsLoading(true);
    lmsSubjectsAPI.sections(subjectId)
      .then((res) => setSections(res?.data || []))
      .catch(() => setSections([]))
      .finally(() => setSectionsLoading(false));
  }, [isOpen, module, subjectId, firstAssignment]);

  const sectionOptions = [
    { value: '', label: 'All sections (visible to everyone)' },
    ...sections.map((s) => ({ value: String(s.id), label: s.name })),
  ];

  const validate = () => {
    if (!form.title.trim()) return 'Module title is required.';
    if (firstAssignment && !form.clear_deadline && form.instructions.trim()) {
      if (!form.due_date) return 'Please pick a deadline date, or tick "Remove deadline".';
    }
    if (firstAssignment) {
      const max = Number(form.max_score);
      if (!Number.isFinite(max) || max < 1 || max > 1000) {
        return 'Maximum score must be between 1 and 1000.';
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const err = validate();
    if (err) {
      onValidationError?.(err);
      return;
    }
    if (!module?.id) return;

    setSaving(true);
    try {
      // 1) Update module fields
      await lmsModulesAPI.update(module.id, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        section_id: form.section_id ? Number(form.section_id) : null,
      });

      // 2) Update the embedded assignment if present
      if (firstAssignment) {
        await lmsAssignmentsAPI.update(firstAssignment.id, {
          title: form.title.trim(),
          instructions: form.instructions.trim() || null,
          due_at: form.clear_deadline ? null : buildIsoFromParts(form.due_date, form.due_time),
          max_score: Number(form.max_score) || 100,
          allow_late: form.allow_late,
        });
      }

      onSuccess?.({ title: form.title.trim() });
    } catch (e2) {
      const msg = e2?.message
        || (e2?.errors && Object.values(e2.errors).flat().join(' '))
        || 'Failed to save changes.';
      onValidationError?.(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!module) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !saving && onClose?.()}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="gradient-primary px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg leading-tight">Edit module</h3>
                  <p className="text-xs text-white/85 mt-0.5 truncate">
                    {module.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !saving && onClose?.()}
                disabled={saving}
                className="w-9 h-9 rounded-lg hover:bg-white/20 transition flex items-center justify-center shrink-0 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 bg-gray-50">
              {/* Module section */}
              <section className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-(--dominant-red)" />
                  <h4 className="text-sm font-semibold text-gray-900">Module details</h4>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="em-title" className="text-xs font-semibold text-gray-700">
                      Title <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="em-title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      disabled={saving}
                      className={INPUT_BORDER}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="em-desc" className="text-xs font-semibold text-gray-700">
                      Description
                    </Label>
                    <Textarea
                      id="em-desc"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      disabled={saving}
                      rows={2}
                      className={`resize-none ${INPUT_BORDER}`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Section
                    </Label>
                    <MotionDropdown
                      value={form.section_id}
                      onChange={(v) => setForm({ ...form, section_id: v })}
                      options={sectionOptions}
                      placeholder={sectionsLoading ? 'Loading sections…' : 'All sections'}
                      disabled={saving || sectionsLoading}
                    />
                  </div>
                </div>
              </section>

              {/* Assignment section — only if module already has one */}
              {firstAssignment && (
                <section className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-(--dominant-red)" />
                      <h4 className="text-sm font-semibold text-gray-900">Assignment</h4>
                    </div>
                    <label className="text-[11px] flex items-center gap-1.5 text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-(--dominant-red) focus:ring-(--dominant-red)"
                        checked={form.clear_deadline}
                        onChange={(e) => setForm({ ...form, clear_deadline: e.target.checked })}
                        disabled={saving}
                      />
                      Remove deadline
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="em-instr" className="text-xs font-semibold text-gray-700">
                        Instructions
                      </Label>
                      <Textarea
                        id="em-instr"
                        value={form.instructions}
                        onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                        disabled={saving}
                        rows={3}
                        className={`resize-none ${INPUT_BORDER}`}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`space-y-1.5 ${form.clear_deadline ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Label className="text-xs font-semibold text-gray-700">
                          Deadline date & time
                        </Label>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1 justify-start text-left font-normal h-9 bg-white border border-gray-300 hover:bg-gray-50"
                                disabled={saving || form.clear_deadline}
                              >
                                <CalendarIcon className="w-4 h-4 mr-2 text-(--dominant-red)" />
                                {form.due_date
                                  ? new Date(form.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                  : <span className="text-gray-400">Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={form.due_date || undefined}
                                onSelect={(d) => setForm({ ...form, due_date: d })}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Input
                            type="time"
                            value={form.due_time}
                            onChange={(e) => setForm({ ...form, due_time: e.target.value })}
                            disabled={saving || form.clear_deadline}
                            className={`w-28 ${INPUT_BORDER}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="em-max" className="text-xs font-semibold text-gray-700">
                          <span className="inline-flex items-center gap-1">
                            <Award className="w-3 h-3" /> Maximum score
                          </span>
                        </Label>
                        <Input
                          id="em-max"
                          type="number"
                          min="1"
                          max="1000"
                          value={form.max_score}
                          onChange={(e) => setForm({ ...form, max_score: e.target.value })}
                          disabled={saving}
                          className={INPUT_BORDER}
                        />
                      </div>
                    </div>

                    {/* Late submission toggle */}
                    <div className={`flex items-center justify-between gap-3 rounded-lg border-2 px-3 py-3 transition-colors ${form.allow_late ? 'border-amber-400 bg-amber-50' : 'border-gray-300 bg-white'}`}>
                      <div className="min-w-0">
                        <Label htmlFor="em-allow-late" className="text-sm font-semibold text-gray-900 cursor-pointer">
                          Allow late submission
                        </Label>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {form.allow_late
                            ? 'Students can submit after the deadline; their work will be marked late (shows how many days late).'
                            : 'Strict deadline — students cannot submit once the due date passes.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-bold ${form.allow_late ? 'text-amber-700' : 'text-gray-400'}`}>
                          {form.allow_late ? 'ON' : 'OFF'}
                        </span>
                        <Switch
                          id="em-allow-late"
                          checked={form.allow_late}
                          onCheckedChange={(v) => setForm({ ...form, allow_late: v })}
                          disabled={saving}
                          className="h-6 w-10 border border-gray-400 data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-amber-500 [&>span]:size-5"
                        />
                      </div>
                    </div>

                    {firstAssignment.due_at && !form.clear_deadline && (
                      <p className="text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                        <strong>Tip:</strong> bumping this deadline re-opens the assignment for students whose submission window has already closed.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {saving && (
                <div className="bg-(--whitish-pink) border border-red-100 rounded-lg px-4 py-3 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-(--dominant-red) animate-spin shrink-0" />
                  <p className="text-sm text-(--dominant-red) font-medium">Saving changes…</p>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="gradient-primary text-white liquid-button min-w-32"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="w-4 h-4 mr-1.5" /> Save changes</>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditModuleModal;
