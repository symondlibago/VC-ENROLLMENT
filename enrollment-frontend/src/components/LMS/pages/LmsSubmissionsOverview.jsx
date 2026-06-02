import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Inbox, ChevronRight, BookOpen, Search, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { lmsSubjectsAPI, lmsModulesAPI, lmsAuthAPI } from '../api/lmsApi';
import ModuleAssignmentsPanel from './ModuleAssignmentsPanel';
import SuccessAlert from '../../modals/SuccessAlert';
import ValidationErrorModal from '../../modals/ValidationErrorModal';
import DeleteConfirmationModal from '../../modals/DeleteConfirmationModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const LmsSubmissionsOverview = () => {
  const user = lmsAuthAPI.getUser();
  const role = (user?.lms_role || user?.role || '').toLowerCase();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [search, setSearch] = useState('');

  // SMS-style feedback state
  const [successAlert, setSuccessAlert] = useState({ isVisible: false, message: '' });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
  const [deleteState, setDeleteState] = useState({
    isOpen: false, isLoading: false, title: '', itemName: '', message: '', onConfirm: null,
  });

  const showSuccess = (message) => setSuccessAlert({ isVisible: true, message });
  const showError = (message) => setErrorModal({ isOpen: true, message });
  const resetDelete = () => setDeleteState({ isOpen: false, isLoading: false, title: '', itemName: '', message: '', onConfirm: null });

  const runConfirmDelete = async () => {
    if (typeof deleteState.onConfirm !== 'function') {
      resetDelete();
      return;
    }
    setDeleteState((s) => ({ ...s, isLoading: true }));
    try {
      await deleteState.onConfirm();
      resetDelete();
    } catch (e) {
      resetDelete();
      showError(e?.message || 'Failed to delete.');
    }
  };

  const notifications = {
    success: showSuccess,
    error: showError,
    confirmDelete: ({ title, itemName, message, onConfirm }) => {
      setDeleteState({
        isOpen: true,
        isLoading: false,
        title: title || 'Delete',
        itemName: itemName || '',
        message: message || 'This cannot be undone.',
        onConfirm,
      });
    },
  };

  useEffect(() => {
    lmsSubjectsAPI.list()
      .then((res) => setSubjects(res?.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSubject) { setModules([]); return; }
    setLoadingModules(true);
    lmsModulesAPI.listBySubject(selectedSubject.id)
      .then((res) => setModules(res?.data || []))
      .finally(() => setLoadingModules(false));
  }, [selectedSubject]);

  const filteredSubjects = subjects.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.subject_code || '').toLowerCase().includes(q) ||
           (s.descriptive_title || '').toLowerCase().includes(q);
  });

  if (role !== 'admin' && role !== 'instructor') {
    return <div className="p-6 text-sm text-gray-500">You don't have access to this view.</div>;
  }

  return (
    <motion.div
      className="p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold heading-bold">Submissions</h1>
            <p className="text-sm text-gray-500">Pick a subject to view and grade student assignments.</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject picker (sticky on desktop) */}
        <div className="lg:col-span-1 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Pick a subject</p>
                <span className="ml-auto text-[11px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                  {filteredSubjects.length}
                </span>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search subjects…"
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {loading ? (
                <p className="text-sm text-gray-500 py-4 text-center">Loading…</p>
              ) : filteredSubjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-6 px-4 text-center">
                  <BookOpen className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-500">
                    {search ? 'No subjects match your search.' : 'No subjects available.'}
                  </p>
                </div>
              ) : (
                <ul className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 -mr-1">
                  {filteredSubjects.map((s) => {
                    const active = selectedSubject?.id === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          onClick={() => setSelectedSubject(s)}
                          className={`w-full text-left py-2.5 px-3 cursor-pointer flex items-center justify-between rounded-lg transition-all border ${
                            active
                              ? 'bg-(--whitish-pink) border-(--dominant-red)/30 shadow-sm'
                              : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${active ? 'text-(--dominant-red)' : 'text-gray-900'}`}>
                              {s.subject_code}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">{s.descriptive_title}</p>
                          </div>
                          <ChevronRight className={`w-4 h-4 shrink-0 ${active ? 'text-(--dominant-red)' : 'text-gray-400'}`} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right pane */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedSubject ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center mx-auto mb-3">
                  <Inbox className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium text-gray-700">Pick a subject</p>
                <p className="text-xs text-gray-500 mt-1">
                  Select a subject on the left to view and grade its assignments.
                </p>
              </CardContent>
            </Card>
          ) : loadingModules ? (
            <Card><CardContent className="p-10 text-sm text-gray-500 text-center">Loading modules…</CardContent></Card>
          ) : modules.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium text-gray-700">No modules yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedSubject.subject_code} doesn't have any modules. Submissions appear once assignments are created.
                </p>
              </CardContent>
            </Card>
          ) : (
            modules.map((m, idx) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center font-bold text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{m.title}</h3>
                        {m.description && (
                          <p className="text-xs text-gray-500 truncate">{m.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <ModuleAssignmentsPanel
                        module={m}
                        role={role}
                        onChanged={() => {}}
                        notifications={notifications}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* SMS-style notifications */}
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
        onClose={() => !deleteState.isLoading && resetDelete()}
        onConfirm={runConfirmDelete}
      />
    </motion.div>
  );
};

export default LmsSubmissionsOverview;
