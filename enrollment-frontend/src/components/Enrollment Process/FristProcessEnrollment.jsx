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

const EnrollmentPage = ({ onBack }) => {
  const [department, setDepartment] = useState('');
  const [enrollmentType, setEnrollmentType] = useState('');
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [isEnrollmentTypeOpen, setIsEnrollmentTypeOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 2 dropdown states
  const [isSchoolYearOpen, setIsSchoolYearOpen] = useState(false);
  const [isSemesterOpen, setIsSemesterOpen] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [isGradeLevelOpen, setIsGradeLevelOpen] = useState(false);
  const [isScholarshipTypeOpen, setIsScholarshipTypeOpen] = useState(false);

  // Second step form data
  const [formData, setFormData] = useState({
    schoolYear: '',
    semester: '',
    idNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    course: '',
    gradeLevel: '',
    birthDate: '',
    address: '',
    scholarshipType: '',
    religion: '',
    nationality: '',
    ethnicity: '',
    civilStatus: '',
    schoolGraduated: '',
    emailAddress: '',
    contactNumber: '',
    isVaccinated: '',
    vaccinationReason: '',
    philHealthRegistered: '',
    // Requirements
    requirements: {
      newStudents: {
        form137: false,
        psaBirthCertificate: false,
        psaMarriageCertificate: false
      },
      transferees: {
        honorableDismissal: false,
        transcriptOfRecords: false
      },
      foreignStudents: {
        acrNumber: false,
        passportNumber: false,
        philippinePassport: false,
        otherRequirements: false
      }
    },
    // Special needs
    specialNeeds: {
      professionalAssessment: '',
      noDifficulties: false,
      difficulties: {
        seeing: false,
        hearing: false,
        mobility: false,
        communicating: false,
        remembering: false,
        socialInteractions: false
      },
      otherConcerns: '',
      receivingSupport: '',
      supportType: '',
      educationalHistory: ''
    }
  });

  const departments = [
    'Higher Education Department / Graduate School',
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
  const courses = [
    'BS Computer Science',
    'BS Information Technology', 
    'BS Business Administration',
    'BS Education',
    'BS Nursing'
  ];
  const gradeLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const scholarshipTypes = [
    'Academic Scholarship',
    'Athletic Scholarship', 
    'Need-based Scholarship',
    'No Scholarship'
  ];

  const handleDepartmentSelect = (dept) => {
    setDepartment(dept);
    setIsDepartmentOpen(false);
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

  const handleGradeLevelSelect = (level) => {
    handleFormDataChange('gradeLevel', level);
    setIsGradeLevelOpen(false);
  };

  const handleScholarshipTypeSelect = (type) => {
    handleFormDataChange('scholarshipType', type);
    setIsScholarshipTypeOpen(false);
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

  const handleRequirementChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [category]: {
          ...prev.requirements[category],
          [field]: value
        }
      }
    }));
  };

  const handleSpecialNeedsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      specialNeeds: {
        ...prev.specialNeeds,
        [field]: value
      }
    }));
  };

  const handleDifficultyChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      specialNeeds: {
        ...prev.specialNeeds,
        difficulties: {
          ...prev.specialNeeds.difficulties,
          [field]: value
        }
      }
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
          <h1 className="text-4xl md:text-6xl font-bold heading-bold text-gray-900 mb-4">
            Welcome to
            <span className="text-[var(--dominant-red)] block">VIPC Enrollment</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Vineyard International Polytechnic College
            <br />
            <span className="text-lg">1st Semester, School Year 2025 - 2026</span>
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
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
step <= currentStep 
                    ? 'bg-[var(--dominant-red)] text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? <CheckCircle className="w-6 h-6" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
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
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 liquid-hover cursor-pointer"
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold heading-bold text-gray-900 ml-3">Download</h3>
            </div>
            <p className="text-gray-600 mb-4">Get your enrollment prospectus and requirements</p>
            <button className="text-[var(--dominant-red)] font-semibold hover:underline">
              Download Prospectus →
            </button>
          </motion.div>

          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 liquid-hover cursor-pointer"
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold heading-bold text-gray-900 ml-3">Check Status</h3>
            </div>
            <p className="text-gray-600 mb-4">Track your enrollment application progress</p>
            <button className="text-[var(--dominant-red)] font-semibold hover:underline">
              Check Status →
            </button>
          </motion.div>

          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 liquid-hover cursor-pointer"
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold heading-bold text-gray-900 ml-3">Schedule</h3>
            </div>
            <p className="text-gray-600 mb-4">View important dates and deadlines</p>
            <button className="text-[var(--dominant-red)] font-semibold hover:underline">
              View Schedule →
            </button>
          </motion.div>
        </motion.div>

        {/* Important Announcements */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
          variants={itemVariants}
        >
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 border-l-4 border-amber-400 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold heading-bold text-gray-900 ml-4">Class Schedule</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <span className="font-semibold text-gray-800">K to 10 & Senior High</span>
                <span className="text-amber-700 font-bold">June 16, 2025</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <span className="font-semibold text-gray-800">College Programs</span>
                <span className="text-amber-700 font-bold">June 30, 2025</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <span className="font-semibold text-gray-800">Graduate School</span>
                <span className="text-amber-700 font-bold">July 5, 2025</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border-l-4 border-emerald-400 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-emerald-400 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold heading-bold text-gray-900 ml-4">Payment Info</h3>
            </div>
            <div className="text-center">
              <div className="bg-white/70 rounded-xl p-6 mb-4">
                <div className="text-3xl font-bold text-emerald-700 mb-2">₱500.00</div>
                <p className="text-gray-700 font-semibold">Minimum Downpayment</p>
                <p className="text-sm text-gray-600 mt-1">For College & Graduate Students</p>
              </div>
              <button className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors shadow-lg">
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
              <div className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 p-8 text-white">
                <h2 className="text-3xl font-bold heading-bold mb-2">Start Your Enrollment</h2>
                <p className="text-red-100">Choose your department and enrollment type to begin</p>
              </div>

              <div className="p-8 space-y-8">
                {/* Department Selection */}
                <div>
                  <label className="block text-gray-800 text-xl font-bold heading-bold mb-4 flex items-center">
                    <BookOpen className="w-6 h-6 mr-3 text-[var(--dominant-red)]" />
                    Select Department
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg"
                      onClick={() => setIsDepartmentOpen(!isDepartmentOpen)}
                    >
                      <span className="font-semibold">
                        {department || 'Higher Education Department / Graduate School'}
                      </span>
                      <ChevronDown className={`w-6 h-6 text-[var(--dominant-red)] transition-transform duration-300 ${isDepartmentOpen ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                    <AnimatePresence>
                      {isDepartmentOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute z-20 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-2xl mt-2 max-h-80 overflow-auto"
                        >
                          {departments.map((dept, index) => (
                            <motion.div
                              key={dept}
                              className="px-6 py-4 hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white cursor-pointer transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 font-medium"
                              onClick={() => handleDepartmentSelect(dept)}
                              whileHover={{ x: 5 }}
                            >
                              {dept}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Enrollment Type Selection */}
                <div>
                  <label className="block text-gray-800 text-xl font-bold heading-bold mb-4 flex items-center">
                    <Users className="w-6 h-6 mr-3 text-[var(--dominant-red)]" />
                    Enrollment Type
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg"
                      onClick={() => setIsEnrollmentTypeOpen(!isEnrollmentTypeOpen)}
                    >
                      <span className="font-semibold">
                        {enrollmentType || 'NEW'}
                      </span>
                      <ChevronDown className={`w-6 h-6 text-[var(--dominant-red)] transition-transform duration-300 ${isEnrollmentTypeOpen ? 'rotate-180' : 'rotate-0'}`} />
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
                              className="px-6 py-4 hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white cursor-pointer transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 font-medium"
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

                {/* Proceed Button */}
                <div className="text-center pt-6">
                  <motion.button 
                    onClick={handleContinueEnrollment}
                    className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 text-white px-12 py-4 rounded-2xl text-xl font-bold heading-bold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center mx-auto group"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue Enrollment
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
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
              <div className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 p-8 text-white">
                <h2 className="text-3xl font-bold heading-bold mb-2">
                  Enrollment Form for {department || 'Higher Education / Graduate School'} ({enrollmentType || 'New'} / Transferee / Returnee Student)
                </h2>
                <p className="text-red-100">Please fill out all required information</p>
              </div>

              <div className="p-8 space-y-8">
                {/* School Year and Semester */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Select School Year
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg"
                        onClick={() => setIsSchoolYearOpen(!isSchoolYearOpen)}
                      >
                        <span className="font-semibold">
                          {formData.schoolYear || 'Select School Year'}
                        </span>
                        <ChevronDown className={`w-6 h-6 text-[var(--dominant-red)] transition-transform duration-300 ${isSchoolYearOpen ? 'rotate-180' : 'rotate-0'}`} />
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
                                className="px-6 py-4 hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white cursor-pointer transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 font-medium"
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
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Select Semester
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg"
                        onClick={() => setIsSemesterOpen(!isSemesterOpen)}
                      >
                        <span className="font-semibold">
                          {formData.semester || 'Select Semester'}
                        </span>
                        <ChevronDown className={`w-6 h-6 text-[var(--dominant-red)] transition-transform duration-300 ${isSemesterOpen ? 'rotate-180' : 'rotate-0'}`} />
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
                                className="px-6 py-4 hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white cursor-pointer transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 font-medium"
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
                </div>

                {/* ID Number for Old Students */}
                {enrollmentType === 'Old' && (
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Enter ID Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter ID Number (SXX-XXXX)"
                      value={formData.idNumber}
                      onChange={(e) => handleFormDataChange('idNumber', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    />
                  </div>
                )}

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter First Name"
                      value={formData.firstName}
                      onChange={(e) => handleFormDataChange('firstName', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Middle Name"
                      value={formData.middleName}
                      onChange={(e) => handleFormDataChange('middleName', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleFormDataChange('lastName', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Course, Grade Level, Birth Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Course
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg"
                        onClick={() => setIsCourseOpen(!isCourseOpen)}
                      >
                        <span className="font-semibold">
                          {formData.course || 'Select Course'}
                        </span>
                        <ChevronDown className={`w-6 h-6 text-[var(--dominant-red)] transition-transform duration-300 ${isCourseOpen ? 'rotate-180' : 'rotate-0'}`} />
                      </button>
                      <AnimatePresence>
                        {isCourseOpen && (
                          <motion.div
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute z-20 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-2xl mt-2 max-h-80 overflow-auto"
                          >
                            {courses.map((course, index) => (
                              <motion.div
                                key={course}
                                className="px-6 py-4 hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white cursor-pointer transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 font-medium"
                                onClick={() => handleCourseSelect(course)}
                                whileHover={{ x: 5 }}
                              >
                                {course}
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Grade Level for the Incoming School Year
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg"
                        onClick={() => setIsGradeLevelOpen(!isGradeLevelOpen)}
                      >
                        <span className="font-semibold">
                          {formData.gradeLevel || '(1st) First Year'}
                        </span>
                        <ChevronDown className={`w-6 h-6 text-[var(--dominant-red)] transition-transform duration-300 ${isGradeLevelOpen ? 'rotate-180' : 'rotate-0'}`} />
                      </button>
                      <AnimatePresence>
                        {isGradeLevelOpen && (
                          <motion.div
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute z-20 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-2xl mt-2 max-h-80 overflow-auto"
                          >
                            {gradeLevels.map((level, index) => (
                              <motion.div
                                key={level}
                                className="px-6 py-4 hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white cursor-pointer transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 font-medium"
                                onClick={() => handleGradeLevelSelect(level)}
                                whileHover={{ x: 5 }}
                              >
                                {level}
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleFormDataChange('birthDate', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                    Address
                  </label>
                  <textarea
                    placeholder="Enter Address"
                    value={formData.address}
                    onChange={(e) => handleFormDataChange('address', e.target.value)}
                    rows={3}
                    className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 resize-none"
                  />
                </div>

                {/* Scholarship Type */}
                <div>
                  <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                    Scholarship Type
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-left text-gray-800 flex justify-between items-center focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg"
                      onClick={() => setIsScholarshipTypeOpen(!isScholarshipTypeOpen)}
                    >
                      <span className="font-semibold">
                        {formData.scholarshipType || 'Select Scholarship Type'}
                      </span>
                      <ChevronDown className={`w-6 h-6 text-[var(--dominant-red)] transition-transform duration-300 ${isScholarshipTypeOpen ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                    <AnimatePresence>
                      {isScholarshipTypeOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute z-20 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-2xl mt-2 max-h-80 overflow-auto"
                        >
                          {scholarshipTypes.map((type, index) => (
                            <motion.div
                              key={type}
                              className="px-6 py-4 hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white cursor-pointer transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 font-medium"
                              onClick={() => handleScholarshipTypeSelect(type)}
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

                {/* Requirements Section - Hidden for Old Students */}
                {enrollmentType !== 'Old' && (
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold heading-bold text-gray-900 mb-6">
                      Select Requirements on Hand (to be submitted later)
                    </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* For New Students */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4">For New Students</h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requirements.newStudents.form137}
                            onChange={(e) => handleRequirementChange('newStudents', 'form137', e.target.checked)}
                            className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                          />
                          <span className="text-gray-700">Form 137 (Report Card)</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requirements.newStudents.psaBirthCertificate}
                            onChange={(e) => handleRequirementChange('newStudents', 'psaBirthCertificate', e.target.checked)}
                            className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                          />
                          <span className="text-gray-700">PSA Birth Certificate</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requirements.newStudents.psaMarriageCertificate}
                            onChange={(e) => handleRequirementChange('newStudents', 'psaMarriageCertificate', e.target.checked)}
                            className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                          />
                          <span className="text-gray-700">PSA Marriage Certificate (if married)</span>
                        </label>
                      </div>
                    </div>

                    {/* For Transferees */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4">For Transferees</h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requirements.transferees.honorableDismissal}
                            onChange={(e) => handleRequirementChange('transferees', 'honorableDismissal', e.target.checked)}
                            className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                          />
                          <span className="text-gray-700">Honorable Dismissal</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requirements.transferees.transcriptOfRecords}
                            onChange={(e) => handleRequirementChange('transferees', 'transcriptOfRecords', e.target.checked)}
                            className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                          />
                          <span className="text-gray-700">Transcript of Records</span>
                        </label>
                      </div>
                    </div>

                    {/* For Foreign Students */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4">For Foreign Students</h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requirements.foreignStudents.acrNumber}
                            onChange={(e) => handleRequirementChange('foreignStudents', 'acrNumber', e.target.checked)}
                            className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                          />
                          <span className="text-gray-700">ACR Number</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requirements.foreignStudents.passportNumber}
                            onChange={(e) => handleRequirementChange('foreignStudents', 'passportNumber', e.target.checked)}
                            className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                          />
                          <span className="text-gray-700">Passport Number</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requirements.foreignStudents.philippinePassport}
                            onChange={(e) => handleRequirementChange('foreignStudents', 'philippinePassport', e.target.checked)}
                            className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                          />
                          <span className="text-gray-700">Philippine Passport</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requirements.foreignStudents.otherRequirements}
                            onChange={(e) => handleRequirementChange('foreignStudents', 'otherRequirements', e.target.checked)}
                            className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                          />
                          <span className="text-gray-700">Other requirements not mentioned, check this and submit it to registrar@lccdo.edu.ph</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Religion
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Religion"
                      value={formData.religion}
                      onChange={(e) => handleFormDataChange('religion', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Nationality
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Nationality"
                      value={formData.nationality}
                      onChange={(e) => handleFormDataChange('nationality', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Ethnicity
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Ethnicity"
                      value={formData.ethnicity}
                      onChange={(e) => handleFormDataChange('ethnicity', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Civil Status
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Civil Status"
                      value={formData.civilStatus}
                      onChange={(e) => handleFormDataChange('civilStatus', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                    School From / Graduated
                  </label>
                  <input
                    type="text"
                    placeholder="Enter School Graduated"
                    value={formData.schoolGraduated}
                    onChange={(e) => handleFormDataChange('schoolGraduated', e.target.value)}
                    className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="Enter Email Address"
                      value={formData.emailAddress}
                      onChange={(e) => handleFormDataChange('emailAddress', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    />
                    <p className="text-sm text-gray-600 mt-2 italic">
                      Disclaimer: Due to service provider limitations, only GMAIL accounts are accepted. Any other email providers may unsuccessfully sent.
                    </p>
                  </div>
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter Contact Number"
                      value={formData.contactNumber}
                      onChange={(e) => handleFormDataChange('contactNumber', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Vaccination Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      Are you vaccinated?
                    </label>
                    <select
                      value={formData.isVaccinated}
                      onChange={(e) => handleFormDataChange('isVaccinated', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    >
                      <option value="">Select Answer</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                      If not vaccinated, please state your reason here
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Reason if not Vaccinated"
                      value={formData.vaccinationReason}
                      onChange={(e) => handleFormDataChange('vaccinationReason', e.target.value)}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                    Have you registered to PhilHealth?
                  </label>
                  <select
                    value={formData.philHealthRegistered}
                    onChange={(e) => handleFormDataChange('philHealthRegistered', e.target.value)}
                    className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                  >
                    <option value="">Select Answer</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Special Needs Section */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold heading-bold text-gray-900 mb-4">
                    Special Needs and Support Services
                  </h3>
                  <p className="text-gray-700 mb-6">
                    Please read and answer all questions to the best of your ability. It is important that all information provided is accurate and truthful. The information you will provide will help us understand your needs so we can assist you effectively. Concealing information or disseminating misleading information may impede our capacity to serve you efficiently.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-gray-800 font-semibold mb-4">
                        To better understand and assist with your needs, please indicate if there are concerns or difficulties you can identify.
                      </p>
                      
                      <div className="mb-4">
                        <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                          Have the psychological/behavioral concerns you identified been assessed by a professional such as a Counselor, Psychologist, Psychiatrist, or Developmental Pediatrician?
                        </label>
                        <select
                          value={formData.specialNeeds.professionalAssessment}
                          onChange={(e) => handleSpecialNeedsChange('professionalAssessment', e.target.value)}
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                        >
                          <option value="">Select Answer</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.specialNeeds.noDifficulties}
                            onChange={(e) => handleSpecialNeedsChange('noDifficulties', e.target.checked)}
                            className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                          />
                          <span className="text-gray-700">I don't have any difficulties in any of the following</span>
                        </label>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-800 font-semibold mb-3">
                          If there are difficulties, please check applicable concerns:
                        </p>
                        <div className="space-y-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.specialNeeds.difficulties.seeing}
                              onChange={(e) => handleDifficultyChange('seeing', e.target.checked)}
                              className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                            />
                            <span className="text-gray-700">Difficulty in Seeing</span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.specialNeeds.difficulties.hearing}
                              onChange={(e) => handleDifficultyChange('hearing', e.target.checked)}
                              className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                            />
                            <span className="text-gray-700">Difficulty in Hearing</span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.specialNeeds.difficulties.mobility}
                              onChange={(e) => handleDifficultyChange('mobility', e.target.checked)}
                              className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                            />
                            <span className="text-gray-700">Difficulty in mobility (Walking or using of crutches/canes)</span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.specialNeeds.difficulties.communicating}
                              onChange={(e) => handleDifficultyChange('communicating', e.target.checked)}
                              className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                            />
                            <span className="text-gray-700">Difficulty in Communicating (understanding spoken or written language, following instructions, or comprehending social cues)</span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.specialNeeds.difficulties.remembering}
                              onChange={(e) => handleDifficultyChange('remembering', e.target.checked)}
                              className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                            />
                            <span className="text-gray-700">Difficulty in Remembering, Concentrating, Paying Attention and Understanding Concepts</span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.specialNeeds.difficulties.socialInteractions}
                              onChange={(e) => handleDifficultyChange('socialInteractions', e.target.checked)}
                              className="w-5 h-5 accent-[var(--dominant-red)] border-2 border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                            />
                            <span className="text-gray-700">Difficulty in understanding, managing, expressing feelings appropriately and regulating social interactions</span>
                          </label>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                          Other specific physical/psychological/behavioral concerns (please describe)
                        </label>
                        <textarea
                          placeholder="Enter other details here if not mentioned above"
                          value={formData.specialNeeds.otherConcerns}
                          onChange={(e) => handleSpecialNeedsChange('otherConcerns', e.target.value)}
                          rows={3}
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 resize-none"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                          Are you currently receiving any support services based on your identified concerns?
                        </label>
                        <select
                          value={formData.specialNeeds.receivingSupport}
                          onChange={(e) => handleSpecialNeedsChange('receivingSupport', e.target.value)}
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300"
                        >
                          <option value="">Select Answer</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                          If yes, identify the type of support
                        </label>
                        <textarea
                          placeholder="Enter support services received (if yes)"
                          value={formData.specialNeeds.supportType}
                          onChange={(e) => handleSpecialNeedsChange('supportType', e.target.value)}
                          rows={3}
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-800 text-lg font-bold heading-bold mb-3">
                          Is there any other information regarding your educational or developmental history that the school should be aware of?
                        </label>
                        <textarea
                          placeholder="Enter other information regarding your educational or development history here"
                          value={formData.specialNeeds.educationalHistory}
                          onChange={(e) => handleSpecialNeedsChange('educationalHistory', e.target.value)}
                          rows={3}
                          className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-4 px-6 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <motion.button 
                    onClick={() => setCurrentStep(1)}
                    className="bg-gray-500 text-white px-8 py-3 rounded-2xl text-lg font-bold heading-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center group"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowLeft className="mr-3 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back
                  </motion.button>
                  <motion.button 
                    className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 text-white px-12 py-3 rounded-2xl text-lg font-bold heading-bold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center group"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue Enrollment
                    <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default EnrollmentPage;

