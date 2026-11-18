import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Search, Loader2, ScrollText, UserRound, GraduationCap, BookOpenCheck,
  StickyNote, ImageUp, FileDown, AlertCircle, Trash2, Save, FolderOpen, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomCalendar from '../layout/CustomCalendar';
import TorCollegiateEditor from './TorCollegiateEditor';
import {
  Field, TextField, SectionCard, AddButton, RemoveButton, MoveButtons,
  inputClass, cellInputClass, toLongDate, ROW_CONTROLS_W,
} from './torFields';
import { torReducer } from '@/lib/torReducer';
import {
  emptyTranscript, hasContent, properCaseName, withIds, PRELIMINARY_LABELS, PURPOSES,
} from '@/lib/tor';
import { downloadTranscriptDocx } from '@/lib/torDocx';
import { credentialAPI, transcriptAPI } from '@/services/api';

/**
 * Builds an Official Transcript of Records.
 *
 * A student still on file is searched for and their record pulled in; an
 * alumnus from before the system is typed in from scratch. Either way every
 * field stays editable, because the registrar is the one who knows what the
 * paper copy says.
 *
 * The photo is held in memory only — it is carried into the document and
 * forgotten when the modal closes. That includes drafts: a transcript for an
 * older student can take two days to assemble, and the form is worth keeping,
 * but a 5 MB image in a JSON column every time it is saved is not.
 */

/** The form as it is stored, without the photo or anything else volatile. */
const serialize = (tor) => JSON.stringify(tor);

const PHOTO_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg' };
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const PRELIM_LIST_ID = 'tor-prelim-labels';
const PURPOSE_LIST_ID = 'tor-purposes';

// Flex weights, written out in full so Tailwind can see them in the source.
const PRELIM_COLUMNS = [
  { key: 'label', label: 'Completed', width: 'flex-[24]', placeholder: 'ELEMENTARY EDUCATION', list: PRELIM_LIST_ID },
  { key: 'school', label: 'Name of school', width: 'flex-[31]', placeholder: 'City Central School' },
  { key: 'address', label: 'Address', width: 'flex-[24]', placeholder: 'Cagayan de Oro City' },
  { key: 'year_completed', label: 'Year completed', width: 'flex-[18]', placeholder: '2017-2018', align: 'text-center' },
];

const BIO_LAYOUT = [
  { key: 'name', label: 'Name', placeholder: 'DELA CRUZ, Juan M.', span: 'md:col-span-2' },
  { key: 'student_id_number', label: 'Student number', placeholder: '24-1808' },
  { key: 'address', label: 'Address', placeholder: 'Puntod, Cagayan de Oro City', span: 'md:col-span-2' },
  { key: 'gender', label: 'Gender', placeholder: 'Female' },
  { key: 'civil_status', label: 'Civil status', placeholder: 'Single' },
  { key: 'birth_date', label: 'Date of birth', type: 'date' },
  { key: 'birth_place', label: 'Place of birth', placeholder: 'Cagayan de Oro City, Misamis Oriental' },
  { key: 'date_of_admission', label: 'Date of admission', placeholder: 'August, 2024' },
  { key: 'admission_credential', label: 'Admission credential', placeholder: 'SF9 and Good Moral Certificate', span: 'md:col-span-2' },
];

const TorGeneratorModal = ({ isOpen, onClose, onNotify }) => {
  const [tor, dispatch] = useReducer(torReducer, undefined, emptyTranscript);
  const [mode, setMode] = useState('search'); // 'search' | 'manual'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null); // { data, ext, preview }

  // ── Drafts: the half-finished transcript waiting on a filing cabinet ──
  const [draftId, setDraftId] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [busyDraft, setBusyDraft] = useState(null);
  // What the form looked like when it was last saved or loaded. Anything
  // different from this is work that would be lost on closing.
  const savedRef = useRef(serialize(emptyTranscript()));
  const [closePrompt, setClosePrompt] = useState(false);

  const searchBox = useRef(null);
  const fileInput = useRef(null);
  // Keeps the object URL reachable from unmount cleanup, which cannot rely on
  // a state updater running.
  const photoRef = useRef(null);
  useEffect(() => { photoRef.current = photo; }, [photo]);
  useEffect(() => () => {
    if (photoRef.current?.preview) URL.revokeObjectURL(photoRef.current.preview);
  }, []);

  const clearPhoto = useCallback(() => {
    setPhoto((current) => {
      if (current?.preview) URL.revokeObjectURL(current.preview);
      return null;
    });
    if (fileInput.current) fileInput.current.value = '';
  }, []);

  const loadDrafts = useCallback(async () => {
    try {
      const res = await transcriptAPI.drafts.list();
      setDrafts(res.success ? res.data : []);
    } catch {
      // A drafts list that will not load must not stop a transcript being
      // typed — the button simply shows none.
      setDrafts([]);
    }
  }, []);

  // Start clean every time the modal opens, and let go of the photo either way.
  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'reset' });
      setMode('search');
      setQuery('');
      setResults([]);
      setShowResults(false);
      setError('');
      setDraftId(null);
      setDraftsOpen(false);
      setClosePrompt(false);
      savedRef.current = serialize(emptyTranscript());
      loadDrafts();
    }
    clearPhoto();
  }, [isOpen, clearPhoto, loadDrafts]);

  // Debounced student lookup, the same as the request form's.
  useEffect(() => {
    if (!isOpen || mode !== 'search' || query.trim().length < 2) {
      setResults([]);
      return undefined;
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
  }, [query, mode, isOpen]);

  useEffect(() => {
    const handler = (event) => {
      if (searchBox.current && !searchBox.current.contains(event.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pickStudent = async (student) => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setError('');
    setLoadingRecord(true);
    try {
      const res = await transcriptAPI.getForStudent(student.id);
      if (!res.success) throw new Error(res.message);
      const payload = res.data;
      dispatch({
        type: 'load',
        args: [{
          ...payload,
          student: { ...payload.student, name: properCaseName(payload.student.name) },
        }],
      });
    } catch (e) {
      setError(e.message || "Could not load that student's record.");
    } finally {
      setLoadingRecord(false);
    }
  };

  const setStudent = (key, value) => dispatch({ type: 'student:update', args: [{ [key]: value }] });
  const setNotes = (patch) => dispatch({ type: 'notes:update', args: [patch] });

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = PHOTO_TYPES[file.type];
    if (!ext) {
      setError('The photo has to be a PNG or JPG.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('That photo is over 5 MB — please use a smaller one.');
      event.target.value = '';
      return;
    }

    const data = new Uint8Array(await file.arrayBuffer());
    setError('');
    setPhoto((current) => {
      if (current?.preview) URL.revokeObjectURL(current.preview);
      return { data, ext, preview: URL.createObjectURL(file) };
    });
  };

  const handleGenerate = async () => {
    if (!hasContent(tor)) {
      setError("Add the student's name and at least one subject before generating.");
      return;
    }
    setGenerating(true);
    setError('');
    try {
      await downloadTranscriptDocx(tor, photo);

      // The transcript exists now, so the draft behind it has done its job.
      if (draftId) {
        try {
          await transcriptAPI.drafts.remove(draftId);
        } catch {
          // Not worth failing a finished transcript over; the registrar can
          // delete it from the list.
        }
      }

      onNotify?.('Transcript generated — check your downloads.', 'success');
      savedRef.current = serialize(tor);
      onClose();
    } catch (e) {
      setError(e.message || 'Could not build the transcript.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Drafts ──

  /** Anything typed that is not in the last saved copy. */
  const unsaved = hasContent(tor) && serialize(tor) !== savedRef.current;

  const saveDraft = async ({ thenClose = false } = {}) => {
    if (!hasContent(tor)) {
      setError("Add the student's name or a subject before saving a draft.");
      return false;
    }

    setSavingDraft(true);
    setError('');
    try {
      // An id updates the draft already open, so saving twice leaves one
      // draft rather than a trail of half-finished copies.
      const res = await transcriptAPI.drafts.save(draftId, tor);
      if (!res.success) throw new Error(res.message);

      setDraftId(res.data.id);
      savedRef.current = serialize(tor);
      await loadDrafts();
      onNotify?.(res.message || 'Draft saved.', 'success');

      if (thenClose) onClose();

      return true;
    } catch (e) {
      setError(e.message || 'Could not save the draft.');
      return false;
    } finally {
      setSavingDraft(false);
    }
  };

  const openDraft = async (draft) => {
    setBusyDraft(draft.id);
    setError('');
    try {
      const res = await transcriptAPI.drafts.get(draft.id);
      if (!res.success) throw new Error(res.message);

      dispatch({ type: 'load', args: [res.data.payload] });
      setDraftId(draft.id);
      setMode('manual');
      setDraftsOpen(false);
      // Compared against the form the reducer actually built, not the payload
      // that went in: 'load' regenerates every row id, so comparing with the
      // raw payload would read as unsaved the moment it opened.
      savedRef.current = serialize(withIds(res.data.payload));
    } catch (e) {
      setError(e.message || 'Could not open that draft.');
    } finally {
      setBusyDraft(null);
    }
  };

  const deleteDraft = async (draft) => {
    setBusyDraft(draft.id);
    try {
      const res = await transcriptAPI.drafts.remove(draft.id);
      if (!res.success) throw new Error(res.message);

      if (draftId === draft.id) setDraftId(null);
      await loadDrafts();
      onNotify?.(res.message || 'Draft deleted.', 'success');
    } catch (e) {
      setError(e.message || 'Could not delete that draft.');
    } finally {
      setBusyDraft(null);
    }
  };

  /**
   * Closing with work on screen asks first.
   *
   * This is the whole point of drafts: the transcript that could not be
   * finished today must not be thrown away by a click on the X.
   */
  const requestClose = () => {
    if (unsaved) {
      setClosePrompt(true);
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={requestClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        /* relative so the unsaved-work prompt can sit over the modal */
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-(--dominant-red) text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <ScrollText className="w-6 h-6 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold leading-tight">Transcript of Records</h2>
              <p className="text-white/80 text-sm truncate">
                {draftId
                  ? 'Working on a saved draft — save again to keep your changes.'
                  : "Pull a student's record or type an alumnus's, then generate the document."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {drafts.length > 0 && (
              <button
                onClick={() => setDraftsOpen((open) => !open)}
                className={`h-9 px-3 rounded-lg inline-flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors ${
                  draftsOpen ? 'bg-white text-(--dominant-red)' : 'hover:bg-white/15'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                Drafts ({drafts.length})
              </button>
            )}
            <button
              onClick={requestClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/15 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Saved drafts, folded away until asked for */}
        {draftsOpen && (
          <div className="shrink-0 border-b border-gray-200 bg-amber-50/60 max-h-56 overflow-y-auto" data-lenis-prevent>
            <ul className="divide-y divide-amber-100">
              {drafts.map((draft) => (
                <li key={draft.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {draft.title}
                      {draft.id === draftId && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          open
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {toLongDate(draft.updated_at) || draft.updated_at}
                      {draft.subject_count > 0 && ` · ${draft.subject_count} subject${draft.subject_count === 1 ? '' : 's'}`}
                      {draft.owner && ` · ${draft.owner}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyDraft === draft.id}
                    onClick={() => openDraft(draft)}
                    className="cursor-pointer bg-white shrink-0"
                  >
                    {busyDraft === draft.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : 'Open'}
                  </Button>
                  <button
                    type="button"
                    disabled={busyDraft === draft.id}
                    onClick={() => deleteDraft(draft)}
                    title="Delete this draft"
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Body */}
        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto bg-gray-50/60">
          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ── Student ── */}
            <SectionCard
              title="Student"
              description="Search a student on file, or switch to manual for an alumnus from before the system."
              icon={UserRound}
              action={
                <div className="shrink-0 inline-flex rounded-lg bg-gray-100 p-1">
                  {[['search', 'Search'], ['manual', 'Manual']].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMode(key)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        mode === key ? 'bg-white text-(--dominant-red) shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              }
            >
              {mode === 'search' && (
                <div ref={searchBox} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className={`${inputClass} pl-9`}
                    placeholder="Search by name or student number…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length && setShowResults(true)}
                  />
                  {(searching || loadingRecord) && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                  {showResults && results.length > 0 && (
                    <div
                      data-lenis-prevent
                      className="absolute z-20 mt-1 w-full rounded-xl border bg-white shadow-xl max-h-60 overflow-y-auto"
                    >
                      {results.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => pickStudent(student)}
                          className="w-full text-left px-4 py-2.5 hover:bg-red-50 cursor-pointer border-b last:border-0"
                        >
                          <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                          <p className="text-xs text-gray-500">
                            {student.student_id_number}
                            {student.course ? ` · ${student.course}` : ''}
                            {student.year_level ? ` · ${student.year_level}` : ''}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 pt-1">
                {/* Photo */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Photo
                  </label>
                  <div className="mt-1 aspect-square w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center relative">
                    {photo ? (
                      <>
                        <img src={photo.preview} alt="Student" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={clearPhoto}
                          title="Remove photo"
                          className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/55 text-white flex items-center justify-center hover:bg-black/75 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="flex flex-col items-center gap-2 text-gray-400 hover:text-(--dominant-red) cursor-pointer p-4"
                      >
                        <ImageUp className="w-7 h-7" />
                        <span className="text-xs font-medium text-center">Upload a photo</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handlePhoto}
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">
                    Never saved — it is only carried into the document.
                  </p>
                </div>

                {/* Bio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                  {BIO_LAYOUT.map(({ key, label, placeholder, type, span }) =>
                    (type === 'date' ? (
                      <Field key={key} label={label} className={span}>
                        <CustomCalendar
                          value={tor.student[key]}
                          onChange={(value) => setStudent(key, toLongDate(value))}
                          placeholder="Select date"
                          triggerClassName="h-10 border-2 border-gray-200"
                        />
                      </Field>
                    ) : (
                      <TextField
                        key={key}
                        label={label}
                        className={span}
                        value={tor.student[key]}
                        placeholder={placeholder}
                        onChange={(value) => setStudent(key, value)}
                      />
                    )))}
                </div>
              </div>
            </SectionCard>

            {/* ── Preliminary education ── */}
            <SectionCard
              title="Record of Preliminary Education"
              description="The schools attended before college, then the title being read for."
              icon={GraduationCap}
              action={
                <AddButton onClick={() => dispatch({ type: 'prelim:add' })} className="h-9 text-xs shrink-0">
                  Add row
                </AddButton>
              }
            >
              <datalist id={PRELIM_LIST_ID}>
                {PRELIMINARY_LABELS.map((label) => <option key={label} value={label} />)}
              </datalist>

              <div className="flex items-center gap-1.5">
                {PRELIM_COLUMNS.map(({ label, width, align }) => (
                  <span
                    key={label}
                    className={`${width} min-w-0 px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500 ${align || ''}`}
                  >
                    {label}
                  </span>
                ))}
                <span className={`${ROW_CONTROLS_W} shrink-0`} />
              </div>

              <div className="space-y-1.5">
                {tor.preliminary.map((row, index) => (
                  <div key={row.id} className="flex items-center gap-1.5">
                    {PRELIM_COLUMNS.map(({ key, width, align, placeholder, list }) => (
                      <input
                        key={key}
                        type="text"
                        list={list}
                        className={`${cellInputClass} ${width} min-w-0 ${align || ''}`}
                        placeholder={placeholder}
                        value={row[key] ?? ''}
                        onChange={(e) => dispatch({ type: 'prelim:update', args: [row.id, { [key]: e.target.value }] })}
                      />
                    ))}
                    <div className={`${ROW_CONTROLS_W} shrink-0 flex items-center justify-end`}>
                      <MoveButtons
                        label="row"
                        canMoveUp={index > 0}
                        canMoveDown={index < tor.preliminary.length - 1}
                        onMove={(step) => dispatch({ type: 'prelim:move', args: [row.id, step] })}
                      />
                      <RemoveButton
                        onClick={() => dispatch({ type: 'prelim:remove', args: [row.id] })}
                        disabled={tor.preliminary.length <= 1}
                        title="Remove row"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <TextField
                  label="Candidate for the title"
                  value={tor.student.candidate_for_title}
                  placeholder="Two-Year Program in Cruise Line Services (C.L.S)"
                  onChange={(value) => setStudent('candidate_for_title', value)}
                  hint="Defaults to the student's current course."
                />
                <TextField
                  label="Major"
                  value={tor.student.major}
                  placeholder="Major in Human Resource Development Management"
                  onChange={(value) => setStudent('major', value)}
                  hint="Optional — prints on its own line."
                />
                <Field label="Date of graduation">
                  <CustomCalendar
                    value={tor.student.date_of_graduation}
                    onChange={(value) => setStudent('date_of_graduation', toLongDate(value))}
                    placeholder="Leave blank if not yet graduated"
                    triggerClassName="h-10 border-2 border-gray-200"
                    position="above"
                  />
                </Field>
              </div>
            </SectionCard>

            {/* ── Collegiate record ── */}
            <SectionCard
              title="Collegiate Record"
              description="Credits drop to 0 on their own when a subject's grade is a failure."
              icon={BookOpenCheck}
            >
              <TorCollegiateEditor sections={tor.sections} dispatch={dispatch} />
            </SectionCard>

            {/* ── Closing lines ── */}
            <SectionCard
              title="Closing Lines"
              description="Printed under the last subject, above the grading system."
              icon={StickyNote}
            >
              <datalist id={PURPOSE_LIST_ID}>
                {PURPOSES.map((purpose) => <option key={purpose} value={purpose} />)}
              </datalist>

              <TextField
                label="Transcript closed line"
                value={tor.closing}
                onChange={(value) => setNotes({ closing: value })}
              />
              <Field label="Remarks" hint="Leave blank to omit the line entirely.">
                <textarea
                  rows={3}
                  className={`${inputClass} h-auto py-2 resize-y`}
                  placeholder="COMPLETED THE PRIMARY ACADEMIC REQUIREMENTS FOR…"
                  value={tor.remarks}
                  onChange={(e) => setNotes({ remarks: e.target.value })}
                />
              </Field>
              <TextField
                label="Purpose"
                list={PURPOSE_LIST_ID}
                value={tor.purpose}
                placeholder="FOR REFERENCE PURPOSES ONLY"
                onChange={(value) => setNotes({ purpose: value })}
              />
            </SectionCard>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400 hidden sm:block">
            {unsaved
              ? 'Unsaved changes — save a draft to finish this another day.'
              : 'Long bond (8.5 × 13). The letterhead, seal, grading system and signatories are fixed.'}
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <Button variant="outline" onClick={requestClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => saveDraft()}
              disabled={savingDraft || generating || loadingRecord}
              className="cursor-pointer bg-white hover:bg-amber-50 hover:text-amber-800 hover:border-amber-700 min-w-[130px]"
            >
              {savingDraft ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />{draftId ? 'Update draft' : 'Save draft'}</>
              )}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || loadingRecord}
              className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer min-w-[190px]"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
              ) : (
                <><FileDown className="w-4 h-4 mr-2" />Generate Transcript</>
              )}
            </Button>
          </div>
        </div>

        {/* The guard that makes drafts worth having: closing with work on
            screen offers to keep it rather than binning it. */}
        {closePrompt && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setClosePrompt(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-full shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Keep this transcript?</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    You have typed work that has not been saved. Save it as a draft and you
                    can pick it up tomorrow, exactly as it is now.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    The photo is not kept with a draft — attach it again before generating.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => { setClosePrompt(false); onClose(); }}
                  className="cursor-pointer bg-white hover:bg-red-50 hover:text-red-800 hover:border-red-800"
                >
                  Discard
                </Button>
                <Button
                  onClick={async () => {
                    const saved = await saveDraft({ thenClose: true });
                    if (!saved) setClosePrompt(false);
                  }}
                  disabled={savingDraft}
                  className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer min-w-[140px]"
                >
                  {savingDraft ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Save draft</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TorGeneratorModal;
