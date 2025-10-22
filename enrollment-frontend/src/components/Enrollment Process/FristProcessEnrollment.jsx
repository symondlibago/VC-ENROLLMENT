import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ArrowLeft, 
  GraduationCap, 
  Calendar, 
  Users, 
  BookOpen,
  CheckCircle,
  Download,
  Search,
  ArrowRight,
  Clock,
  MapPin,
  AlertTriangle,
  Upload,
  X,
  FileSignature,
  AlertCircle
} from 'lucide-react';
import CustomCalendar from '../layout/CustomCalendar';
import CourseChoicesModal from '../modals/CourseChoicesModal';
import EnrollmentConfirmationModal from '../modals/EnrollmentConfirmationModal';
import ValidationErrorModal from '../modals/ValidationErrorModal';
import { subjectAPI, enrollmentAPI } from '@/services/api';
import VipcLogo from '/circlelogo.png';

const EnrollmentPage = ({ onBack, onCheckStatus, onUploadReceipt }) => {
  const [department, setDepartment] = useState('');
  const [enrollmentType, setEnrollmentType] = useState('');
  const [isCourseChoicesModalOpen, setIsCourseChoicesModalOpen] = useState(false);
  const [isEnrollmentTypeOpen, setIsEnrollmentTypeOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 2 dropdown states
  const [isSchoolYearOpen, setIsSchoolYearOpen] = useState(false);
  const [isSemesterOpen, setIsSemesterOpen] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  // Step 3 subject selection states
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [currentSemesterFilter, setCurrentSemesterFilter] = useState('1st Semester');
  const [availableSubjects, setAvailableSubjects] = useState({});
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [subjectError, setSubjectError] = useState(null);

  // Step 4 confirmation state
  const [isDataConfirmed, setIsDataConfirmed] = useState(false);
  
  // Enrollment submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [enrollmentCode, setEnrollmentCode] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  
  // Validation error modal states
  const [showValidationErrorModal, setShowValidationErrorModal] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');

  // Second step form data
  const [formData, setFormData] = useState({
    // Basic Information
    course: '',
    courseProgram: '',
    year: '',
    semester: '',
    schoolYear: '',
    lastName: '',
    firstName: '',
    middleName: '',
    gender: '',
    birthDate: '',
    birthPlace: '',
    nationality: '',
    civilStatus: '',
    religion: '',
    address: '',
    contactNumber: '',
    emailAddress: '',
    
    // Parent Information
    fatherName: '',
    fatherOccupation: '',
    fatherContactNumber: '',
    motherName: '',
    motherOccupation: '',
    motherContactNumber: '',
    parentsAddress: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactAddress: '',
    
    // Educational Background
    elementary: '',
    elementaryDateCompleted: '',
    juniorHighSchool: '',
    juniorHighDateCompleted: '',
    seniorHighSchool: '',
    seniorHighDateCompleted: '',
    highSchoolNonK12: '',
    highSchoolNonK12DateCompleted: '',
    college: '',
    collegeDateCompleted: '',
    
    // Identification Documents
    idPhoto: null,
    signature: null
  });

  const departments = [
    'College',
    'Senior High School',
  ];

  const enrollmentTypes = [
    'New',
    'Old',
    'Transferee',
    'Returnee',
  ];

  // Step 2 dropdown options
  const schoolYears = ['2024-2025', '2025-2026'];
  const semesters = ['1st Semester', '2nd Semester', 'Summer'];
  const genders = ['Male', 'Female'];
  const [formErrors, setFormErrors] = useState({});
  
  // Get year options based on program type
  const getYearOptions = () => {
    // Extract program type from the course selection
    const programType = formData.courseProgram || '';
    
    switch (programType) {
      case 'SHS':
        return ['Grade 11', 'Grade 12'];
      case 'Bachelor':
        return ['1st Year', '2nd Year', '3rd Year', '4th Year'];
      case 'Diploma':
      default:
        return ['1st Year', '2nd Year', '1st Year Summer', '2nd Year Summer'];
    }
  };

  // Fetch subjects when course is selected and user reaches step 3
  useEffect(() => {
    if (currentStep === 3 && formData.courseId && formData.year && formData.semester) {
      fetchSubjectsByCourse(formData.courseId, formData.year, formData.semester);
    }
  }, [currentStep, formData.courseId, formData.year, formData.semester]);

  
  const fetchSubjectsByCourse = async (courseId, year, semester) => { 
    setIsLoadingSubjects(true);
    setSubjectError(null);
    
    try {
      // Pass all three parameters to the API call
      const response = await subjectAPI.getByCourse(courseId, year, semester);
      
      if (response.success) {
        // Organize subjects by semester (this logic remains the same)
        const subjectsBySemester = {};
        
        response.data.forEach(subject => {
          const sem = subject.semester;
          
          if (!subjectsBySemester[sem]) {
            subjectsBySemester[sem] = [];
          }
          
          subjectsBySemester[sem].push({
            id: subject.id,
            code: subject.subject_code,
            name: subject.descriptive_title,
            units: subject.total_units,
            prerequisite: subject.pre_req || 'None'
          });
        });
        
        setAvailableSubjects(subjectsBySemester);
        
        if (subjectsBySemester && Object.keys(subjectsBySemester).length > 0) {
          if (!subjectsBySemester[currentSemesterFilter]) {
            setCurrentSemesterFilter(Object.keys(subjectsBySemester)[0]);
          }
        }
      } else {
        setSubjectError('Failed to fetch subjects for the selected criteria.');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjectError('Error loading subjects. Please try again.');
    } finally {
      setIsLoadingSubjects(false);
    }
  };
  
  const handleCheckStatusClick = () => {
    if (onCheckStatus) {
      onCheckStatus();
    }
  };

  const handleUploadReceiptClick = () => {
    if (onUploadReceipt) {
      onUploadReceipt();
    }
  };

  const handleDepartmentSelect = (course) => {
    setDepartment(course.course_name);
    // Store the complete course object with ID for fetching subjects later
    setFormData(prev => ({
      ...prev,
      courseId: course.id,
      course: course.course_name,
      courseProgram: course.program ? course.program.program_code : ''
    }));
    setIsCourseChoicesModalOpen(false);
  };
  
  // Handle enrollment submission
  const handleSubmitEnrollment = async () => {
    if (!isDataConfirmed || isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmissionError(null);
    
    try {
      // Create a FormData object for file uploads
      const formDataObj = new FormData();
      
      // Add all text fields to the FormData
      formDataObj.append('course_id', formData.courseId);
      formDataObj.append('last_name', formData.lastName);
      formDataObj.append('first_name', formData.firstName);
      formDataObj.append('middle_name', formData.middleName || '');
      formDataObj.append('gender', formData.gender);
      formDataObj.append('birth_date', formData.birthDate);
      formDataObj.append('birth_place', formData.birthPlace);
      formDataObj.append('nationality', formData.nationality);
      formDataObj.append('civil_status', formData.civilStatus);
      formDataObj.append('religion', formData.religion || '');
      formDataObj.append('address', formData.address);
      formDataObj.append('contact_number', formData.contactNumber);
      formDataObj.append('email_address', formData.emailAddress);
      formDataObj.append('father_name', formData.fatherName || '');
      formDataObj.append('father_occupation', formData.fatherOccupation || '');
      formDataObj.append('father_contact_number', formData.fatherContactNumber || '');
      formDataObj.append('mother_name', formData.motherName || '');
      formDataObj.append('mother_occupation', formData.motherOccupation || '');
      formDataObj.append('mother_contact_number', formData.motherContactNumber || '');
      formDataObj.append('parents_address', formData.parentsAddress || '');
      formDataObj.append('emergency_contact_name', formData.emergencyContactName);
      formDataObj.append('emergency_contact_number', formData.emergencyContactNumber);
      formDataObj.append('emergency_contact_address', formData.emergencyContactAddress);
      formDataObj.append('elementary', formData.elementary || '');
      formDataObj.append('elementary_date_completed', formData.elementaryDateCompleted || '');
      formDataObj.append('junior_high_school', formData.juniorHighSchool || '');
      formDataObj.append('junior_high_date_completed', formData.juniorHighDateCompleted || '');
      formDataObj.append('senior_high_school', formData.seniorHighSchool || '');
      formDataObj.append('senior_high_date_completed', formData.seniorHighDateCompleted || '');
      formDataObj.append('high_school_non_k12', formData.highSchoolNonK12 || '');
      formDataObj.append('high_school_non_k12_date_completed', formData.highSchoolNonK12DateCompleted || '');
      formDataObj.append('college', formData.college || '');
      formDataObj.append('college_date_completed', formData.collegeDateCompleted || '');
      formDataObj.append('semester', formData.semester);
      formDataObj.append('school_year', formData.schoolYear);
      formDataObj.append('year', formData.year);
      formDataObj.append('enrollment_type', enrollmentType);
      
      // Add the selected subjects as an array
      // Use the correct format for arrays in FormData
      const subjectIds = selectedSubjects.map(subject => subject.id);
      
      // Append each subject ID with the same key name to create an array on the server
      subjectIds.forEach(id => {
        formDataObj.append('selected_subjects[]', id);
      });
      
      // Don't append the JSON string version as it causes confusion in the backend
      
      
      // Add the file uploads if they exist
      if (formData.idPhoto) {
        formDataObj.append('id_photo', formData.idPhoto);
      }
      
      if (formData.signature) {
        formDataObj.append('signature', formData.signature);
      }
      
      // Submit the enrollment data
      const response = await enrollmentAPI.submitEnrollment(formDataObj);
      
      // Set the enrollment code and open the confirmation modal
      setEnrollmentCode(response.data.enrollment_code);
      setIsConfirmationModalOpen(true);
    } catch (error) {
      console.error('Enrollment submission error:', error);
      
      // Handle validation errors specifically
      if (error.errors) {
        // Format validation errors for display
        const errorMessages = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        
        setSubmissionError(`Validation failed:\n${errorMessages}`);
      } else {
        setSubmissionError(error.message || 'Failed to submit enrollment. Please try again.');
      }
      
      setIsConfirmationModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCourseChoicesModal = () => {
    setIsCourseChoicesModalOpen(true);
  };

  const handleCloseCourseChoicesModal = () => {
    setIsCourseChoicesModalOpen(false);
  };

  const handleEnrollmentTypeSelect = (type) => {
    setEnrollmentType(type);
    setIsEnrollmentTypeOpen(false);
  };

  // Step 2 dropdown handlers
  const handleSchoolYearSelect = (year) => {
    handleFormDataChange('schoolYear', year);
    setIsSchoolYearOpen(false);
  };

  const handleSemesterSelect = (semester) => {
    handleFormDataChange('semester', semester);
    setIsSemesterOpen(false);
  };

  const handleCourseSelect = (course) => {
    handleFormDataChange('course', course);
    setIsCourseOpen(false);
  };
  
  const handleYearSelect = (year) => {
    handleFormDataChange('year', year);
    setIsYearOpen(false);
  };

  const handleGenderSelect = (gender) => {
    handleFormDataChange('gender', gender);
    setIsGenderOpen(false);
  };

  const handleBackClick = () => {
    if (currentStep > 1) {
      setCurrentStep(prevStep => prevStep - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleContinueEnrollment = () => {
    // Validate course and enrollment type selection
    if (!department) {
      setValidationErrorMessage('Please select a course before proceeding.');
      setShowValidationErrorModal(true);
      return;
    }
    
    if (!enrollmentType) {
      setValidationErrorMessage('Please select an enrollment type before proceeding.');
      setShowValidationErrorModal(true);
      return;
    }
    
    // If validation passes, proceed to step 2
    setCurrentStep(2);
  };

  const handleContinueToSubjectSetup = () => {
    // Validate form fields
    const errors = {};
    const errorRefs = {};
    
    // Required fields validation
    const requiredFields = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'middleName', label: 'Middle Name' },
      { key: 'gender', label: 'Gender' },
      { key: 'birthDate', label: 'Birth Date' },
      { key: 'birthPlace', label: 'Birth Place' },
      { key: 'nationality', label: 'Nationality' },
      { key: 'civilStatus', label: 'Civil Status' },
      { key: 'address', label: 'Address' },
      { key: 'contactNumber', label: 'Contact Number' },
      { key: 'emailAddress', label: 'Email Address' },
      { key: 'semester', label: 'Semester' },
      { key: 'schoolYear', label: 'School Year' },
      { key: 'emergencyContactName', label: 'Emergency Contact Name' },
      { key: 'emergencyContactNumber', label: 'Emergency Contact Number' },
      { key: 'emergencyContactAddress', label: 'Emergency Contact Address' },
      { key: 'elementary', label: 'Elementary' },
      { key: 'juniorHighSchool', label: 'Junior High School Date Completed' },
    ];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!formData[field.key] || formData[field.key].trim() === '') {
        errors[field.key] = `${field.label} is required`;
        errorRefs[field.key] = React.createRef();
      }
    });
    
    // Email validation
    if (formData.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      errors.emailAddress = 'Please enter a valid email address';
      errorRefs.emailAddress = React.createRef();
    }
    
    // Contact number validation (simple check for now)
    if (formData.contactNumber && !/^[0-9+\-\s()]{7,15}$/.test(formData.contactNumber)) {
      errors.contactNumber = 'Please enter a valid contact number';
      errorRefs.contactNumber = React.createRef();
    }
    
    // If there are errors, display them and scroll to the first error
    if (Object.keys(errors).length > 0) {
      // Set form errors
      setFormErrors(errors);
      
      // Get the first error field key
      const firstErrorKey = Object.keys(errors)[0];
      
      // Find the input element for the first error
      const errorElement = document.querySelector(`[name="${firstErrorKey}"]`) || 
                           document.querySelector(`#${firstErrorKey}`) ||
                           document.querySelector(`[data-field="${firstErrorKey}"]`);
      
      // If element found, scroll to it smoothly
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus on the element after scrolling
        setTimeout(() => {
          errorElement.focus();
        }, 500);
      } else {
        // If specific element not found, scroll to the form section
        const formSection = document.querySelector('.enrollment-form-section');
        if (formSection) {
          formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      
      // Show validation error modal instead of alert
      setValidationErrorMessage('Please correct the errors in the form before proceeding.');
      setShowValidationErrorModal(true);
      
      return;
    }
    
    // Clear any previous errors
    setFormErrors({});
    
    // If validation passes, proceed to next step
    setCurrentStep(3);
  };
  
  const handleContinueToReview = () => {
    setCurrentStep(4);
  };

  // Subject selection handlers
  const handleAddSubject = (subject) => {
    if (!selectedSubjects.some(s => s.id === subject.id)) {
      setSelectedSubjects(prev => [...prev, subject]);
    }
  };

  const handleRemoveSubject = (subjectId) => {
    setSelectedSubjects(prev => prev.filter(s => s.id !== subjectId));
  };

  const handleAddAllSubjects = () => {
    if (isLoadingSubjects || !availableSubjects[currentSemesterFilter] || availableSubjects[currentSemesterFilter].length === 0) {
      return;
    }
    
    const currentSemesterSubjects = availableSubjects[currentSemesterFilter] || [];
    const newSubjects = currentSemesterSubjects.filter(
      subject => !selectedSubjects.some(s => s.id === subject.id)
    );
    
    setSelectedSubjects(prev => [...prev, ...newSubjects]);
  };

  const getTotalUnits = () => {
    return selectedSubjects.reduce((total, subject) => total + subject.units, 0);
  };

  const handleFormDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } 
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95,
      transition: { duration: 0.2 } 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--snowy-white)] via-[var(--whitish-pink)] to-white">
      {/* Floating Navigation */}
      <motion.div 
        className="fixed top-6 left-6 z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        {(onBack || currentStep > 1) && (
          <button
            onClick={handleBackClick}
            className="bg-white/90 backdrop-blur-sm text-[var(--dominant-red)] p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
      </motion.div>

      {/* Main Container */}
      <motion.div
        className="container mx-auto px-6 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      {/* Header Section */}
      <motion.div 
    className="text-center mb-12"
    variants={itemVariants}
>
    <div className="flex justify-center mb-6">
        <div className="relative">
            <div className="w-30 h-30 rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
                <img 
                    src={VipcLogo} 
                    alt="VIPC Logo" 
                    className="w-[110%] h-[100%] object-contain"
                />
            </div>
        </div>
    </div>
    <h1 className="text-2xl md:text-4xl font-bold heading-bold text-gray-900 mb-4">
        Welcome to
        <span className="text-[var(--dominant-red)] block">VIPC Enrollment</span>
    </h1>
    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
        Vineyard International Polytechnic College
        <br />
        <span className="text-base">1st Semester, School Year 2025 - 2026</span>
    </p>
</motion.div>

        {/* Progress Steps */}
        <motion.div 
          className="flex justify-center mb-12"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step <= currentStep 
                    ? 'bg-[var(--dominant-red)] text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-1 mx-2 rounded-full transition-all duration-300 ${
                    step < currentStep ? 'bg-[var(--dominant-red)]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          variants={itemVariants}
        >
          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 liquid-hover cursor-pointer"
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold heading-bold text-gray-900 ml-3">Download</h3>
            </div>
            <p className="text-gray-600 mb-3 text-sm">Get your enrollment prospectus and requirements</p>
            <button className="text-[var(--dominant-red)] font-semibold hover:underline text-sm">
              Download Prospectus →
            </button>
          </motion.div>

          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 liquid-hover cursor-pointer"
            whileHover={{ y: -5 }}
            onClick={handleCheckStatusClick}
          >
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold heading-bold text-gray-900 ml-3">Check Status</h3>
            </div>
            <p className="text-gray-600 mb-3 text-sm">Track your enrollment application progress</p>
            <button className="text-[var(--dominant-red)] font-semibold hover:underline text-sm">
              Check Status →
            </button>
          </motion.div>

          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 liquid-hover cursor-pointer"
            whileHover={{ y: -5 }}
            onClick={handleUploadReceiptClick}
          >
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold heading-bold text-gray-900 ml-3">Upload Receipt</h3>
            </div>
            <p className="text-gray-600 mb-3 text-sm">Receipt for First Process of Enrollment</p>
            <button className="text-[var(--dominant-red)] font-semibold hover:underline text-sm">
              Upload →
            </button>
          </motion.div>
        </motion.div>

        {/* Important Announcements */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
          variants={itemVariants}
        >
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-l-4 border-amber-400 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold heading-bold text-gray-900 ml-4">Class Schedule</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                <span className="font-semibold text-gray-800 text-sm">K to 10 & Senior High</span>
                <span className="text-amber-700 font-bold text-sm">June 16, 2025</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                <span className="font-semibold text-gray-800 text-sm">College Programs</span>
                <span className="text-amber-700 font-bold text-sm">June 30, 2025</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                <span className="font-semibold text-gray-800 text-sm">Graduate School</span>
                <span className="text-amber-700 font-bold text-sm">July 5, 2025</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-l-4 border-emerald-400 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-emerald-400 rounded-xl flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold heading-bold text-gray-900 ml-4">Payment Info</h3>
            </div>
            <div className="text-center">
              <div className="bg-white/70 rounded-xl p-4 mb-3">
                <div className="text-2xl font-bold text-emerald-700 mb-1">₱500.00</div>
                <p className="text-gray-700 font-semibold text-sm">Minimum Downpayment</p>
                <p className="text-xs text-gray-600 mt-1">For College & Graduate Students</p>
              </div>
              <button className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-600 transition-colors shadow-lg text-sm">
                Payment Instructions
              </button>
            </div>
          </div>
        </motion.div>

        {/* Step 1 - Enrollment Form */}
        {currentStep === 1 && (
          <motion.div 
            className="max-w-4xl mx-auto"
            variants={itemVariants}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 p-6 text-white">
                <h2 className="text-2xl font-bold heading-bold mb-2">Start Your Enrollment</h2>
                <p className="text-red-100 text-sm">Choose your department and enrollment type to begin</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Department Selection */}
                <div>
                  <label className="text-gray-800 text-base font-bold heading-bold mb-3 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-[var(--dominant-red)]" />
                    Select Course
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      placeholder="Click to Select Course"
                      value={department}
                      onClick={handleOpenCourseChoicesModal}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg text-sm cursor-pointer font-semibold"
                    />
                  </div>
                </div>

                {/* Enrollment Type Selection */}
                <div>
                  <label className="text-gray-800 text-base font-bold heading-bold mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-[var(--dominant-red)]" />
                    Select Enrollment Type
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg text-sm"
                      onClick={() => setIsEnrollmentTypeOpen(!isEnrollmentTypeOpen)}
                    >
                      <span className="font-semibold">
                        {enrollmentType || 'Select Enrollment Type'}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-[var(--dominant-red)] transition-transform duration-300 ${isEnrollmentTypeOpen ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                    <AnimatePresence>
                      {isEnrollmentTypeOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute z-20 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-2xl mt-2 max-h-40 overflow-auto"
                        >
                          {enrollmentTypes.map((type, index) => (
                            <motion.div
                              key={type}
                              className="px-4 py-3 hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white cursor-pointer transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 font-medium text-sm"
                              onClick={() => handleEnrollmentTypeSelect(type)}
                              whileHover={{ x: 5 }}
                            >
                              {type}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Continue Button */}
                <div className="text-center pt-4">
                <motion.button 
                  onClick={handleContinueEnrollment}
                  // Add the `border` or `border-2` class here
                  className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 text-white px-8 py-3 rounded-2xl text-base font-bold heading-bold shadow-2xl hover:shadow-3xl flex items-center justify-center mx-auto group border-2 border-[var(--dominant-red)]"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue Enrollment
                  <ArrowRight className="text-[var(--dominant-red)] ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
              </div>
            </div>
          </motion.div>
        )}


        {/* Step 2 - Detailed Enrollment Form */}
        {currentStep === 2 && (
          <motion.div 
            className="max-w-6xl mx-auto"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 p-6 text-white">
                <h2 className="text-2xl font-bold heading-bold mb-2">
                  Enrollment Form for {department || 'Higher Education / Graduate School'} ({enrollmentType || 'New'} Student)
                </h2>
                <p className="text-red-100 text-sm">Please fill out all required information</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Academic Information */}
                <div className="bg-[#FFFAFA] rounded-2xl p-4 border border-black-200 shadow-md">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-4">Academic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Semester
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.semester ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg text-sm`}
                          onClick={() => setIsSemesterOpen(!isSemesterOpen)}
                          name="semester"
                          data-field="semester"
                        >
                          <span className="font-semibold">
                            {formData.semester || 'Select Semester'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-[var(--dominant-red)] transition-transform duration-300 ${isSemesterOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
                        {formErrors.semester && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.semester}</p>
                        )}
                        <AnimatePresence>
                          {isSemesterOpen && (
                            <motion.div
                              variants={dropdownVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className="absolute z-20 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-2xl mt-2 max-h-80 overflow-auto"
                            >
                              {semesters.map((semester, index) => (
                                <motion.div
                                  key={semester}
                                  className="px-4 py-3 hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white cursor-pointer transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 font-medium text-sm"
                                  onClick={() => handleSemesterSelect(semester)}
                                  whileHover={{ x: 5 }}
                                >
                                  {semester}
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        School Year
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.schoolYear ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg text-sm`}
                          onClick={() => setIsSchoolYearOpen(!isSchoolYearOpen)}
                          name="schoolYear"
                          data-field="schoolYear"
                        >
                          <span className="font-semibold">
                            {formData.schoolYear || 'Select School Year'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-[var(--dominant-red)] transition-transform duration-300 ${isSchoolYearOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
                        {formErrors.schoolYear && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.schoolYear}</p>
                        )}
                        <AnimatePresence>
                          {isSchoolYearOpen && (
                            <motion.div
                              variants={dropdownVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className="absolute z-20 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-2xl mt-2 max-h-80 overflow-auto"
                            >
                              {schoolYears.map((year, index) => (
                                <motion.div
                                  key={year}
                                  className="px-4 py-3 hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white cursor-pointer transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 font-medium text-sm"
                                  onClick={() => handleSchoolYearSelect(year)}
                                  whileHover={{ x: 5 }}
                                >
                                  {year}
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Year Level
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.year ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg text-sm`}
                          onClick={() => setIsYearOpen(!isYearOpen)}
                          name="year"
                          data-field="year"
                        >
                          <span className="font-semibold">
                            {formData.year || 'Select Year Level'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-[var(--dominant-red)] transition-transform duration-300 ${isYearOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
                        {formErrors.year && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.year}</p>
                        )}
                        <AnimatePresence>
                          {isYearOpen && (
                            <motion.div
                              variants={dropdownVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className="absolute z-20 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-2xl mt-2 max-h-80 overflow-auto"
                            >
                              {getYearOptions().map((year, index) => (
                                <motion.div
                                  key={year}
                                  className="px-4 py-3 hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white cursor-pointer transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 font-medium text-sm"
                                  onClick={() => handleYearSelect(year)}
                                  whileHover={{ x: 5 }}
                                >
                                  {year}
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information with Custom Calendar */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-4">Personal Information</h3>
                  
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleFormDataChange('lastName', e.target.value)}
                        className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.lastName ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                        name="lastName"
                        data-field="lastName"
                      />
                      {formErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        First Name
                      </label>
                      <input
                          type="text"
                          placeholder="Enter First Name"
                          value={formData.firstName}
                          onChange={(e) => handleFormDataChange('firstName', e.target.value)}
                          className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.firstName ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                          name="firstName"
                          data-field="firstName"
                        />
                        {formErrors.firstName && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                        )}
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Middle Name"
                        value={formData.middleName}
                        onChange={(e) => handleFormDataChange('middleName', e.target.value)}
                        className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.middleName ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                        name="middleName"
                        data-field="middleName"
                      />
                      {formErrors.middleName && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.middleName}</p>
                      )}
                    </div>
                  </div>

                  {/* Gender and Birth Information with Custom Calendar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Gender
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.gender ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg text-sm`}
                          onClick={() => setIsGenderOpen(!isGenderOpen)}
                          name="gender"
                          data-field="gender"
                        >
                          <span className="font-semibold">
                            {formData.gender || 'Select Gender'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-[var(--dominant-red)] transition-transform duration-300 ${isGenderOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
                        {formErrors.gender && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.gender}</p>
                        )}
                        <AnimatePresence>
                          {isGenderOpen && (
                            <motion.div
                              variants={dropdownVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className="absolute z-20 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-2xl mt-2 max-h-80 overflow-auto"
                            >
                              {genders.map((gender, index) => (
                                <motion.div
                                  key={gender}
                                  className="px-4 py-3 hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white cursor-pointer transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 font-medium text-sm"
                                  onClick={() => handleGenderSelect(gender)}
                                  whileHover={{ x: 5 }}
                                >
                                  {gender}
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Birth Date
                      </label>
                      <div>
                        <CustomCalendar
                          value={formData.birthDate}
                          onChange={(date) => handleFormDataChange('birthDate', date)}
                          placeholder="Select Birth Date"
                          className={formErrors.birthDate ? 'border-red-500' : ''}
                          name="birthDate"
                          data-field="birthDate"
                        />
                        {formErrors.birthDate && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.birthDate}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Birth Place
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Birth Place"
                        value={formData.birthPlace}
                        onChange={(e) => handleFormDataChange('birthPlace', e.target.value)}
                        className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.birthPlace ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                        name="birthPlace"
                        data-field="birthPlace"
                      />
                      {formErrors.birthPlace && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.birthPlace}</p>
                      )}
                    </div>
                  </div>

                  {/* Additional Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Nationality
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Nationality"
                        value={formData.nationality}
                        onChange={(e) => handleFormDataChange('nationality', e.target.value)}
                        className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.nationality ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                        name="nationality"
                        data-field="nationality"
                      />
                      {formErrors.nationality && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.nationality}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Civil Status
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Civil Status"
                        value={formData.civilStatus}
                        onChange={(e) => handleFormDataChange('civilStatus', e.target.value)}
                        className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.civilStatus ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                        name="civilStatus"
                        data-field="civilStatus"
                      />
                      {formErrors.civilStatus && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.civilStatus}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Religion
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Religion"
                        value={formData.religion}
                        onChange={(e) => handleFormDataChange('religion', e.target.value)}
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-4">
                    <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Complete Address"
                      value={formData.address}
                      onChange={(e) => handleFormDataChange('address', e.target.value)}
                      className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.address ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                      name="address"
                      data-field="address"
                    />
                    {formErrors.address && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        placeholder="Enter Contact Number"
                        value={formData.contactNumber}
                        onChange={(e) => handleFormDataChange('contactNumber', e.target.value)}
                        className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.contactNumber ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                        name="contactNumber"
                        data-field="contactNumber"
                      />
                      {formErrors.contactNumber && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.contactNumber}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="Enter Email Address"
                        value={formData.emailAddress}
                        onChange={(e) => handleFormDataChange('emailAddress', e.target.value)}
                        className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.emailAddress ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                        name="emailAddress"
                        data-field="emailAddress"
                      />
                      {formErrors.emailAddress && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.emailAddress}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Parent Information */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-200">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-4">Parent Information</h3>
                  
                  {/* Father Information */}
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-gray-800 mb-3">Father's Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          Father's Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Father's Full Name"
                          value={formData.fatherName}
                          onChange={(e) => handleFormDataChange('fatherName', e.target.value)}
                          className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.fatherName ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                          name="fatherName"
                          data-field="fatherName"
                        />
                        {formErrors.fatherName && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.fatherName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          Occupation
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Father's Occupation"
                          value={formData.fatherOccupation}
                          onChange={(e) => handleFormDataChange('fatherOccupation', e.target.value)}
                          className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.fatherOccupation ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                          name="fatherOccupation"
                          data-field="fatherOccupation"
                        />
                        {formErrors.fatherOccupation && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.fatherOccupation}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          Contact Number
                        </label>
                        <input
                          type="tel"
                          placeholder="Enter Father's Contact Number"
                          value={formData.fatherContactNumber}
                          onChange={(e) => handleFormDataChange('fatherContactNumber', e.target.value)}
                          className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.fatherContactNumber ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                          name="fatherContactNumber"
                          data-field="fatherContactNumber"
                        />
                        {formErrors.fatherContactNumber && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.fatherContactNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mother Information */}
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-gray-800 mb-3">Mother's Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          Mother's Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Mother's Full Name"
                          value={formData.motherName}
                          onChange={(e) => handleFormDataChange('motherName', e.target.value)}
                          className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.motherName ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                          name="motherName"
                          data-field="motherName"
                        />
                        {formErrors.motherName && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.motherName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          Occupation
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Mother's Occupation"
                          value={formData.motherOccupation}
                          onChange={(e) => handleFormDataChange('motherOccupation', e.target.value)}
                          className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.motherOccupation ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                          name="motherOccupation"
                          data-field="motherOccupation"
                        />
                        {formErrors.motherOccupation && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.motherOccupation}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          Contact Number
                        </label>
                        <input
                          type="tel"
                          placeholder="Enter Mother's Contact Number"
                          value={formData.motherContactNumber}
                          onChange={(e) => handleFormDataChange('motherContactNumber', e.target.value)}
                          className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.motherContactNumber ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                          name="motherContactNumber"
                          data-field="motherContactNumber"
                        />
                        {formErrors.motherContactNumber && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.motherContactNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Parents Address */}
                  <div>
                    <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                      Parents Address
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Parents' Complete Address"
                      value={formData.parentsAddress}
                      onChange={(e) => handleFormDataChange('parentsAddress', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-4 border border-red-200">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-4">Contact Person in Case of Emergency</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Emergency Contact Full Name"
                        value={formData.emergencyContactName}
                        onChange={(e) => handleFormDataChange('emergencyContactName', e.target.value)}
                        className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.emergencyContactName ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                          name="emergencyContactName"
                          data-field="emergencyContactName"
                        />
                        {formErrors.emergencyContactName && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.emergencyContactName}</p>
                        )}
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        placeholder="Enter Emergency Contact Number"
                        value={formData.emergencyContactNumber}
                        onChange={(e) => handleFormDataChange('emergencyContactNumber', e.target.value)}
                        className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.emergencyContactNumber ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                          name="emergencyContactNumber"
                          data-field="emergencyContactNumber"
                        />
                        {formErrors.emergencyContactNumber && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.emergencyContactNumber}</p>
                        )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Emergency Contact Address"
                      value={formData.emergencyContactAddress}
                      onChange={(e) => handleFormDataChange('emergencyContactAddress', e.target.value)}
                      className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.emergencyContactAddress ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                          name="emergencyContactAddress"
                          data-field="emergencyContactAddress"
                        />
                        {formErrors.emergencyContactAddress && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.emergencyContactAddress}</p>
                        )}
                  </div>
                </div>

                

                {/* Educational Background with Custom Calendar for Date Completed fields */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-4">Educational Background</h3>
                  
                  {/* Elementary */}
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-gray-800 mb-3">Elementary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          School Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Elementary School Name"
                          value={formData.elementary}
                          onChange={(e) => handleFormDataChange('elementary', e.target.value)}
                           className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.elementary ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                          name="elementary"
                          data-field="elementary"
                        />
                        {formErrors.elementary && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.elementary}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          Date Completed
                        </label>
                        <CustomCalendar
                          value={formData.elementaryDateCompleted}
                          onChange={(date) => handleFormDataChange('elementaryDateCompleted', date)}
                          placeholder="Select Completion Date"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Junior High School */}
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-gray-800 mb-3">Junior High School</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          School Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Junior High School Name"
                          value={formData.juniorHighSchool}
                          onChange={(e) => handleFormDataChange('juniorHighSchool', e.target.value)}
                          className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 ${formErrors.juniorHighSchool ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm`}
                          name="juniorHighSchool"
                          data-field="juniorHighSchool"
                        />
                        {formErrors.juniorHighSchool && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.juniorHighSchool}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          Date Completed
                        </label>
                        <CustomCalendar
                          value={formData.juniorHighDateCompleted}
                          onChange={(date) => handleFormDataChange('juniorHighDateCompleted', date)}
                          placeholder="Select Completion Date"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Senior High School */}
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-gray-800 mb-3">Senior High School</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          School Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Senior High School Name"
                          value={formData.seniorHighSchool}
                          onChange={(e) => handleFormDataChange('seniorHighSchool', e.target.value)}
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          Date Completed
                        </label>
                        <CustomCalendar
                          value={formData.seniorHighDateCompleted}
                          onChange={(date) => handleFormDataChange('seniorHighDateCompleted', date)}
                          placeholder="Select Completion Date"
                        />
                      </div>
                    </div>
                  </div>

                  {/* High School */}
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-gray-800 mb-3">High School (NON K-12 PROGRAM)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          School Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter High School Name"
                          value={formData.highSchoolNonK12}
                          onChange={(e) => handleFormDataChange('highSchoolNonK12', e.target.value)}
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          Date Completed
                        </label>
                        <CustomCalendar
                          value={formData.highSchoolNonK12DateCompleted}
                          onChange={(date) => handleFormDataChange('highSchoolNonK12DateCompleted', date)}
                          placeholder="Select Completion Date"
                          position="above"
                        />
                      </div>
                    </div>
                  </div>

                  {/* College (If Applicable) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        College (If Applicable)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter College/University Name"
                        value={formData.college}
                        onChange={(e) => handleFormDataChange('college', e.target.value)}
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Date Completed
                      </label>
                      <CustomCalendar
                        value={formData.collegeDateCompleted}
                        onChange={(date) => handleFormDataChange('collegeDateCompleted', date)}
                        placeholder="Select Completion Date"
                        position="above"
                      />
                    </div>
                  </div>
                  
                  {/* ID Photo and Signature Upload */}
                  <div className="mt-6 mb-4">
                    <h4 className="text-base font-semibold text-gray-800 mb-3">Identification Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ID Photo Upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 hover:border-[var(--dominant-red)] transition-all duration-300 flex flex-col">
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          ID Photo
                        </label>

                        {/* --- Instructions Added Here --- */}
                        <div className="text-xs text-gray-700 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="font-semibold mb-2">Please ensure your photo meets the following criteria:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Must have a <strong>plain white background</strong>.</li>
                            <li>Wear <strong>formal or business attire</strong> (e.g., collared shirt, blouse).</li>
                            <li>Photo must be recent, clear, and front-facing.</li>
                            <li>Face should be fully visible; no hats or sunglasses.</li>
                          </ul>
                        </div>
                        {/* --- End of Instructions --- */}

                        <div className="flex-grow flex flex-col items-center justify-center py-4">
                          {formData.idPhoto ? (
                            <div className="relative w-full">
                              <img 
                                src={URL.createObjectURL(formData.idPhoto)} 
                                alt="ID Preview" 
                                className="w-32 h-32 object-cover mx-auto rounded-lg shadow-md" 
                              />
                              <button 
                                onClick={() => handleFormDataChange('idPhoto', null)}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2 hover:bg-red-600 transition-colors"
                                style={{ right: 'calc(50% - 64px)' }} // Adjust position to be relative to the image
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-12 h-12 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600 text-center mb-2">Click or drag to upload</p>
                            </>
                          )}
                          <input 
                            type="file" 
                            id="idPhoto"
                            accept="image/png"
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                if (file.type !== 'image/png') {
                                  setValidationErrorMessage('Only PNG images are allowed for ID Photo');
                                  setShowValidationErrorModal(true);
                                  return;
                                }
                                if (file.size > 5 * 1024 * 1024) { // 5MB in bytes
                                  setValidationErrorMessage('ID Photo file size must be less than 5MB');
                                  setShowValidationErrorModal(true);
                                  return;
                                }
                                handleFormDataChange('idPhoto', file);
                              }
                            }}
                          />
                          <label 
                            htmlFor="idPhoto"
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-600 transition-colors"
                          >
                            {formData.idPhoto ? 'Replace Photo' : 'Select Photo'}
                          </label>
                        </div>
                        <p className="text-xs text-red-500 mt-2 text-center">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Only PNG format, maximum 5MB file size
                        </p>
                      </div>
                      
                      {/* Signature Upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 hover:border-[var(--dominant-red)] transition-all duration-300 flex flex-col">
                        <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                          Signature
                        </label>
                        <div className="flex-grow flex flex-col items-center justify-center py-4">
                          {formData.signature ? (
                            <div className="relative w-full">
                              <img 
                                src={URL.createObjectURL(formData.signature)} 
                                alt="Signature Preview" 
                                className="w-40 h-32 object-contain mx-auto rounded-lg bg-white p-2 shadow-md" 
                              />
                              <button 
                                onClick={() => handleFormDataChange('signature', null)}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2 hover:bg-red-600 transition-colors"
                                style={{ right: 'calc(50% - 80px)' }} // Adjust position to be relative to the image
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <FileSignature className="w-12 h-12 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600 text-center mb-2">(Optional) Click or drag to upload your signature</p>
                            </>
                          )}
                          <input 
                            type="file" 
                            id="signature"
                            accept="image/png"
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                if (file.type !== 'image/png') {
                                  setValidationErrorMessage('Only PNG images are allowed for Signature');
                                  setShowValidationErrorModal(true);
                                  return;
                                }
                                if (file.size > 5 * 1024 * 1024) { // 5MB in bytes
                                  setValidationErrorMessage('Signature file size must be less than 5MB');
                                  setShowValidationErrorModal(true);
                                  return;
                                }
                                handleFormDataChange('signature', file);
                              }
                            }}
                          />
                          <label 
                            htmlFor="signature"
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-600 transition-colors"
                          >
                            {formData.signature ? 'Replace Signature' : 'Select Signature'}
                          </label>
                        </div>
                        <p className="text-xs text-red-500 mt-2 text-center">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Only PNG format, maximum 5MB file size
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continue Button */}
                <div className="text-center pt-4">
                  <motion.button 
                    onClick={handleContinueToSubjectSetup}
                    className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 text-white px-8 py-3 rounded-2xl text-base font-bold heading-bold shadow-2xl hover:shadow-3xl flex items-center justify-center mx-auto group border-2 border-[var(--dominant-red)]"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue to Subject Setup
                    <ArrowRight className="text-[var(--dominant-red)] ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3 - Subject Setup */}
        {currentStep === 3 && (
          <motion.div 
            className="max-w-7xl mx-auto"
            variants={itemVariants}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 p-6 text-white">
                <h2 className="text-2xl font-bold heading-bold mb-2">Subject Setup</h2>
                <p className="text-red-100 text-sm">Select your subjects for enrollment</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Container - Available Subjects */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold heading-bold text-gray-900">Available Subjects</h3>
                      <button
                        onClick={handleAddAllSubjects}
                        disabled={isLoadingSubjects || !availableSubjects[currentSemesterFilter] || (availableSubjects[currentSemesterFilter] || []).length === 0}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center transition-colors ${isLoadingSubjects || !availableSubjects[currentSemesterFilter] || (availableSubjects[currentSemesterFilter] || []).length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'}`}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Add All Subjects
                      </button>
                    </div>

                    {/* Semester Filter */}
                    <div className="mb-4">
                      <div className="flex space-x-2 flex-wrap">
                        {Object.keys(availableSubjects).length > 0 ? (
                          Object.keys(availableSubjects).map((semester) => (
                            <button
                              key={semester}
                              onClick={() => setCurrentSemesterFilter(semester)}
                              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 mb-2 ${
                                currentSemesterFilter === semester
                                  ? 'bg-[var(--dominant-red)] text-white shadow-lg'
                                  : 'bg-white text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {semester}
                            </button>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            No semesters available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subjects List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {isLoadingSubjects ? (
                        <div className="flex justify-center items-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--dominant-red)]"></div>
                          <span className="ml-3 text-gray-600">Loading subjects...</span>
                        </div>
                      ) : subjectError ? (
                        <div className="text-center py-12">
                          <div className="text-red-500 mb-4">
                            <BookOpen className="w-12 h-12 mx-auto mb-2" />
                            <h3 className="text-lg font-semibold">Error Loading Subjects</h3>
                            <p className="text-sm">{subjectError}</p>
                          </div>
                          <button
                            onClick={() => fetchSubjectsByCourse(formData.courseId)}
                            className="bg-[var(--dominant-red)] text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : (availableSubjects[currentSemesterFilter] || []).length === 0 ? (
                        <div className="text-center py-12">
                          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No subjects found</h3>
                          <p className="text-gray-600">
                            No subjects are available for this semester.
                          </p>
                        </div>
                      ) : (availableSubjects[currentSemesterFilter] || []).map((subject) => (
                        <motion.div
                          key={subject.id}
                          className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-bold mr-2">
                                  {subject.code}
                                </span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-bold">
                                  {subject.units} units
                                </span>
                              </div>
                              <h4 className="font-semibold text-gray-900 text-sm mb-1">{subject.name}</h4>
                              <p className="text-xs text-gray-600">
                                Prerequisite: {subject.prerequisite}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAddSubject(subject)}
                              disabled={selectedSubjects.some(s => s.id === subject.id)}
                              className={`ml-4 px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                                selectedSubjects.some(s => s.id === subject.id)
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-[var(--dominant-red)] text-white hover:bg-red-600 shadow-lg hover:shadow-xl'
                              }`}
                            >
                              {selectedSubjects.some(s => s.id === subject.id) ? 'Added' : 'Add'}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Right Container - Selected Subjects */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold heading-bold text-gray-900">Selected Subjects</h3>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-bold">
                        Total: {getTotalUnits()} units
                      </div>
                    </div>

                    {selectedSubjects.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-semibold">No subjects selected</p>
                        <p className="text-gray-400 text-sm">Add subjects from the left panel</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedSubjects.map((subject) => (
                          <motion.div
                            key={subject.id}
                            className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
                            whileHover={{ y: -2 }}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-bold mr-2">
                                    {subject.code}
                                  </span>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-bold">
                                    {subject.units} units
                                  </span>
                                </div>
                                <h4 className="font-semibold text-gray-900 text-sm mb-1">{subject.name}</h4>
                                <p className="text-xs text-gray-600">
                                  Prerequisite: {subject.prerequisite}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveSubject(subject.id)}
                                className="ml-4 px-3 py-2 rounded-lg font-semibold text-sm bg-red-500 text-white hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                              >
                                Remove
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Continue Button */}
                    {selectedSubjects.length > 0 && (
                      <div className="mt-6 text-center">
                        <motion.button 
                          onClick={handleContinueToReview}
                          className="bg-gradient-to-r from-red-800 to-red-600 text-white px-8 py-3 rounded-2xl text-base font-bold heading-bold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center mx-auto group"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Continue to Review
                          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4 - Credential Review */}
        {currentStep === 4 && (
          <motion.div 
            className="max-w-6xl mx-auto"
            variants={itemVariants}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 p-6 text-white">
                <h2 className="text-2xl font-bold heading-bold mb-2">Review Your Information</h2>
                <p className="text-red-100 text-sm">Please review all your information before submitting your enrollment</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Enrollment Type & Course */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-3 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-[var(--dominant-red)]" />
                    Enrollment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Department/Course</label>
                      <p className="text-base font-semibold text-gray-900">{department || 'Not selected'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Enrollment Type</label>
                      <p className="text-base font-semibold text-gray-900">{enrollmentType || 'NEW'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">School Year</label>
                      <p className="text-base font-semibold text-gray-900">{formData.schoolYear || 'Not selected'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Semester</label>
                      <p className="text-base font-semibold text-gray-900">{formData.semester || 'Not selected'}</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-[var(--dominant-red)]" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Full Name</label>
                      <p className="text-base font-semibold text-gray-900">
                        {`${formData.firstName || ''} ${formData.middleName || ''} ${formData.lastName || ''}`.trim() || 'Not provided'}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Gender</label>
                      <p className="text-base font-semibold text-gray-900">{formData.gender || 'Not selected'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Birth Date</label>
                      <p className="text-base font-semibold text-gray-900">{formData.birthDate || 'Not selected'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Birth Place</label>
                      <p className="text-base font-semibold text-gray-900">{formData.birthPlace || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Nationality</label>
                      <p className="text-base font-semibold text-gray-900">{formData.nationality || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Civil Status</label>
                      <p className="text-base font-semibold text-gray-900">{formData.civilStatus || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm col-span-full">
                      <label className="text-xs font-bold text-gray-600">Address</label>
                      <p className="text-base font-semibold text-gray-900">{formData.address || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Contact Number</label>
                      <p className="text-base font-semibold text-gray-900">{formData.contactNumber || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Email Address</label>
                      <p className="text-base font-semibold text-gray-900">{formData.emailAddress || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Parent Information */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-200">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-[var(--dominant-red)]" />
                    Parent Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Father's Name</label>
                      <p className="text-base font-semibold text-gray-900">{formData.fatherName || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Father's Occupation</label>
                      <p className="text-base font-semibold text-gray-900">{formData.fatherOccupation || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Father's Contact</label>
                      <p className="text-base font-semibold text-gray-900">{formData.fatherContactNumber || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Mother's Name</label>
                      <p className="text-base font-semibold text-gray-900">{formData.motherName || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Mother's Occupation</label>
                      <p className="text-base font-semibold text-gray-900">{formData.motherOccupation || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Mother's Contact</label>
                      <p className="text-base font-semibold text-gray-900">{formData.motherContactNumber || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm col-span-full">
                      <label className="text-xs font-bold text-gray-600">Parents' Address</label>
                      <p className="text-base font-semibold text-gray-900">{formData.parentsAddress || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-4 border border-red-200">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-3 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-[var(--dominant-red)]" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Full Name</label>
                      <p className="text-base font-semibold text-gray-900">{formData.emergencyContactName || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Contact Number</label>
                      <p className="text-base font-semibold text-gray-900">{formData.emergencyContactNumber || 'Not provided'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm col-span-full">
                      <label className="text-xs font-bold text-gray-600">Address</label>
                      <p className="text-base font-semibold text-gray-900">{formData.emergencyContactAddress || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Educational Background */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-3 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-[var(--dominant-red)]" />
                    Educational Background
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Elementary</label>
                      <p className="text-base font-semibold text-gray-900">{formData.elementary || 'Not provided'} ({formData.elementaryDateCompleted || 'N/A'})</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Junior High School</label>
                      <p className="text-base font-semibold text-gray-900">{formData.juniorHighSchool || 'Not provided'} ({formData.juniorHighDateCompleted || 'N/A'})</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Senior High School</label>
                      <p className="text-base font-semibold text-gray-900">{formData.seniorHighSchool || 'Not provided'} ({formData.seniorHighDateCompleted || 'N/A'})</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">High School (Non K-12)</label>
                      <p className="text-base font-semibold text-gray-900">{formData.highSchoolNonK12 || 'Not provided'} ({formData.highSchoolNonK12DateCompleted || 'N/A'})</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">College</label>
                      <p className="text-base font-semibold text-gray-900">{formData.college || 'Not provided'} ({formData.collegeDateCompleted || 'N/A'})</p>
                    </div>
                  </div>
                </div>

                {/* Identification Documents */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 mt-4">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-3 flex items-center">
                    <FileSignature className="w-5 h-5 mr-2 text-[var(--dominant-red)]" />
                    Identification Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">ID Photo</label>
                      {formData.idPhoto ? (
                        <div className="mt-2">
                          <img 
                            src={URL.createObjectURL(formData.idPhoto)} 
                            alt="ID Preview" 
                            className="w-32 h-32 object-cover rounded-lg shadow-md mx-auto" 
                          />
                        </div>
                      ) : (
                        <p className="text-base font-semibold text-gray-900 mt-2">Not uploaded</p>
                      )}
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-600">Signature</label>
                      {formData.signature ? (
                        <div className="mt-2">
                          <img 
                            src={URL.createObjectURL(formData.signature)} 
                            alt="Signature Preview" 
                            className="w-32 h-32 object-contain rounded-lg shadow-md mx-auto bg-white" 
                          />
                        </div>
                      ) : (
                        <p className="text-base font-semibold text-gray-900 mt-2">Not uploaded</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selected Subjects */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-200">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-3 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-[var(--dominant-red)]" />
                    Selected Subjects ({getTotalUnits()} total units)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedSubjects.map((subject) => (
                      <div key={subject.id} className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md text-xs font-bold">
                            {subject.code}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md text-xs font-bold">
                            {subject.units} units
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm">{subject.name}</h4>
                        <p className="text-xs text-gray-600">Prerequisite: {subject.prerequisite}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirmation Section */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <input
                        type="checkbox"
                        id="dataConfirmation"
                        checked={isDataConfirmed}
                        onChange={(e) => setIsDataConfirmed(e.target.checked)}
                        className="w-5 h-5 text-[var(--dominant-red)] bg-gray-100 border-gray-300 rounded focus:ring-[var(--dominant-red)] focus:ring-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="dataConfirmation" className="text-gray-900 font-semibold cursor-pointer">
                        I confirm that all the information provided above is accurate and complete.
                      </label>
                      <p className="text-sm text-gray-600 mt-2">
                        Please review all your information carefully. Once submitted, changes may require additional processing time. 
                        Make sure your contact information is correct as we will use it to communicate important updates about your enrollment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center pt-4">
                  <motion.button 
                    disabled={!isDataConfirmed || isSubmitting}
                    className={`px-8 py-3 rounded-2xl text-base font-bold heading-bold shadow-2xl transition-all duration-300 flex items-center justify-center mx-auto group ${
                      isDataConfirmed && !isSubmitting
                        ? 'bg-gradient-to-r from-[var(--dominant-red)] to-red-600 text-white hover:shadow-3xl cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    whileHover={isDataConfirmed && !isSubmitting ? { scale: 1.05, y: -2 } : {}}
                    whileTap={isDataConfirmed && !isSubmitting ? { scale: 0.98 } : {}}
                    onClick={handleSubmitEnrollment}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2">Submitting</span>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      </>
                    ) : (
                      <>
                        Submit Enrollment
                        <CheckCircle className={`ml-2 w-5 h-5 transition-transform ${
                          isDataConfirmed ? 'group-hover:scale-110' : ''
                        }`} />
                      </>
                    )}
                  </motion.button>
                  {!isDataConfirmed && (
                    <p className="text-sm text-gray-500 mt-2">
                      Please confirm that your information is correct to enable submission
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Department Modal */}
      <CourseChoicesModal
        isOpen={isCourseChoicesModalOpen}
        onClose={handleCloseCourseChoicesModal}
        onSelectCourse={handleDepartmentSelect}
      />
      
      {/* Enrollment Confirmation Modal */}
      <EnrollmentConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => {
          setIsConfirmationModalOpen(false);
          // Only navigate back to landing page if enrollment was successful (no error)
          if (!submissionError) {
            onBack(); // Navigate back to landing page
          }
        }}
        enrollmentCode={enrollmentCode}
        isLoading={isSubmitting}
        error={submissionError}
      />
      
      {/* Validation Error Modal */}
      <ValidationErrorModal
        isOpen={showValidationErrorModal}
        onClose={() => setShowValidationErrorModal(false)}
        message={validationErrorMessage}
      />
    </div>
  );
};

export default EnrollmentPage;

