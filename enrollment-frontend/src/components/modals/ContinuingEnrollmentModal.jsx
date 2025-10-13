import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  User,
  ChevronDown,
  BookOpen,
  ArrowRight,
  Save,
  Loader2,
  GraduationCap,
  Calendar,
  RotateCcw,
  AlertCircle,
  Lock
} from 'lucide-react';
import { enrollmentAPI, subjectAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ValidationErrorModal from '../modals/ValidationErrorModal';

// #region Helper Components

const MotionDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = useMemo(
    () => options.find(opt => opt.value === value) || { label: placeholder, value: '' },
    [value, options, placeholder]
  );

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 text-left bg-white border border-gray-200 rounded-xl focus:border-red-800 focus:ring-2 focus:ring-red-800/20 flex items-center justify-between"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-gray-900 font-medium">{selectedOption.label}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto"
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ backgroundColor: '#fef2f2', x: 4 }}
              >
                <span className="text-gray-900">{option.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// #endregion

const ContinuingEnrollmentModal = ({ isOpen, onClose, showAlert }) => {
  // ## STATE MANAGEMENT ##
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [academicInfo, setAcademicInfo] = useState({
    school_year: '2025-2026',
    semester: '1st Semester',
    year: '1st Year',
  });
  const [availableSubjects, setAvailableSubjects] = useState({});
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [droppedSubjects, setDroppedSubjects] = useState([]);
  const [failedSubjects, setFailedSubjects] = useState([]);
  const [passedSubjectIds, setPassedSubjectIds] = useState(new Set());
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSemesterFilter, setCurrentSemesterFilter] = useState('1st Semester');
  const [subjectError, setSubjectError] = useState(null);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // ## STATIC OPTIONS ##
  const schoolYearOptions = [
  { label: '2025-2026', value: '2025-2026' },
  { label: '2026-2027', value: '2026-2027' }];

  const semesterOptions = [
    { label: '1st Semester', value: '1st Semester' }, 
    { label: '2nd Semester', value: '2nd Semester' }];
    
  const yearLevelOptions = [
    { label: '1st Year', value: '1st Year' }, 
    { label: '2nd Year', value: '2nd Year' }, 
    { label: '3rd Year', value: '3rd Year' }, 
    { label: '4th Year', value: '4th Year' },    
    { label: '1st Year Summer', value: '1st Year Summer' },
    { label: '2nd Year Summer', value: '2nd Year Summer' }];

  // ## DATA FETCHING & SIDE EFFECTS ##
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await enrollmentAPI.searchEnrolledStudents(searchTerm);
        if (res.success) {
          setSearchResults(res.data);
        }
      } catch (error) {
        showAlert("Failed to search students.", "error");
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, showAlert]);

  // ## HANDLER FUNCTIONS ##
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setCurrentStep(2);
  };

  const handleGoToSubjectSetup = async () => {
    setIsLoadingEligibility(true);
    try {
      const eligibilityRes = await enrollmentAPI.checkEnrollmentEligibility(selectedStudent.id);
      if (eligibilityRes.success && eligibilityRes.eligible) {
        setPassedSubjectIds(new Set(eligibilityRes.passed_subject_ids || []));
        setDroppedSubjects(eligibilityRes.retakeable_subjects?.dropped || []);
        setFailedSubjects(eligibilityRes.retakeable_subjects?.failed || []);
        setIsLoadingSubjects(true);

        const studentDetails = await enrollmentAPI.getStudentDetails(selectedStudent.id);
        if (!studentDetails.success) {
          throw new Error("Could not fetch student's course.");
        }

        const courseId = studentDetails.data.student.course_id;
        const res = await subjectAPI.getByCourse(courseId, academicInfo.year, academicInfo.semester);

        if (res.success) {
          const subjectsBySem = res.data.reduce((acc, subject) => {
            const sem = subject.semester;
            if (!acc[sem]) {
              acc[sem] = [];
            }
            acc[sem].push(subject);
            return acc;
          }, {});
          setAvailableSubjects(subjectsBySem);
          if (Object.keys(subjectsBySem).length > 0) {
            setCurrentSemesterFilter(Object.keys(subjectsBySem)[0]);
          }
          setCurrentStep(3);
        } else {
          showAlert(res.message || "Could not load subjects.", "error");
        }
      } else if (eligibilityRes.success && !eligibilityRes.eligible) {
        const ungradedList = eligibilityRes.ungraded_subjects.map(s => `- ${s.subject_code}: ${s.descriptive_title}`).join('\n');
        const errorMessage = (
          <div>
            <p className="mb-2">This student cannot proceed. All subjects from the previous term must have a final grade.</p>
            <pre className="bg-gray-100 p-2 rounded text-sm text-left whitespace-pre-wrap">{ungradedList}</pre>
          </div>
        );
        setValidationMessage(errorMessage);
        setIsValidationModalOpen(true);
      }
    } catch (error) {
      showAlert(error.message || "An error occurred.", "error");
    } finally {
      setIsLoadingSubjects(false);
      setIsLoadingEligibility(false);
    }
  };

  const handleAddSubject = (subject) => {
    if (!selectedSubjects.some(s => s.id === subject.id)) {
      setSelectedSubjects(prev => [...prev, subject]);
    }
  };

  const handleAddAllSubjects = () => {
    if (isLoadingSubjects || displayableSubjects.length === 0) return;
    const newSubjects = displayableSubjects.filter(subject => {
      const isAlreadyAdded = selectedSubjects.some(s => s.id === subject.id);
      const prerequisiteNotMet = subject.prerequisite && subject.prerequisite.id && !passedSubjectIds.has(subject.prerequisite.id);
      return !isAlreadyAdded && !prerequisiteNotMet;
    });
    setSelectedSubjects(prev => [...prev, ...newSubjects]);
  };

  const handleRemoveSubject = (subjectId) => {
    setSelectedSubjects(prev => prev.filter(s => s.id !== subjectId));
  };

  const getTotalUnits = () => selectedSubjects.reduce((total, subject) => total + (subject.total_units || 0), 0);

  const handleSubmitEnrollment = async () => {
    if (selectedSubjects.length === 0) {
      setValidationMessage("Please select at least one subject before submitting.");
      setIsValidationModalOpen(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        original_student_id: selectedStudent.id,
        ...academicInfo,
        selected_subjects: selectedSubjects.map(s => s.id),
      };
      const res = await enrollmentAPI.submitContinuingEnrollment(payload);
      if (res.success) {
        showAlert(res.message, 'success');
        handleClose();
      } else {
        showAlert(res.message || "Submission failed.", 'error');
      }
    } catch (error) {
      showAlert(error.message || "An error occurred during submission.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedStudent(null);
    setSelectedSubjects([]);
    setAvailableSubjects({});
    setDroppedSubjects([]);
    setFailedSubjects([]);
    setPassedSubjectIds(new Set());
    onClose();
  };

  // ## MEMOIZED LOGIC ##
  const displayableSubjects = useMemo(() => {
    const regularSubjects = availableSubjects[currentSemesterFilter] || [];
    const availableDropped = droppedSubjects.filter(sub => sub.semester === academicInfo.semester);
    const availableFailed = failedSubjects.filter(sub => sub.semester === academicInfo.semester);

    const subjectMap = new Map();
    regularSubjects.forEach(sub => subjectMap.set(sub.id, { ...sub, isDropped: false, isFailed: false }));
    availableDropped.forEach(sub => subjectMap.set(sub.id, { ...subjectMap.get(sub.id), ...sub, isDropped: true }));
    availableFailed.forEach(sub => subjectMap.set(sub.id, { ...subjectMap.get(sub.id), ...sub, isFailed: true }));

    return Array.from(subjectMap.values());
  }, [availableSubjects, currentSemesterFilter, droppedSubjects, failedSubjects, academicInfo.semester]);

  if (!isOpen) {
    return null;
  }

  // ## MAIN RENDER ##
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <ValidationErrorModal isOpen={isValidationModalOpen} onClose={() => setIsValidationModalOpen(false)} message={validationMessage} />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[100vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b bg-red-800 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Continuing Student Enrollment</h2>
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white hover:text-red-800 cursor-pointer">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 bg-gray-50 flex-grow overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto ">
                <div className="text-center mb-6">
                  <h3 className="font-bold text-2xl text-gray-800">Step 1: Find Student</h3>
                  <p className="text-gray-600 mt-1">Search for an enrolled student by name or ID number.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Search for Student Name or Student ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-6 text-base rounded-xl border-gray-300 focus:border-red-800"
                  />
                </div>
                <div className="mt-4 max-h-72 overflow-y-auto space-y-3">
                  {isSearching && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-red-800" /></div>}
                  {searchResults.map(student => (
                    <motion.div
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="flex items-start p-4 bg-white hover:bg-red-50 rounded-xl cursor-pointer border shadow-sm transition-colors duration-200"
                      whileHover={{ y: -2 }}
                    >
                      <div className="p-3 bg-red-800 rounded-full mr-4 mt-1">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900">{student.last_name}, {student.first_name}</p>
                          <p className="text-xs font-mono bg-red-800 text-white px-2 py-1 rounded-md">{student.student_id_number}</p>
                        </div>
                        <div className="my-2 border-t border-gray-100"></div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center" title="Course"><GraduationCap className="w-4 h-4 mr-1.5 text-gray-400" /><span>{student.course?.course_name || 'N/A'}</span></div>
                          <div className="flex items-center" title="Year Level"><Calendar className="w-4 h-4 mr-1.5 text-gray-400" /><span>{student.year}</span></div>
                          <div className="flex items-center" title="Semester"><BookOpen className="w-4 h-4 mr-1.5 text-gray-400" /><span>{student.semester}</span></div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="font-bold text-2xl text-gray-800">Step 2: Set New Academic Term</h3>
                  <p className="text-gray-600 mt-1">
                    For student: <span className="font-bold text-red-800">{selectedStudent?.first_name} {selectedStudent?.last_name}</span>.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><label className="font-bold text-gray-700 text-sm mb-2 flex items-center"><Calendar className="w-4 h-4 mr-2" />School Year</label><MotionDropdown value={academicInfo.school_year} onChange={v => setAcademicInfo(p => ({ ...p, school_year: v }))} options={schoolYearOptions} placeholder="Select School Year" /></div>
                    <div><label className="font-bold text-gray-700 text-sm mb-2 flex items-center"><GraduationCap className="w-4 h-4 mr-2" />Year Level</label><MotionDropdown value={academicInfo.year} onChange={v => setAcademicInfo(p => ({ ...p, year: v }))} options={yearLevelOptions} placeholder="Select Year Level" /></div>
                    <div><label className="font-bold text-gray-700 text-sm mb-2 flex items-center"><BookOpen className="w-4 h-4 mr-2" />Semester</label><MotionDropdown value={academicInfo.semester} onChange={v => setAcademicInfo(p => ({ ...p, semester: v }))} options={semesterOptions} placeholder="Select Semester" /></div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-6">
                  <h3 className="font-bold text-2xl text-gray-800">Step 3: Subject Setup</h3>
                  <p className="text-gray-600 mt-1">Select subjects for {academicInfo.semester}, S.Y. {academicInfo.school_year}.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: '60vh' }}>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Available Subjects</h3>
                      <Button size="sm" onClick={handleAddAllSubjects} disabled={isLoadingSubjects || displayableSubjects.length === 0}><BookOpen className="w-4 h-4 mr-2" /> Add All</Button>
                    </div>
                    <div className="mb-4 flex space-x-2 flex-wrap">
                      {Object.keys(availableSubjects).map(sem => (<button key={sem} onClick={() => setCurrentSemesterFilter(sem)} className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all duration-300 mb-2 ${currentSemesterFilter === sem ? 'bg-red-800 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>{sem}</button>))}
                    </div>
                    <div className="space-y-3 overflow-y-auto flex-grow pr-2">
                      {isLoadingSubjects ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-red-800 w-8 h-8" /></div>
                        : displayableSubjects.length === 0 ? <div className="text-center text-gray-500 pt-16"><BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>No subjects found for this term.</p></div>
                          : displayableSubjects.map(sub => {
                            const isAlreadyAdded = selectedSubjects.some(s => s.id === sub.id);
                            const prerequisiteNotMet = sub.prerequisite && sub.prerequisite.id && !passedSubjectIds.has(sub.prerequisite.id);
                            const isAddable = !isAlreadyAdded && !prerequisiteNotMet;

                            return (
                              <motion.div key={sub.id} className="bg-white rounded-xl p-3 shadow-sm border" whileHover={{ y: -2 }}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    {sub.isFailed ? (
                                      <Badge variant="destructive" className="mb-2 bg-red-100 text-red-800 border-red-200"><AlertCircle className="w-3 h-3 mr-1.5" />Failed - Retake</Badge>
                                    ) : sub.isDropped && (
                                      <Badge variant="outline" className="mb-2 text-yellow-800 border-yellow-300 bg-yellow-50 font-medium"><RotateCcw className="w-3 h-3 mr-1.5" />Previously Dropped</Badge>
                                    )}
                                    {prerequisiteNotMet && (
                                      <Badge variant="outline" className="mb-2 text-orange-800 border-orange-300 bg-orange-50 font-medium"><Lock className="w-3 h-3 mr-1.5" />Requires {sub.prerequisite.subject_code}</Badge>
                                    )}
                                    <div className="flex items-center mb-1.5">
                                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold mr-2">{sub.subject_code}</span>
                                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">{sub.total_units} units</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-800 text-sm">{sub.descriptive_title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">Prerequisite: {sub.prerequisite ? sub.prerequisite.subject_code : 'None'}</p>
                                  </div>
                                  <div title={!isAddable ? `Prerequisite ${sub.prerequisite?.subject_code} not passed` : 'Add this subject'}>
                                    <Button size="sm" onClick={() => handleAddSubject(sub)} disabled={!isAddable} className="ml-2 mt-1 shrink-0">
                                      {isAlreadyAdded ? 'Added' : 'Add'}
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Selected Subjects</h3>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-bold">Total: {getTotalUnits()} units</div>
                    </div>
                    <div className="space-y-3 overflow-y-auto flex-grow pr-2">
                      {selectedSubjects.length > 0 ? selectedSubjects.map(sub => (
                        <motion.div key={sub.id} className="bg-white rounded-xl p-3 shadow-sm border" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-1.5">
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold mr-2">{sub.subject_code}</span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">{sub.total_units} units</span>
                              </div>
                              <h4 className="font-semibold text-gray-800 text-sm">{sub.descriptive_title}</h4>
                            </div>
                            <Button size="sm" variant="destructive" onClick={() => handleRemoveSubject(sub.id)}>Remove</Button>
                          </div>
                        </motion.div>
                      )) : <div className="text-center text-gray-500 pt-16"><BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>Add subjects from the left panel.</p></div>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-white rounded-b-2xl">
          <Button variant="outline" onClick={() => currentStep > 1 ? setCurrentStep(p => p - 1) : handleClose()} className="cursor-pointer">
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          {currentStep === 2 && (
            <Button onClick={handleGoToSubjectSetup} disabled={isLoadingSubjects || isLoadingEligibility} className="bg-red-800 hover:bg-red-700 text-white cursor-pointer">
              {(isLoadingSubjects || isLoadingEligibility) ? <Loader2 className="animate-spin mr-2" /> : <ArrowRight className="mr-2 h-4 w-4" />} Next: Subject Setup
            </Button>
          )}
          {currentStep === 3 && (
            <Button onClick={handleSubmitEnrollment} disabled={isSubmitting || selectedSubjects.length === 0} className="bg-red-800 hover:bg-red-700 text-white cursor-pointer">
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Submit Enrollment
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ContinuingEnrollmentModal;