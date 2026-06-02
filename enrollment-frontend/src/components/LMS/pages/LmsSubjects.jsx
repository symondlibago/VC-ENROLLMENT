import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, UserPlus, X, Search, ArrowRight, Users, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { lmsSubjectsAPI, lmsAuthAPI } from '../api/lmsApi';
import AssignInstructorModal from '../modals/AssignInstructorModal';
import SuccessAlert from '../../modals/SuccessAlert';
import ValidationErrorModal from '../../modals/ValidationErrorModal';
import DeleteConfirmationModal from '../../modals/DeleteConfirmationModal';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const LmsSubjects = () => {
  const navigate = useNavigate();
  const user = lmsAuthAPI.getUser();
  const role = (user?.lms_role || user?.role || '').toLowerCase();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);

  // SMS-style feedback state
  const [successAlert, setSuccessAlert] = useState({ isVisible: false, message: '' });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
  const [unassignState, setUnassignState] = useState({
    isOpen: false, isLoading: false, subjectId: null, userId: null, instructorName: '', subjectCode: '',
  });

  const showSuccess = (message) => setSuccessAlert({ isVisible: true, message });
  const showError = (message) => setErrorModal({ isOpen: true, message });
  const resetUnassign = () => setUnassignState({ isOpen: false, isLoading: false, subjectId: null, userId: null, instructorName: '', subjectCode: '' });

  const load = () => {
    setLoading(true);
    lmsSubjectsAPI.list()
      .then((res) => setSubjects(res?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = subjects.filter((s) => {
    const q = search.toLowerCase();
    return !q ||
      s.subject_code?.toLowerCase().includes(q) ||
      s.descriptive_title?.toLowerCase().includes(q);
  });

  const handleUnassign = (subject, instructor) => {
    setUnassignState({
      isOpen: true,
      isLoading: false,
      subjectId: subject.id,
      userId: instructor.id,
      instructorName: instructor.name,
      subjectCode: subject.subject_code,
    });
  };

  const confirmUnassign = async () => {
    setUnassignState((s) => ({ ...s, isLoading: true }));
    try {
      await lmsSubjectsAPI.unassignInstructor(unassignState.subjectId, unassignState.userId);
      showSuccess(`${unassignState.instructorName} unassigned from ${unassignState.subjectCode}.`);
      resetUnassign();
      load();
    } catch (e) {
      resetUnassign();
      showError(e?.message || 'Failed to unassign instructor.');
    }
  };

  return (
    <motion.div
      className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold heading-bold">LMS Subjects</h1>
            <p className="text-sm text-gray-500">Browse the subjects available in your LMS.</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search subjects by code or title…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="text-sm text-gray-500">{filtered.length} subjects</span>
          </CardContent>
        </Card>
      </motion.div>

      {loading ? (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-center min-h-[50vh]"><LoadingSpinner size="lg" color="red" /></div>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card><CardContent className="p-8 text-sm text-gray-500 text-center">No subjects to display.</CardContent></Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.04 }}
              className="group relative"
            >
              {/* Pre-rendered hover shadow — only opacity changes, GPU-composited */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-1 rounded-2xl bg-(--dominant-red)/25 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out -z-10"
              />
              <motion.div
                whileHover={{ y: -8, scale: 1.015 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22, mass: 0.6 }}
                className="will-change-transform"
              >
              <Card
                className="h-full flex flex-col overflow-hidden border-gray-200 shadow-sm
                  transition-colors duration-300 ease-out
                  group-hover:border-(--dominant-red)/40"
              >
                {/* Gradient header */}
                <div className="relative bg-gradient-to-br from-red-800 to-red-700 p-5 text-white min-h-30 flex flex-col justify-center overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
                  <div className="absolute -bottom-12 -left-6 w-28 h-28 rounded-full bg-white/5" />
                  <div className="relative flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <Badge className="mb-2 bg-white text-red-800 font-bold hover:bg-white">
                        {s.subject_code}
                      </Badge>
                      <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
                        {s.descriptive_title}
                      </h3>
                      {(s.year || s.semester) && (
                        <p className="text-[11px] text-white/80 mt-1">
                          {s.year ? `Year ${s.year}` : ''}{s.year && s.semester ? ' · ' : ''}{s.semester ? `Semester ${s.semester}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <CardContent className="p-5 flex-grow flex flex-col justify-between bg-white">
                  <div className="space-y-3 text-sm">
                    {/* Instructors row */}
                    <div className="flex items-start">
                      <Users className="w-4 h-4 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                          Instructors
                        </p>
                        {(s.instructors || []).length === 0 ? (
                          <p className="text-xs text-gray-400 italic">None assigned</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {s.instructors.map((ins) => (
                              <span
                                key={ins.id}
                                className="inline-flex items-center text-[11px] bg-(--whitish-pink) text-(--dominant-red) border border-red-100 rounded-full px-2 py-0.5 font-medium"
                              >
                                <GraduationCap className="w-3 h-3 mr-1 opacity-70" />
                                {ins.name}
                                {role === 'admin' && (
                                  <button
                                    onClick={() => handleUnassign(s, ins)}
                                    className="ml-1 text-(--dominant-red)/50 hover:text-red-700"
                                    title="Unassign"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom action strip */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    {role === 'admin' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignTarget(s)}
                        className="text-[11px]"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" /> Assign
                      </Button>
                    ) : <span />}
                    <Button
                      size="sm"
                      className="gradient-primary text-white liquid-button"
                      onClick={() => navigate(`/lms/subjects/${s.id}`)}
                    >
                      Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {assignTarget && (
        <AssignInstructorModal
          subject={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={(instructorName) => {
            setAssignTarget(null);
            if (instructorName) showSuccess(`${instructorName} assigned successfully.`);
            else showSuccess('Instructor assigned.');
            load();
          }}
          onError={(msg) => showError(msg)}
        />
      )}

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
        isOpen={unassignState.isOpen}
        title="Unassign Instructor"
        message={`Remove this instructor from ${unassignState.subjectCode}? The instructor will lose access to this subject's LMS content.`}
        itemName={unassignState.instructorName}
        isLoading={unassignState.isLoading}
        onClose={() => !unassignState.isLoading && resetUnassign()}
        onConfirm={confirmUnassign}
      />
    </motion.div>
  );
};

export default LmsSubjects;
