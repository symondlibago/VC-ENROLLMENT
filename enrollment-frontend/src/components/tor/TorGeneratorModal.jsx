import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Search, Loader2, ScrollText, UserRound, GraduationCap, BookOpenCheck,
  StickyNote, ImageUp, FileDown, AlertCircle, Trash2,
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
  emptyTranscript, hasContent, properCaseName, PRELIMINARY_LABELS, PURPOSES,
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
 * forgotten when the modal closes.
 */

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

  // Start clean every time the modal opens, and let go of the photo either way.
  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'reset' });
      setMode('search');
      setQuery('');
      setResults([]);
      setShowResults(false);
      setError('');
    }
    clearPhoto();
  }, [isOpen, clearPhoto]);

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
      onNotify?.('Transcript generated — check your downloads.', 'success');
      onClose();
    } catch (e) {
      setError(e.message || 'Could not build the transcript.');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-(--dominant-red) text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <ScrollText className="w-6 h-6 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold leading-tight">Transcript of Records</h2>
              <p className="text-white/80 text-sm truncate">
                Pull a student's record or type an alumnus's, then generate the document.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/15 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
            Long bond (8.5 × 13). The letterhead, seal, grading system and signatories are fixed.
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <Button variant="outline" onClick={onClose} className="cursor-pointer">
              Cancel
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
      </motion.div>
    </div>
  );
};

export default TorGeneratorModal;
