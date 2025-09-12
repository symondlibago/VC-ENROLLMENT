import React, { useState } from 'react';
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
  MapPin
} from 'lucide-react';
import CustomCalendar from '../layout/CustomCalendar';
import DepartmentModal from '../modals/DepartmentModal';

const EnrollmentPage = ({ onBack }) => {
  const [department, setDepartment] = useState('');
  const [enrollmentType, setEnrollmentType] = useState('');
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isEnrollmentTypeOpen, setIsEnrollmentTypeOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 2 dropdown states
  const [isSchoolYearOpen, setIsSchoolYearOpen] = useState(false);
  const [isSemesterOpen, setIsSemesterOpen] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);

  // Second step form data
  const [formData, setFormData] = useState({
    // Basic Information
    course: '',
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
    collegeDateCompleted: ''
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

  const handleDepartmentSelect = (course) => {
    setDepartment(course.course_name);
    setIsDepartmentModalOpen(false);
  };

  const handleOpenDepartmentModal = () => {
    setIsDepartmentModalOpen(true);
  };

  const handleCloseDepartmentModal = () => {
    setIsDepartmentModalOpen(false);
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

  const handleGenderSelect = (gender) => {
    handleFormDataChange('gender', gender);
    setIsGenderOpen(false);
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleContinueEnrollment = () => {
    setCurrentStep(2);
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
        {onBack && (
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
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-12"
          variants={itemVariants}
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--dominant-red)] to-red-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-[var(--dominant-red)] font-bold text-sm">VIPC</span>
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
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step <= currentStep 
                    ? 'bg-[var(--dominant-red)] text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
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
                    Select Department
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      placeholder="Click to select department"
                      value={department}
                      onClick={handleOpenDepartmentModal}
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
                        {enrollmentType || 'NEW'}
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
                    className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 text-white px-8 py-3 rounded-2xl text-base font-bold heading-bold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center mx-auto group"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue Enrollment
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                  <h3 className="text-lg font-bold heading-bold text-gray-900 mb-4">Academic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-800 text-sm font-bold heading-bold mb-2">
                        Semester
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg text-sm"
                          onClick={() => setIsSemesterOpen(!isSemesterOpen)}
                        >
                          <span className="font-semibold">
                            {formData.semester || 'Select Semester'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-[var(--dominant-red)] transition-transform duration-300 ${isSemesterOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
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
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg text-sm"
                          onClick={() => setIsSchoolYearOpen(!isSchoolYearOpen)}
                        >
                          <span className="font-semibold">
                            {formData.schoolYear || 'Select School Year'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-[var(--dominant-red)] transition-transform duration-300 ${isSchoolYearOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
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
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                      />
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
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                      />
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
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                      />
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
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg text-sm"
                          onClick={() => setIsGenderOpen(!isGenderOpen)}
                        >
                          <span className="font-semibold">
                            {formData.gender || 'Select Gender'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-[var(--dominant-red)] transition-transform duration-300 ${isGenderOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
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
                      <CustomCalendar
                        value={formData.birthDate}
                        onChange={(date) => handleFormDataChange('birthDate', date)}
                        placeholder="Select Birth Date"
                      />
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
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                      />
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
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                      />
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
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                      />
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
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                    />
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
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                      />
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
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                      />
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
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                        />
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
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                        />
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
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                        />
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
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                        />
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
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                        />
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
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                        />
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
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                      />
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
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                      />
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
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                    />
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
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                        />
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
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 text-sm"
                        />
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
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center pt-4">
                  <motion.button 
                    className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 text-white px-8 py-3 rounded-2xl text-base font-bold heading-bold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center mx-auto group"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Submit Enrollment Form
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Department Modal */}
      <DepartmentModal
        isOpen={isDepartmentModalOpen}
        onClose={handleCloseDepartmentModal}
        onSelectCourse={handleDepartmentSelect}
      />
    </div>
  );
};

export default EnrollmentPage;

