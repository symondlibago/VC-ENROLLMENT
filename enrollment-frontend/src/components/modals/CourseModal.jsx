import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const CourseModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  course = null, 
  isLoading = false,
  programs = []
}) => {
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    course_specialization: '',
    description: '',
    years: '',
    program_id: ''
  });
  const [errors, setErrors] = useState({});
  const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);

  // Initialize form data when modal opens or course changes
  useEffect(() => {
    if (isOpen) {
      if (course) {
        // Edit mode - populate with existing data
        setFormData({
          course_code: course.course_code || '',
          course_name: course.course_name || '',
          course_specialization: course.course_specialization || '',
          description: course.description || '',
          years: course.years?.toString() || '',
          program_id: course.program_id?.toString() || ''
        });
      } else {
        // Create mode - reset form
        setFormData({
          course_code: '',
          course_name: '',
          course_specialization: '',
          description: '',
          years: '',
          program_id: ''
        });
      }
      setErrors({});
      setIsProgramDropdownOpen(false);
    }
  }, [isOpen, course]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.course_name.trim()) {
      newErrors.course_name = 'Course name is required';
    }

    if (!formData.course_code.trim()) {
      newErrors.course_code = 'Course code is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required';
    }

    if (!formData.years) {
      newErrors.years = 'Years is required';
    } else {
      const years = parseInt(formData.years);
      if (isNaN(years) || years < 1 || years > 10) {
        newErrors.years = 'Years must be a number between 1 and 10';
      }
    }

    if (!formData.program_id) {
      newErrors.program_id = 'Program selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      course_code: formData.course_code.trim(),
      course_name: formData.course_name.trim(),
      course_specialization: formData.course_specialization.trim(),
      description: formData.description.trim(),
      years: parseInt(formData.years),
      program_id: parseInt(formData.program_id)
    };

    try {
      await onSubmit(submitData);
    } catch (error) {
      // Handle API validation errors
      if (error.errors) {
        setErrors(error.errors);
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const getSelectedProgram = () => {
    return programs.find(program => program.id.toString() === formData.program_id);
  };

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

  const dropdownVariants = {
    hidden: { 
      opacity: 0,
      y: -10,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    exit: { 
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.15
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
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
            <div className="flex items-center justify-between p-6 border-b bg-red-800">
              <h2 className="text-xl font-bold text-white">
                {course ? 'Edit Course' : 'Create Course'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isLoading}
                className="text-white hover:text-red-800 hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Course Name */}
              <div className="flex space-x-4">
        <div className="w-25">
          <Label htmlFor="course_code" className="text-sm font-medium text-gray-700">
            Course Code *
          </Label>
          <Input
            id="course_code"
            type="text"
            value={formData.course_code}
            onChange={(e) => handleInputChange('course_code', e.target.value)}
            placeholder="Enter course code"
            disabled={isLoading}
            className={`
                w-full px-3 py-2 text-left bg-white border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                liquid-morph
                ${errors.course_code ? 'border-red-500' : 'border-gray-300'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
              `}
          />
          {errors.course_code && (
            <p className="text-sm text-red-600">{errors.course_code}</p>
          )}
        </div>

        <div className="flex-1">
          <Label htmlFor="course_name" className="text-sm font-medium text-gray-700">
            Course Name *
          </Label>
          <Input
            id="course_name"
            type="text"
            value={formData.course_name}
            onChange={(e) => handleInputChange('course_name', e.target.value)}
            placeholder="Enter course name"
            disabled={isLoading}
            className={`
                w-full px-3 py-2 text-left bg-white border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                liquid-morph
                ${errors.course_name ? 'border-red-500' : 'border-gray-300'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
              `}
          />
          {errors.course_name && (
            <p className="text-sm text-red-600">{errors.course_name}</p>
          )}
        </div>
      </div>

              <div className="space-y-2">
            <Label htmlFor="course_specialization" className="text-sm font-medium text-gray-700">
              Course Specialization
            </Label>
            <Input
              id="course_specialization"
              type="text"
              value={formData.course_specialization}
              onChange={(e) => handleInputChange('course_specialization', e.target.value)}
              placeholder="Enter Course Specialization"
              disabled={isLoading}
              className={`
                w-full px-3 py-2 text-left bg-white border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                liquid-morph
                ${errors.course_specialization ? 'border-red-500' : 'border-gray-300'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
              `}
            />
            {errors.course_specialization && (
              <p className="text-sm text-red-600">{errors.course_specialization}</p>
            )}
          </div>

              {/* Program Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Program *
                </Label>
                <div className="relative">
                  <motion.button
                    type="button"
                    onClick={() => setIsProgramDropdownOpen(!isProgramDropdownOpen)}
                    disabled={isLoading}
                    className={`
                      w-full px-3 py-2 text-left bg-white border rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                      liquid-morph flex items-center justify-between
                      ${errors.program_id ? 'border-red-500' : 'border-gray-300'}
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                    `}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={getSelectedProgram() ? 'text-gray-900' : 'text-gray-500'}>
                      {getSelectedProgram() ? `${getSelectedProgram().program_code} - ${getSelectedProgram().program_name}` : 'Select a program'}
                    </span>
                    <motion.div
                      animate={{ rotate: isProgramDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isProgramDropdownOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                      >
                        {programs.length > 0 ? (
                          programs.map((program) => (
                            <motion.button
                              key={program.id}
                              type="button"
                              onClick={() => {
                                handleInputChange('program_id', program.id.toString());
                                setIsProgramDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                              whileHover={{ backgroundColor: '#f9fafb' }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="font-medium text-gray-900">{program.program_code} - {program.program_name}</div>
                            </motion.button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-sm">
                            No programs available
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {errors.program_id && (
                  <p className="text-sm text-red-600">{errors.program_id}</p>
                )}
              </div>

              {/* Course Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter course description"
                  disabled={isLoading}
                  rows={4}
                  className={`
                w-full px-3 py-2 text-left bg-white border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                liquid-morph
                ${errors.course_description ? 'border-red-500' : 'border-gray-300'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
              `}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Years */}
              <div className="space-y-2">
                <Label htmlFor="years" className="text-sm font-medium text-gray-700">
                  Duration (Years) *
                </Label>
                <Input
                  id="years"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.years}
                  onChange={(e) => handleInputChange('years', e.target.value)}
                  placeholder="Enter duration in years"
                  disabled={isLoading}
                  className={`
                    w-full px-3 py-2 text-left bg-white border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                    liquid-morph
                    ${errors.years ? 'border-red-500' : 'border-gray-300'}
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                  `}
                />
                {errors.years && (
                  <p className="text-sm text-red-600">{errors.years}</p>
                )}
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
                      {course ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {course ? 'Update' : 'Create'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CourseModal;

