import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Layers, FileText, Calendar as CalendarIcon, ClipboardList,
  Award, Upload, Loader2, Users,
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

// Shared override so inputs have a visible border on coloured cards.
const INPUT_BORDER = 'bg-white border border-gray-300 focus:border-(--dominant-red) focus:ring-1 focus:ring-(--dominant-red)/30';

const ALLOWED_EXT = ['pdf', 'docx', 'doc'];
const MAX_BYTES = 20 * 1024 * 1024;

const buildIsoFromParts = (date, timeStr) => {
  if (!date) return null;
  const [h = 23, m = 59] = (timeStr || '23:59').split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const fmtBytes = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const blankForm = {
  title: '',
  description: '',
  section_id: '',          // '' = all sections (no scope)
  instructions: '',
  max_score: 100,
  due_date: null,
  due_time: '23:59',
  allow_late: false,
  file: null,
};

const CreateModuleModal = ({ isOpen, subjectId, onClose, onSuccess, onValidationError }) => {
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState('idle'); // idle | module | file | assignment | done
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(blankForm);
      setSaving(false);
      setStep('idle');
      // Load sections relevant to the current user for this subject
      setSectionsLoading(true);
      lmsSubjectsAPI.sections(subjectId)
        .then((res) => setSections(res?.data || []))
        .catch(() => setSections([]))
        .finally(() => setSectionsLoading(false));
    }
  }, [isOpen, subjectId]);

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      onValidationError?.('Only PDF and DOCX files are allowed.');
      return;
    }
    if (file.size > MAX_BYTES) {
      onValidationError?.('File exceeds the 20 MB limit.');
      return;
    }
    setForm((f) => ({ ...f, file }));
  };

  const validate = () => {
    if (!form.title.trim()) return 'Module title is required.';
    if (form.instructions.trim() || form.due_date) {
      // Assignment will be created — require deadline if instructions present
      if (!form.due_date) return 'Please pick an assignment deadline.';
      const max = Number(form.max_score);
      if (!Number.isFinite(max) || max < 1 || max > 1000) {
        return 'Maximum score must be a number between 1 and 1000.';
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

    setSaving(true);
    setStep('module');
    let moduleId = null;
    let createdAssignment = false;
    let uploadedFile = false;

    try {
      // 1. Create module
      const moduleRes = await lmsModulesAPI.create({
        subject_id: Number(subjectId),
        section_id: form.section_id ? Number(form.section_id) : null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        order_index: 0,
        is_published: true,
      });
      moduleId = moduleRes?.data?.id;
      if (!moduleId) throw new Error('Module creation returned no ID.');

      // 2. Upload file (optional)
      if (form.file) {
        setStep('file');
        await lmsModulesAPI.uploadFile(moduleId, form.file);
        uploadedFile = true;
      }

      // 3. Create assignment (optional — only if instructions or deadline given)
      if (form.instructions.trim() || form.due_date) {
        setStep('assignment');
        await lmsAssignmentsAPI.create({
          module_id: moduleId,
          title: form.title.trim(), // mirror module title for the embedded assignment
          instructions: form.instructions.trim() || null,
          due_at: buildIsoFromParts(form.due_date, form.due_time),
          max_score: Number(form.max_score) || 100,
          allow_late: form.allow_late,
          is_published: true,
        });
        createdAssignment = true;
      }

      setStep('done');
      onSuccess?.({
        moduleId,
        uploadedFile,
        createdAssignment,
        title: form.title.trim(),
      });
    } catch (e2) {
      const msg = e2?.message
        || (e2?.errors && Object.values(e2.errors).flat().join(' '))
        || 'Failed to create module.';
      // Module may have been created already — surface that to the user.
      const partial = moduleId
        ? `${msg} (Module was created with id ${moduleId}, but a follow-up step failed.)`
        : msg;
      onValidationError?.(partial);
    } finally {
      setSaving(false);
      setStep('idle');
    }
  };

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
            {/* Gradient header */}
            <div className="gradient-primary px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg leading-tight">Create a new module</h3>
                  <p className="text-xs text-white/85 mt-0.5">
                    Title, description, assignment & material — all in one step.
                  </p>
                </div>
              </div>
              <button
                onClick={() => !saving && onClose?.()}
                className="w-9 h-9 rounded-lg hover:bg-white/20 transition flex items-center justify-center shrink-0 disabled:opacity-40"
                disabled={saving}
                title="Close"
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
                    <Label htmlFor="cm-title" className="text-xs font-semibold text-gray-700">
                      Title <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="cm-title"
                      placeholder="e.g. Week 1 — Introduction to Curriculum Design"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      disabled={saving}
                      className={INPUT_BORDER}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cm-desc" className="text-xs font-semibold text-gray-700">
                      Description
                    </Label>
                    <Textarea
                      id="cm-desc"
                      placeholder="Short summary of what this module covers…"
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
                      options={[
                        { value: '', label: 'All sections (visible to everyone)' },
                        ...sections.map((s) => ({ value: String(s.id), label: s.name })),
                      ]}
                      placeholder={sectionsLoading ? 'Loading sections…' : 'All sections'}
                      disabled={saving || sectionsLoading}
                    />
                    <p className="text-[11px] text-gray-500">
                      Pick a specific section to scope this module, or leave on
                      <span className="font-medium"> "All sections"</span> to publish for every section you teach.
                    </p>
                  </div>
                </div>
              </section>

              {/* File section */}
              <section className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-(--dominant-red)" />
                  <h4 className="text-sm font-semibold text-gray-900">Material file</h4>
                  <span className="text-[11px] text-gray-500">(optional · PDF or DOCX · max 20 MB)</span>
                </div>

                {form.file ? (
                  <div className="flex items-center gap-3 bg-(--whitish-pink) border border-red-100 rounded-lg px-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-white text-(--dominant-red) flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{form.file.name}</p>
                      <p className="text-[11px] text-gray-500">{fmtBytes(form.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, file: null })}
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded transition"
                      disabled={saving}
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                      disabled={saving}
                    />
                    <div className="rounded-xl border-2 border-dashed border-gray-300 hover:border-(--dominant-red)/50 hover:bg-(--whitish-pink)/40 transition-all p-6 text-center">
                      <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Click to attach a file</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">PDF or DOCX — up to 20 MB</p>
                    </div>
                  </label>
                )}
              </section>

              {/* Assignment section */}
              <section className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="w-4 h-4 text-(--dominant-red)" />
                  <h4 className="text-sm font-semibold text-gray-900">Assignment</h4>
                  <span className="text-[11px] text-gray-500">(optional — leave blank for material-only module)</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cm-instr" className="text-xs font-semibold text-gray-700">
                      Instructions for students
                    </Label>
                    <Textarea
                      id="cm-instr"
                      placeholder="What should students do for this assignment?"
                      value={form.instructions}
                      onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                      disabled={saving}
                      rows={3}
                      className={`resize-none ${INPUT_BORDER}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
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
                              disabled={saving}
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
                          disabled={saving}
                          className={`w-28 ${INPUT_BORDER}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cm-max" className="text-xs font-semibold text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Award className="w-3 h-3" /> Maximum score
                        </span>
                      </Label>
                      <Input
                        id="cm-max"
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
                      <Label htmlFor="cm-allow-late" className="text-sm font-semibold text-gray-900 cursor-pointer">
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
                        id="cm-allow-late"
                        checked={form.allow_late}
                        onCheckedChange={(v) => setForm({ ...form, allow_late: v })}
                        disabled={saving}
                        className="h-6 w-10 border border-gray-400 data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-amber-500 [&>span]:size-5"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Progress hint while saving */}
              {saving && (
                <div className="bg-(--whitish-pink) border border-red-100 rounded-lg px-4 py-3 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-(--dominant-red) animate-spin shrink-0" />
                  <p className="text-sm text-(--dominant-red) font-medium">
                    {step === 'module' && 'Saving module…'}
                    {step === 'file' && 'Uploading file to storage…'}
                    {step === 'assignment' && 'Creating assignment…'}
                    {step === 'done' && 'Wrapping up…'}
                    {step === 'idle' && 'Working…'}
                  </p>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3">
              <p className="text-[11px] text-gray-500 hidden sm:block">
                <span className="text-red-600">*</span> Title is required. Other fields are optional.
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="gradient-primary text-white liquid-button min-w-40"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-1.5" /> Create Module</>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateModuleModal;
