import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ✅ ADDED subjectAPI
import { studentAPI, enrollmentAPI, managementAPI, subjectAPI } from '@/services/api'; 
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  GraduationCap,
  Calendar,
  Loader2,
  ArrowRight,
  ClipboardList,
  BookOpen,
  RotateCcw,
  Lock,
  Save,
  ChevronLeft,
  ChevronDown,
  TriangleAlert, // ✅ ADDED
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// New Imports
import SuccessAlert from '../modals/SuccessAlert'; 
import ValidationErrorModal from '../modals/ValidationErrorModal';

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

// ✅ NEW: Inline Warning Modal Component
const IrregularWarningModal = ({ isOpen, onClose, onConfirm, subjects }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-4"
      >
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <TriangleAlert className="h-8 w-8 text-red-700" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Irregular Status Warning</h3>
          <p className="text-gray-600 mt-2">
            You have untaken summer subjects. Proceeding will mark you as <span className="font-bold text-red-700">Irregular</span>.
          </p>
          <div className="mt-4 w-full bg-gray-50 border rounded-lg p-3 text-left">
            <p className="text-sm font-semibold mb-2">Untaken Subjects:</p>
            <ul className="text-sm text-gray-700 space-y-1">
              {subjects.map(sub => (
                <li key={sub.id} className="font-mono text-xs">
                  <span className="font-semibold">{sub.subject_code}</span>: {sub.descriptive_title} ({sub.year})
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-center space-x-4 mt-6 w-full">
            <Button variant="outline" onClick={onClose} className="w-20 cursor-pointer">Cancel</Button>
            <Button onClick={onConfirm} className="w-40 bg-red-800 hover:bg-red-600 text-white cursor-pointer">Continue Anyway</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


// ✅ HELPER: Function to get period status
const getPeriodStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return { status: 'Not Set', message: 'Enrollment schedule is not yet posted. Please contact the Registrar.' };
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end day

    const options = { month: 'long', day: 'numeric', year: 'numeric' };

    if (now < start) return { status: 'Upcoming', message: `Enrollment opens on ${start.toLocaleDateString(undefined, options)}. Please check back on that date.` };
    if (now > end) return { status: 'Closed', message: 'The enrollment period has ended. Please contact the Registrar.' };
    return { status: 'Open', message: 'The enrollment period is open.' };
};

const StudentEnrollmentEligibility = () => {
    // --- STEP STATE ---
    const [currentStep, setCurrentStep] = useState(1);

    // --- ELIGIBILITY & STATUS STATE ---
    const [eligibility, setEligibility] = useState({
        academic_status: 'Loading',
        message: '',
        next_term: { year: 'N/A', semester: 'N/A', schoolYear: 'N/A' },
        ungraded_subjects: [],
        retakeable_subjects: { failed: [], dropped: [] },
        student_id: null,
        course_id: null, 
        program_code: 'Bachelor', 
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- ENROLLMENT DATA STATE (for Steps 2 & 3) ---
    const [academicInfo, setAcademicInfo] = useState({
        school_year: 'N/A',
        semester: 'N/A',
        year: 'N/A',
    });
    const [availableSubjects, setAvailableSubjects] = useState({});
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [passedSubjectIds, setPassedSubjectIds] = useState(new Set());
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
    const [currentSemesterFilter, setCurrentSemesterFilter] = useState('1st Semester');
    
    const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false); 
    const [validationMessage, setValidationMessage] = useState('');

    // ✅ NEW STATE for Irregular Warning
    const [eligibilityData, setEligibilityData] = useState(null); 
    const [showIrregularWarning, setShowIrregularWarning] = useState(false);
    const [untakenSummerSubjects, setUntakenSummerSubjects] = useState([]);

    const [enrollmentPeriod, setEnrollmentPeriod] = useState({ 
        status: 'Loading', 
        message: 'Loading enrollment schedule...' 
    });

    // --- STATIC OPTIONS ---
    const schoolYearOptions = [
        { label: '2025-2026', value: '2025-2026' },
        { label: '2026-2027', value: '2026-2027' }
    ];
    const semesterOptions = [
        { label: '1st Semester', value: '1st Semester' },
        { label: '2nd Semester', value: '2nd Semester' }
    ];
    const yearLevelOptions = [
        { label: '1st Year', value: '1st Year' },
        { label: '2nd Year', value: '2nd Year' },
        { label: '3rd Year', value: '3rd Year' },
        { label: '4th Year', value: '4th Year' },
        { label: '1st Year Summer', value: '1st Year Summer' },
        { label: '2nd Year Summer', value: '2nd Year Summer' },
    ];
    
    // ## DATA FETCHING & SIDE EFFECTS (Step 1) ##
    useEffect(() => {
        const fetchEligibility = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await studentAPI.checkMyEnrollmentEligibility(); 
                
                if (response.success && response.status_data) {
                    const data = response.status_data;
                    setEligibility(data);
                    setAcademicInfo({
                        year: data.next_term.year,
                        semester: data.next_term.semester,
                        school_year: data.next_term.schoolYear,
                    });
                } else {
                    setError(response.message || 'Failed to check eligibility status.');
                }

                try {
                    const periodResponse = await managementAPI.getGradingPeriods();
                    if (periodResponse.success && periodResponse.data.enrollment) {
                        const { start_date, end_date } = periodResponse.data.enrollment;
                        setEnrollmentPeriod(getPeriodStatus(start_date, end_date));
                    } else {
                        setEnrollmentPeriod({ status: 'Not Set', message: 'Enrollment schedule could not be loaded. Please contact support.' });
                    }
                } catch (periodError) {
                    console.error("Failed to load enrollment period:", periodError);
                    setEnrollmentPeriod({ status: 'Not Set', message: 'Enrollment schedule could not be loaded. Please contact support.' });
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEligibility();
    }, []);

    const showAlert = (message, type = 'success') => {
        setAlert({ isVisible: true, message, type });
    };

    // ✅ NEW: Function to proceed to step 2
    const proceedToStep2 = (eligibilityResult) => {
        if (!eligibilityResult || !eligibilityResult.success) return;
        setPassedSubjectIds(new Set(eligibilityResult.passed_subject_ids || []));
        setCurrentStep(2);
    };

    // ✅ NEW: Helper function to proceed to Step 3
    const proceedToSubjectSetup = async () => {
        setIsLoadingSubjects(true);
        try {
            // This is the original logic from your handleGoToSubjectSetup
            const res = await studentAPI.getSubjectsForNextTerm(academicInfo.year, academicInfo.semester);

            if (res.success) {
                const subjectsBySem = res.data.reduce((acc, subject) => {
                    const sem = subject.semester;
                    if (!acc[sem]) acc[sem] = [];
                    acc[sem].push(subject);
                    return acc;
                }, {});
                setAvailableSubjects(subjectsBySem);
                setCurrentSemesterFilter(academicInfo.semester);
                setCurrentStep(3);
            } else {
                setValidationMessage(res.message || "Could not load subjects for the selected term.");
                setIsValidationModalOpen(true);
            }
        } catch (error) {
            setValidationMessage(error.message || "An error occurred while loading subjects.");
            setIsValidationModalOpen(true);
        } finally {
            setIsLoadingSubjects(false);
        }
    };

    // ✅ MODIFIED: Handler for the irregular warning confirmation
    const handleConfirmIrregular = () => {
        setShowIrregularWarning(false);
        proceedToSubjectSetup(); // Call the new helper to go to Step 3
    };


    // --- Step 1 to Step 2 Transition ---
    // ✅ MODIFIED: This function is now simpler
    const handleEnrollNow = async () => {
        if (eligibility.academic_status !== 'Regular') {
            setValidationMessage(`Only Regular students can use self-enrollment. Please contact the Registrar to resolve your '${eligibility.academic_status}' status.`);
            setIsValidationModalOpen(true);
            return;
        }

        if (enrollmentPeriod.status !== 'Open') {
            setValidationMessage(`Enrollment is not currently open. ${enrollmentPeriod.message}`);
            setIsValidationModalOpen(true);
            return;
        }

        try {
            if (!eligibility.student_id) {
                 throw new Error("Student ID not found from eligibility check. Cannot proceed.");
            }
            
            // Just check for ungraded subjects and get passed IDs
            const eligibilityRes = await enrollmentAPI.checkEnrollmentEligibility(eligibility.student_id); 
            
            if (!eligibilityRes.success || !eligibilityRes.eligible) {
                // This means there are ungraded subjects
                const ungradedList = (eligibilityRes.ungraded_subjects || []).map(s => `- ${s.subject_code}: ${s.descriptive_title}`).join('\n');
                const errorMessage = (
                  <div>
                    <p className="mb-2">Cannot proceed. All subjects from the previous term must have a final grade.</p>
                    <pre className="bg-gray-100 p-2 rounded text-sm text-left whitespace-pre-wrap">{ungradedList}</pre>
                  </div>
                );
                setValidationMessage(errorMessage);
                setIsValidationModalOpen(true);
                return; 
            }
            
            // Store data and proceed to Step 2
            setEligibilityData(eligibilityRes); 
            proceedToStep2(eligibilityRes); // This sets passedSubjectIds and currentStep = 2

        } catch(e) {
             setValidationMessage(e.message || "An error occurred while checking eligibility.");
             setIsValidationModalOpen(true);
             console.error("Failed to check eligibility.", e);
        }
    };

    // --- Step 2 to Step 3 Transition ---
    // ✅ MODIFIED: This function now contains the summer check logic
    const handleGoToSubjectSetup = async () => {
        setIsLoadingSubjects(true);
        try {
            // --- ✅ START: Summer Subject Validation ---
            if (eligibility.program_code === 'Diploma') {
                const allSubjectsRes = await subjectAPI.getByCourse(eligibility.course_id); 
                if (allSubjectsRes.success) {
                    const missedSubjects = [];
                    // Use academicInfo.year (from Step 2 dropdown), not eligibility.next_term.year
                    const studentYearValue = parseInt(academicInfo.year, 10); 
                    
                    if (studentYearValue >= 2) {
                        const summer1 = allSubjectsRes.data.filter(s => s.year === '1st Year Summer' && !passedSubjectIds.has(s.id));
                        missedSubjects.push(...summer1);
                    }
                    if (studentYearValue >= 3) {
                        const summer2 = allSubjectsRes.data.filter(s => s.year === '2nd Year Summer' && !passedSubjectIds.has(s.id));
                        missedSubjects.push(...summer2);
                    }

                    if (missedSubjects.length > 0) {
                        setUntakenSummerSubjects(missedSubjects);
                        setShowIrregularWarning(true); 
                        setIsLoadingSubjects(false); // Stop loading
                        return; // Stop and show warning
                    }
                }
            }
            // --- ✅ END: Summer Subject Validation ---

            // --- If no warning, proceed directly ---
            await proceedToSubjectSetup();

        } catch (error) {
            setValidationMessage(error.message || "An error occurred while checking subjects.");
            setIsValidationModalOpen(true);
            setIsLoadingSubjects(false); // Stop loading on error
        }
        // Note: setIsLoading(false) is handled by proceedToSubjectSetup if it's called
    };


    // --- Step 3 Handlers ---
    const handleAddSubject = (subject) => {
        if (!selectedSubjects.some(s => s.id === subject.id)) {
            setSelectedSubjects(prev => [...prev, subject]);
        }
    };

    const handleRemoveSubject = (subjectId) => {
        setSelectedSubjects(prev => prev.filter(s => s.id !== subjectId));
    };

    const handleSubmitEnrollment = async () => {
        if (selectedSubjects.length === 0) {
            setValidationMessage("Please select at least one subject before submitting.");
            setIsValidationModalOpen(true);
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                original_student_id: eligibility.student_id,
                ...academicInfo,
                selected_subjects: selectedSubjects.map(s => s.id),
            };
            
            const res = await enrollmentAPI.submitContinuingEnrollment(payload);

            if (res.success) {
                showAlert('Enrollment submitted successfully! Please proceed to the Cashier for payment.', 'success');
                setCurrentStep(1); 
                window.location.reload(); 
            } else {
                 setValidationMessage(res.message || "Enrollment submission failed. Please check the form and try again.");
                 setIsValidationModalOpen(true);
            }
        } catch (error) {
            setValidationMessage(error.message || "An unexpected error occurred during submission.");
            setIsValidationModalOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ## MEMOIZED LOGIC ##
    const statusType = eligibility.academic_status; 
    const isEnrollmentOpen = enrollmentPeriod.status === 'Open';
    const isButtonEnabled = statusType === 'Regular' && isEnrollmentOpen;
    const isIneligible = statusType === 'Ineligible';

    const getStatusDisplay = () => {
        if (loading || statusType === 'Loading') return { text: 'Checking Eligibility...', icon: Loader2, color: 'text-gray-500', bg: 'bg-gray-100' };
        if (statusType === 'Regular') return { text: 'Regular Student', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
        if (statusType === 'Irregular') return { text: 'Irregular Student', icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' };
        if (statusType === 'Ineligible') return { text: 'Ineligible to Enroll', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
        return { text: 'Status Unknown', icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
    };

    const status = getStatusDisplay();
    const nextTermInfo = eligibility.next_term;
    const retakeableSubjects = eligibility.retakeable_subjects;
    
    const displayableSubjects = useMemo(() => {
        const regularSubjects = availableSubjects[academicInfo.semester] || [];
        
        return regularSubjects.map(sub => {
            const prerequisiteNotMet = sub.prerequisite && sub.prerequisite.id && !passedSubjectIds.has(sub.prerequisite.id);
            return { ...sub, prerequisiteNotMet };
        });
    }, [availableSubjects, academicInfo.semester, passedSubjectIds]);

    const getTotalUnits = () => selectedSubjects.reduce((total, subject) => total + (subject.total_units || 0), 0);

    // ## UI Components for Steps ##
    const renderStep1 = () => (
        <motion.div key="step1" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="space-y-6">
            <Card className={`shadow-xl border-t-4 ${statusType === 'Regular' ? 'border-green-700' : statusType === 'Irregular' ? 'border-yellow-700' : 'border-red-700'}`}>
                <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-800">Enrollment Status</h2>
                        {loading ? (<Loader2 className="animate-spin w-8 h-8 text-red-800" />) : (
                            <Badge className={`text-lg font-bold py-2 px-4 ${status.bg} ${status.color}`}>
                                <status.icon className={`w-5 h-5 mr-2 ${loading ? 'animate-pulse' : ''}`} />
                                {status.text}
                            </Badge>
                        )}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6 space-y-4">
                        <h3 className="text-xl font-semibold text-gray-700 flex items-center">
                            <Calendar className="w-5 h-5 mr-3 text-red-700" />
                            Target Enrollment Term
                        </h3>
                        <div className="grid grid-cols-3 text-center border rounded-lg divide-x divide-gray-200 bg-gray-50">
                            <div className="p-3">
                                <p className="text-xs font-medium text-gray-500">School Year</p>
                                <p className="text-lg font-semibold text-gray-900">{nextTermInfo.schoolYear}</p>
                            </div>
                            <div className="p-3">
                                <p className="text-xs font-medium text-gray-500">Target Year Level</p>
                                <p className="text-lg font-semibold text-gray-900">{nextTermInfo.year}</p>
                            </div>
                            <div className="p-3">
                                <p className="text-xs font-medium text-gray-500">Semester</p>
                                <p className="text-lg font-semibold text-gray-900">{nextTermInfo.semester}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        {statusType === 'Regular' && (
                            <div className={`p-4 border rounded-xl space-y-3 ${isButtonEnabled ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                                <div className={`flex items-center font-semibold ${isButtonEnabled ? 'text-green-700' : 'text-blue-700'}`}>
                                    {isButtonEnabled ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                                    
                                    {loading ? (
                                        <span>Checking enrollment schedule...</span>
                                    ) : (
                                        <span>
                                            {isButtonEnabled 
                                                ? 'Congratulations! You are Regular and eligible to enroll.' 
                                                : enrollmentPeriod.message
                                            }
                                        </span>
                                    )}
                                </div>
                                <Button 
                                    onClick={handleEnrollNow} 
                                    disabled={!isButtonEnabled || loading} 
                                    className={`w-full text-white font-bold liquid-morph ${isButtonEnabled ? 'bg-red-800 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'} cursor-pointer`}
                                >
                                    <ArrowRight className="mr-2 h-5 w-5" />
                                    {isButtonEnabled ? 'Proceed to Enrollment' : (enrollmentPeriod.status === 'Upcoming' ? 'Enrollment Upcoming' : 'Enrollment Closed')}
                                </Button>
                            </div>
                        )}
                        
                        {statusType === 'Irregular' && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
                                <div className="flex items-center text-yellow-700 font-semibold">
                                    <AlertCircle className="w-5 h-5 mr-3" />
                                    <span>Warning: You are Irregular. You must resolve your failed/dropped subjects.</span>
                                </div>
                                <Button disabled={true} className="w-full bg-gray-400 text-white font-bold cursor-not-allowed">
                                    Enroll Now (Button Disabled)
                                </Button>
                                <p className='text-sm text-yellow-800 mt-2'>*Please contact the Program Head or Registrar to resolve your Irregular status before proceeding with enrollment.</p>
                            </div>
                        )}

                        {isIneligible && (
                             <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                                <div className="flex items-center text-red-700 font-semibold">
                                    <XCircle className="w-5 h-5 mr-3" />
                                    <span>You are ineligible to enroll at this time.</span>
                                </div>
                                <p className="text-sm text-red-600">You must wait for the final grades of the following subjects:</p>
                                <ul className="list-disc list-inside text-sm text-red-600 space-y-1 bg-red-100 p-3 rounded-lg">
                                    {eligibility.ungraded_subjects.map((sub, index) => (
                                        <li key={index} className='font-mono'>{sub.subject_code} - {sub.descriptive_title}</li>
                                    ))}
                                </ul>
                                <Button disabled className="w-full bg-gray-400 text-white font-bold cursor-not-allowed">
                                    Enroll Now (Ineligible)
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {(statusType === 'Irregular') && (
                <Card className="shadow-xl border-t-4 border-yellow-700">
                    <CardContent className="p-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4">
                            <ClipboardList className="w-6 h-6 mr-2 text-yellow-700" />
                            Academic Issues to Resolve
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">You have subjects to retake or drop actions to be processed:</p>
                        <div className="space-y-3">
                            {retakeableSubjects.failed.map(sub => (
                                <div key={sub.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <Badge variant="destructive" className="mb-1">Failed</Badge>
                                    <p className="font-semibold text-sm text-gray-800">{sub.subject_code}</p>
                                    <p className="text-xs text-gray-600">{sub.descriptive_title}</p>
                                </div>
                            ))}
                            {retakeableSubjects.dropped.map(sub => (
                                <div key={sub.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <Badge className="bg-yellow-200 text-yellow-800 mb-1 hover:bg-yellow-200">Dropped (Need to Retake)</Badge>
                                    <p className="font-semibold text-sm text-gray-800">{sub.subject_code}</p>
                                    <p className="text-xs text-gray-600">{sub.descriptive_title}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );

    const renderStep2 = () => (
        <motion.div key="step2" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-6">
                <h3 className="font-bold text-2xl text-gray-800">Step 2: Confirm Academic Term</h3>
                <p className="text-gray-600 mt-1">
                    Please confirm the target term for your enrollment.
                </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="font-bold text-gray-700 text-sm mb-2 flex items-center"><Calendar className="w-4 h-4 mr-2" />School Year</label>
                        <MotionDropdown 
                            value={academicInfo.school_year} 
                            onChange={v => setAcademicInfo(p => ({ ...p, school_year: v }))} 
                            options={schoolYearOptions} 
                            placeholder="Select School Year" />
                    </div>
                    <div>
                        <label className="font-bold text-gray-700 text-sm mb-2 flex items-center"><GraduationCap className="w-4 h-4 mr-2" />Year Level</label>
                        <MotionDropdown 
                            value={academicInfo.year} 
                            onChange={v => setAcademicInfo(p => ({ ...p, year: v }))} 
                            options={yearLevelOptions} 
                            placeholder="Select Year Level" />
                    </div>
                    <div>
                        <label className="font-bold text-gray-700 text-sm mb-2 flex items-center"><BookOpen className="w-4 h-4 mr-2" />Semester</label>
                        <MotionDropdown 
                            value={academicInfo.semester} 
                            onChange={v => setAcademicInfo(p => ({ ...p, semester: v }))} 
                            options={semesterOptions} 
                            placeholder="Select Semester" />
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderStep3 = () => (
        <motion.div key="step3" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
            <div className="text-center mb-6">
                <h3 className="font-bold text-2xl text-gray-800">Step 3: Subject Selection</h3>
                <p className="text-gray-600 mt-1">Select your subjects for {academicInfo.semester}, S.Y. {academicInfo.school_year}.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
                <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Available Subjects ({academicInfo.semester})</h3>
                    </div>
                    
                    <div className="space-y-3 overflow-y-auto grow pr-2">
                        {isLoadingSubjects ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-red-800 w-8 h-8" /></div>
                          : displayableSubjects.length === 0 ? <div className="text-center text-gray-500 pt-16"><BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>No subjects found for this term.</p></div>
                            : displayableSubjects.map(sub => {
                              const isAlreadyAdded = selectedSubjects.some(s => s.id === sub.id);
                              const isAddable = !isAlreadyAdded && !sub.prerequisiteNotMet;

                              return (
                                <motion.div key={sub.id} className="bg-white rounded-xl p-3 shadow-sm border" whileHover={{ y: -2 }}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      {sub.prerequisiteNotMet && (
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
                                      <Button size="sm" onClick={() => handleAddSubject(sub)} disabled={!isAddable} className="ml-2 mt-1 shrink-0 cursor-pointer">
                                        {isAlreadyAdded ? 'Added' : 'Add'}
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                    </div>
                </div>
                <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Selected Subjects</h3>
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-bold">Total: {getTotalUnits()} units</div>
                    </div>
                    <div className="space-y-3 overflow-y-auto grow pr-2">
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
                                    <Button size="sm" className="cursor-pointer" variant="destructive" onClick={() => handleRemoveSubject(sub.id)}>Remove</Button>
                                </div>
                            </motion.div>
                        )) : <div className="text-center text-gray-500 pt-16"><BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>Add subjects from the left panel.</p></div>}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    // --- MAIN RENDER ---
    return (
        <motion.div
            className="p-6 max-w-7xl mx-auto space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <SuccessAlert 
                isVisible={alert.isVisible} 
                message={alert.message} 
                type={alert.type} 
                onClose={() => setAlert({ ...alert, isVisible: false })} 
            />
            <ValidationErrorModal 
                isOpen={isValidationModalOpen} 
                onClose={() => setIsValidationModalOpen(false)} 
                message={validationMessage} 
            />
            <IrregularWarningModal
                isOpen={showIrregularWarning}
                onClose={() => setShowIrregularWarning(false)}
                onConfirm={handleConfirmIrregular}
                subjects={untakenSummerSubjects}
            />
            
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <GraduationCap className="w-8 h-8 text-red-700 mr-3" />
                    Enrollment Eligibility Check
                </h1>
                <p className="text-gray-600 mt-1">
                    Review your academic standing and enroll for the next term.
                </p>
            </motion.div>

            <AnimatePresence mode="wait">
                <div className="p-4 bg-white rounded-xl shadow-lg border">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                </div>
            </AnimatePresence>
            
            {(currentStep === 2 || currentStep === 3) && (
                <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-2xl shadow-inner">
                    <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="cursor-pointer">
                        <ChevronLeft className='mr-2 h-4 w-4'/> Back
                    </Button>
                    {currentStep === 2 && (
                        <Button onClick={handleGoToSubjectSetup} disabled={isLoadingSubjects} className="bg-red-800 hover:bg-red-700 text-white cursor-pointer">
                            {isLoadingSubjects ? <Loader2 className="animate-spin mr-2" /> : <ArrowRight className="mr-2 h-4 w-4" />} Next: Subject Selection
                        </Button>
                    )}
                    {currentStep === 3 && (
                        <Button onClick={handleSubmitEnrollment} disabled={isSubmitting || selectedSubjects.length === 0} className="bg-green-700 hover:bg-green-600 text-white cursor-pointer">
                            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Finalize Enrollment
                        </Button>
                    )}
                </div>
            )}

        </motion.div>
    );
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

export default StudentEnrollmentEligibility;