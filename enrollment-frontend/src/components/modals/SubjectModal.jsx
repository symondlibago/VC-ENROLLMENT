import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SubjectModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  subject = null,
  course = null,
  isLoading = false
}) => {
  // Form state
  const [formData, setFormData] = useState({
    subject_code: '',
    descriptive_title: '',
    lec_hrs: 0,
    lab_hrs: 0,
    total_units: 0,
    year: '1st Year',
    semester: '1st Semester',
    course_id: '',
    number_of_hours: 0,
    pre_req: ''
  });

  // Validation state
  const [errors, setErrors] = useState({});
  
  // Year and semester options
  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Summer'];
  const semesterOptions = ['1st Semester', '2nd Semester'];
  
  // Dropdown state
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);

  // Animation variants
  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  // Initialize form data when subject or course changes
  useEffect(() => {
    if (isOpen) {
      if (subject) {
        // Edit mode - populate form with subject data
        setFormData({
          subject_code: subject.subject_code || '',
          descriptive_title: subject.descriptive_title || '',
          lec_hrs: subject.lec_hrs || 0,
          lab_hrs: subject.lab_hrs || 0,
          total_units: subject.total_units || 0,
          year: subject.year || '1st Year',
          semester: subject.semester || '1st Semester',
          course_id: subject.course_id || (course ? course.id : ''),
          number_of_hours: subject.number_of_hours || 0,
          pre_req: subject.pre_req || ''
        });
      } else {
        // Create mode - initialize with defaults and course_id if available
        setFormData({
          subject_code: '',
          descriptive_title: '',
          lec_hrs: 0,
          lab_hrs: 0,
          total_units: 0,
          year: '1st Year',
          semester: '1st Semester',
          course_id: course ? course.id : '',
          number_of_hours: 0,
          pre_req: ''
        });
      }
      // Clear errors
      setErrors({});
    }
  }, [isOpen, subject, course]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.subject_code.trim()) {
      newErrors.subject_code = 'Subject code is required';
    }
    
    if (!formData.descriptive_title.trim()) {
      newErrors.descriptive_title = 'Descriptive title is required';
    }
    
    if (!formData.year) {
      newErrors.year = 'Year is required';
    }
    
    if (!formData.semester) {
      newErrors.semester = 'Semester is required';
    }
    
    if (!formData.course_id) {
      newErrors.course_id = 'Course is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData, subject ? subject.id : null);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {subject ? 'Edit Subject' : 'Add Subject'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Subject Code */}
                <div className="space-y-2">
                  <Label htmlFor="subject_code" className="text-sm font-medium text-gray-700">
                    Subject Code *
                  </Label>
                  <Input
                    id="subject_code"
                    type="text"
                    value={formData.subject_code}
                    onChange={(e) => handleInputChange('subject_code', e.target.value)}
                    placeholder="Enter subject code"
                    disabled={isLoading}
                    className={`
                      w-full px-3 py-2 text-left bg-white border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                      liquid-morph
                      ${errors.subject_code ? 'border-red-500' : 'border-gray-300'}
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                    `}
                  />
                  {errors.subject_code && (
                    <p className="text-sm text-red-600">{errors.subject_code}</p>
                  )}
                </div>

                {/* Descriptive Title */}
                <div className="space-y-2">
                  <Label htmlFor="descriptive_title" className="text-sm font-medium text-gray-700">
                    Descriptive Title *
                  </Label>
                  <Input
                    id="descriptive_title"
                    type="text"
                    value={formData.descriptive_title}
                    onChange={(e) => handleInputChange('descriptive_title', e.target.value)}
                    placeholder="Enter descriptive title"
                    disabled={isLoading}
                    className={`
                      w-full px-3 py-2 text-left bg-white border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                      liquid-morph
                      ${errors.descriptive_title ? 'border-red-500' : 'border-gray-300'}
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                    `}
                  />
                  {errors.descriptive_title && (
                    <p className="text-sm text-red-600">{errors.descriptive_title}</p>
                  )}
                </div>

                {/* Hours and Units */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Lecture Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="lec_hrs" className="text-sm font-medium text-gray-700">
                      Lecture Hours *
                    </Label>
                    <Input
                      id="lec_hrs"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.lec_hrs}
                      onChange={(e) => handleInputChange('lec_hrs', e.target.value)}
                      placeholder="0"
                      disabled={isLoading}
                      className={`
                        w-full px-3 py-2 text-left bg-white border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                        liquid-morph
                        ${errors.lec_hrs ? 'border-red-500' : 'border-gray-300'}
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                      `}
                    />
                    {errors.lec_hrs && (
                      <p className="text-sm text-red-600">{errors.lec_hrs}</p>
                    )}
                  </div>

                  {/* Laboratory Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="lab_hrs" className="text-sm font-medium text-gray-700">
                      Laboratory Hours *
                    </Label>
                    <Input
                      id="lab_hrs"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.lab_hrs}
                      onChange={(e) => handleInputChange('lab_hrs', e.target.value)}
                      placeholder="0"
                      disabled={isLoading}
                      className={`
                        w-full px-3 py-2 text-left bg-white border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                        liquid-morph
                        ${errors.lab_hrs ? 'border-red-500' : 'border-gray-300'}
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                      `}
                    />
                    {errors.lab_hrs && (
                      <p className="text-sm text-red-600">{errors.lab_hrs}</p>
                    )}
                  </div>

                  {/* Total Units */}
                  <div className="space-y-2">
                    <Label htmlFor="total_units" className="text-sm font-medium text-gray-700">
                      Total Units
                    </Label>
                    <Input
                      id="total_units"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.total_units}
                      onChange={(e) => handleInputChange('total_units', e.target.value)}
                      placeholder="0"
                      disabled={isLoading}
                      className={`
                        w-full px-3 py-2 text-left bg-white border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                        liquid-morph
                        ${errors.total_units ? 'border-red-500' : 'border-gray-300'}
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                      `}
                    />
                    {errors.total_units && (
                      <p className="text-sm text-red-600">{errors.total_units}</p>
                    )}
                  </div>

                  {/* Number of Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="number_of_hours" className="text-sm font-medium text-gray-700">
                      Number of Hours
                    </Label>
                    <Input
                      id="number_of_hours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.number_of_hours}
                      onChange={(e) => handleInputChange('number_of_hours', e.target.value)}
                      placeholder="0"
                      disabled={isLoading}
                      className={`
                        w-full px-3 py-2 text-left bg-white border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                        liquid-morph
                        ${errors.number_of_hours ? 'border-red-500' : 'border-gray-300'}
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                      `}
                    />
                    {errors.number_of_hours && (
                      <p className="text-sm text-red-600">{errors.number_of_hours}</p>
                    )}
                  </div>

                    {/* Pre Requisites */}
                  <div className="space-y-2">
                  <Label htmlFor="pre_req" className="text-sm font-medium text-gray-700">
                    Pre Requisites
                  </Label>
                  <Input
                    id="pre_req"
                    type="text"
                    value={formData.pre_req}
                    onChange={(e) => handleInputChange('pre_req', e.target.value)}
                    placeholder="Enter pre requisites"
                    disabled={isLoading}
                    className={`
                      w-full px-3 py-2 text-left bg-white border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                      liquid-morph
                      ${errors.pre_req ? 'border-red-500' : 'border-gray-300'}
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                    `}
                  />
                  {errors.pre_req && (
                    <p className="text-sm text-red-600">{errors.pre_req}</p>
                  )}
                </div>
                </div>

                {/* Year and Semester */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Year */}
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-sm font-medium text-gray-700">
                      Year *
                    </Label>
                    <div className="relative">
                      <button
                        type="button"
                        className={`
                          w-full px-3 py-2 text-left bg-white border rounded-lg flex items-center justify-between
                          focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                          ${errors.year ? 'border-red-500' : 'border-gray-300'}
                          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                        `}
                        onClick={() => !isLoading && setIsYearDropdownOpen(!isYearDropdownOpen)}
                        disabled={isLoading}
                      >
                        {formData.year}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </button>
                      {isYearDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                          <div className="py-1">
                            {yearOptions.map((year) => (
                              <button
                                key={year}
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                onClick={() => {
                                  handleInputChange('year', year);
                                  setIsYearDropdownOpen(false);
                                }}
                              >
                                {year}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.year && (
                      <p className="text-sm text-red-600">{errors.year}</p>
                    )}
                  </div>

                  {/* Semester */}
                  <div className="space-y-2">
                    <Label htmlFor="semester" className="text-sm font-medium text-gray-700">
                      Semester *
                    </Label>
                    <div className="relative">
                      <button
                        type="button"
                        className={`
                          w-full px-3 py-2 text-left bg-white border rounded-lg flex items-center justify-between
                          focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                          ${errors.semester ? 'border-red-500' : 'border-gray-300'}
                          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                        `}
                        onClick={() => !isLoading && setIsSemesterDropdownOpen(!isSemesterDropdownOpen)}
                        disabled={isLoading}
                      >
                        {formData.semester}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </button>
                      {isSemesterDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                          <div className="py-1">
                            {semesterOptions.map((semester) => (
                              <button
                                key={semester}
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                onClick={() => {
                                  handleInputChange('semester', semester);
                                  setIsSemesterDropdownOpen(false);
                                }}
                              >
                                {semester}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.semester && (
                      <p className="text-sm text-red-600">{errors.semester}</p>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="liquid-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="gradient-primary text-white liquid-button min-w-[100px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {subject ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {subject ? 'Update' : 'Create'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SubjectModal;