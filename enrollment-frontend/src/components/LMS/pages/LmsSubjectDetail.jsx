import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, FileText, Trash2, Download, Upload, ChevronLeft, BookOpen,
  Layers, Users, ChevronDown, ClipboardList, Pencil, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { lmsSubjectsAPI, lmsModulesAPI, lmsAuthAPI } from '../api/lmsApi';
import ModuleAssignmentsPanel from './ModuleAssignmentsPanel';
import SubjectAnnouncementsPanel from './SubjectAnnouncementsPanel';
import CreateModuleModal from '../modals/CreateModuleModal';
import EditModuleModal from '../modals/EditModuleModal';
import MotionDropdown from '../ui/MotionDropdown';
import SuccessAlert from '../../modals/SuccessAlert';
import ValidationErrorModal from '../../modals/ValidationErrorModal';
import DeleteConfirmationModal from '../../modals/DeleteConfirmationModal';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

const formatBytes = (b) => {
  if (!b && b !== 0) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const LmsSubjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = lmsAuthAPI.getUser();
  const role = (user?.lms_role || user?.role || '').toLowerCase();
  const canManage = role === 'admin' || role === 'instructor';

  const [subject, setSubject] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Section filtering + collapsible row state
  const [sections, setSections] = useState([]);
  const [sectionFilter, setSectionFilter] = useState(''); // '' = all
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpanded = (mid) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(mid)) next.delete(mid); else next.add(mid);
      return next;
    });
  };

  // Unified SMS-style feedback state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // module being edited
  const [successAlert, setSuccessAlert] = useState({ isVisible: false, message: '' });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
  const [deleteState, setDeleteState] = useState({
    isOpen: false,
    isLoading: false,
    kind: null,          // 'module' | 'file'
    id: null,
    title: '',
    itemName: '',
    message: '',
  });

  const showSuccess = (message) => setSuccessAlert({ isVisible: true, message });
  const showError = (message) => setErrorModal({ isOpen: true, message });

  const load = () => {
    setLoading(true);
    const moduleParams = sectionFilter ? { section_id: sectionFilter } : {};
    Promise.all([
      lmsSubjectsAPI.get(id),
      lmsModulesAPI.listBySubject(id, moduleParams),
    ]).then(([sub, mods]) => {
      setSubject(sub?.data || null);
      setModules(mods?.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id, sectionFilter]);

  // Load sections relevant to this user for this subject (used by the filter dropdown)
  useEffect(() => {
    lmsSubjectsAPI.sections(id)
      .then((res) => setSections(res?.data || []))
      .catch(() => setSections([]));
  }, [id]);

  const requestDeleteModule = (m) => {
    setDeleteState({
      isOpen: true,
      isLoading: false,
      kind: 'module',
      id: m.id,
      title: 'Delete module',
      itemName: m.title,
      message: 'Deleting this module will also remove all its files and assignments. This cannot be undone.',
    });
  };

  const requestDeleteFile = (f) => {
    setDeleteState({
      isOpen: true,
      isLoading: false,
      kind: 'file',
      id: f.id,
      title: 'Delete file',
      itemName: f.original_name,
      message: 'This file will be permanently removed from storage.',
    });
  };

  const resetDeleteState = () =>
    setDeleteState({ isOpen: false, isLoading: false, kind: null, id: null, title: '', itemName: '', message: '', onConfirm: null });

  const confirmDelete = async () => {
    setDeleteState((s) => ({ ...s, isLoading: true }));
    try {
      if (deleteState.kind === 'module') {
        await lmsModulesAPI.remove(deleteState.id);
        showSuccess('Module deleted.');
        resetDeleteState();
        load();
      } else if (deleteState.kind === 'file') {
        await lmsModulesAPI.deleteFile(deleteState.id);
        showSuccess('File deleted.');
        resetDeleteState();
        load();
      } else if (deleteState.kind === 'custom' && typeof deleteState.onConfirm === 'function') {
        await deleteState.onConfirm();
        resetDeleteState();
      } else {
        resetDeleteState();
      }
    } catch (e) {
      resetDeleteState();
      showError(e?.message || 'Failed to delete.');
    }
  };

  const handleUpload = async (moduleId, file) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      showError('Only PDF and DOCX files are allowed.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      showError('File exceeds the 20 MB limit.');
      return;
    }
    try {
      await lmsModulesAPI.uploadFile(moduleId, file);
      showSuccess('File uploaded.');
      load();
    } catch (e) {
      showError(e?.message || 'Failed to upload file.');
    }
  };

  const handleDownload = async (file) => {
    try {
      await lmsModulesAPI.downloadFile(file.id, file.original_name);
    } catch {
      showError('Failed to download the file.');
    }
  };

  const handleModuleCreated = ({ title, uploadedFile, createdAssignment }) => {
    setShowCreateModal(false);
    const parts = [`"${title}" created`];
    if (uploadedFile) parts.push('file uploaded');
    if (createdAssignment) parts.push('assignment added');
    showSuccess(parts.join(' · ') + '.');
    load();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" color="red" /></div>;
  if (!subject) return <div className="p-6 text-sm text-gray-500">Subject not found.</div>;

  return (
    <motion.div
      className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.button
        variants={itemVariants}
        onClick={() => navigate('/lms/subjects')}
        className="flex items-center text-sm text-(--dominant-red) hover:underline cursor-pointer"
        whileHover={{ x: -3 }}
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to subjects
      </motion.button>

      {/* Subject hero banner */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl gradient-primary text-white shadow-lg">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-white/75 font-semibold">
                  Subject {subject.subject_code}
                </p>
                <h2 className="text-xl md:text-2xl font-bold leading-tight truncate">
                  {subject.descriptive_title}
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Year {subject.year} · Semester {subject.semester}
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 min-w-[200px]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/80 font-semibold mb-1">
                <Users className="w-3 h-3" /> Instructors
              </div>
              <p className="text-sm font-medium leading-tight">
                {(subject.instructors || []).length === 0
                  ? <span className="text-white/70">No instructors assigned</span>
                  : subject.instructors.map((i) => i.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Announcements feed */}
      <motion.div variants={itemVariants}>
        <SubjectAnnouncementsPanel
          subjectId={id}
          canManage={canManage}
          notifications={{
            success: showSuccess,
            error: showError,
            confirmDelete: ({ title, itemName, message, onConfirm }) => {
              setDeleteState({
                isOpen: true,
                isLoading: false,
                kind: 'custom',
                id: null,
                title: title || 'Delete',
                itemName: itemName || '',
                message: message || 'This cannot be undone.',
                onConfirm,
              });
            },
          }}
        />
      </motion.div>

      {/* Modules section header + Section filter + Create button */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 pt-2">
        <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center">
          <Layers className="w-4 h-4" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Modules</h3>
        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
          {modules.length}
        </span>

        {/* Section filter — visible to admin/instructor */}
        {canManage && (
          <div className="ml-2 w-56">
            <MotionDropdown
              value={sectionFilter}
              onChange={(v) => setSectionFilter(v)}
              options={[
                { value: '', label: 'All sections' },
                ...sections.map((s) => ({ value: String(s.id), label: s.name })),
              ]}
              placeholder="All sections"
              icon={Users}
            />
          </div>
        )}

        {canManage && (
          <Button
            className="ml-auto gradient-primary text-white liquid-button"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create Module
          </Button>
        )}
      </motion.div>

      {modules.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center mx-auto mb-3">
                <Layers className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-gray-700">No modules yet.</p>
              <p className="text-xs text-gray-500 mt-1">
                {canManage
                  ? 'Click "Create Module" above to add your first one.'
                  : 'Check back later — your instructor will publish modules here.'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-2">
          {modules.map((m, idx) => {
            const isExpanded = expandedIds.has(m.id);
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.03 }}
              >
                <Card className={`overflow-hidden border-gray-200 transition-colors ${isExpanded ? 'border-(--dominant-red)/30 shadow-sm' : 'hover:border-(--dominant-red)/30'}`}>
                  <CardContent className="p-0">
                    {/* Collapsible row header — title + chevron, single row */}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(m.id)}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${isExpanded ? 'bg-(--whitish-pink)/40' : 'hover:bg-gray-50'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center font-bold text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1 flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{m.title}</h4>
                        {m.section?.name ? (
                          <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide bg-(--whitish-pink) text-(--dominant-red) rounded-full px-1.5 py-0.5">
                            <Users className="w-2.5 h-2.5 mr-1" /> {m.section.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">
                            All sections
                          </span>
                        )}
                        <span className="inline-flex items-center text-[10px] text-gray-400 gap-1">
                          <FileText className="w-3 h-3" /> {(m.files || []).length}
                        </span>
                        <span className="inline-flex items-center text-[10px] text-gray-400 gap-1">
                          <ClipboardList className="w-3 h-3" /> {(m.assignments || []).length}
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        className="text-gray-400 shrink-0"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>

                    {/* Expanded body */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                          className="overflow-hidden border-t border-gray-100 bg-gray-50/60"
                        >
                          {/* Description + manage actions */}
                          <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              {m.description ? (
                                <p className="text-sm text-gray-700 leading-relaxed">{m.description}</p>
                              ) : (
                                <p className="text-xs text-gray-400 italic">No description provided.</p>
                              )}
                            </div>
                            {canManage && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  className="inline-flex items-center text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-(--dominant-red)/40 hover:text-(--dominant-red) px-3 py-2 rounded-lg transition"
                                  onClick={() => setEditTarget(m)}
                                  title="Edit module details"
                                >
                                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                                </button>
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    className="hidden"
                                    onChange={(e) => handleUpload(m.id, e.target.files?.[0])}
                                  />
                                  <span className="inline-flex items-center text-xs font-medium gradient-primary text-white px-3 py-2 rounded-lg hover:opacity-90 transition liquid-button">
                                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload file
                                  </span>
                                </label>
                                <button
                                  className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition border border-transparent hover:border-red-200"
                                  onClick={() => requestDeleteModule(m)}
                                  title="Delete module"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Stat strip */}
                          <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Section</p>
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                  {m.section?.name || 'All sections'}
                                </p>
                              </div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Files</p>
                                <p className="text-xs font-semibold text-gray-900">{(m.files || []).length}</p>
                              </div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center shrink-0">
                                <ClipboardList className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Assignments</p>
                                <p className="text-xs font-semibold text-gray-900">{(m.assignments || []).length}</p>
                              </div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Created by</p>
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                  {m.creator?.name || '—'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Files & assignments body */}
                          <div className="bg-white border-t border-gray-100 px-5 py-5 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-(--dominant-red)" />
                      <p className="text-sm font-semibold text-gray-800">Files</p>
                      <span className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                        {(m.files || []).length}
                      </span>
                    </div>

                    {(m.files || []).length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 py-6 px-4 text-center">
                        <FileText className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500">No files attached yet.</p>
                        {canManage && (
                          <p className="text-[11px] text-gray-400 mt-0.5">Use "Upload file" to add a PDF or DOCX.</p>
                        )}
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {m.files.map((f) => (
                          <li
                            key={f.id}
                            className="flex items-center justify-between text-sm bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-(--dominant-red)/40 hover:shadow-sm transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{f.original_name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                                    {f.extension}
                                  </span>
                                  <span className="text-[11px] text-gray-500">{formatBytes(f.size_bytes)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                className="p-2 text-gray-600 hover:text-(--dominant-red) hover:bg-(--whitish-pink) rounded-lg transition"
                                onClick={() => handleDownload(f)}
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {canManage && (
                                <button
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  onClick={() => requestDeleteFile(f)}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                            {/* Assignments */}
                            <ModuleAssignmentsPanel
                              module={m}
                              role={role}
                              onChanged={load}
                              notifications={{
                                success: showSuccess,
                                error: showError,
                                confirmDelete: ({ title, itemName, message, onConfirm }) => {
                                  setDeleteState({
                                    isOpen: true,
                                    isLoading: false,
                                    kind: 'custom',
                                    id: null,
                                    title: title || 'Delete',
                                    itemName: itemName || '',
                                    message: message || 'This cannot be undone.',
                                    onConfirm,
                                  });
                                },
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Modals (SMS-style) */}
      <CreateModuleModal
        isOpen={showCreateModal}
        subjectId={id}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModuleCreated}
        onValidationError={(message) => showError(message)}
      />
      <EditModuleModal
        isOpen={!!editTarget}
        module={editTarget}
        subjectId={id}
        onClose={() => setEditTarget(null)}
        onSuccess={({ title }) => {
          setEditTarget(null);
          showSuccess(`"${title}" updated.`);
          load();
        }}
        onValidationError={(message) => showError(message)}
      />
      <SuccessAlert
        isVisible={successAlert.isVisible}
        message={successAlert.message}
        onClose={() => setSuccessAlert({ isVisible: false, message: '' })}
      />
      <ValidationErrorModal
        isOpen={errorModal.isOpen}
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
      />
      <DeleteConfirmationModal
        isOpen={deleteState.isOpen}
        title={deleteState.title}
        message={deleteState.message}
        itemName={deleteState.itemName}
        isLoading={deleteState.isLoading}
        onClose={() => !deleteState.isLoading && resetDeleteState()}
        onConfirm={confirmDelete}
      />
    </motion.div>
  );
};

export default LmsSubjectDetail;
