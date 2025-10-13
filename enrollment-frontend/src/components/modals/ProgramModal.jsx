import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ProgramModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  program = null, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    program_name: '',
    program_code: '',
    years: ''
  });
  
  const programCodeOptions = [
    { value: 'Bachelor', label: 'Bachelor' },
    { value: 'SHS', label: 'SHS' },
    { value: 'Diploma', label: 'Diploma' }
  ];
  const [isProgramCodeDropdownOpen, setIsProgramCodeDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when modal opens or program changes
  useEffect(() => {
    if (isOpen) {
      if (program) {
        // Edit mode - populate with existing data
        setFormData({
          program_name: program.program_name || '',
          program_code: program.program_code || '',
          years: program.years?.toString() || ''
        });
      } else {
        // Create mode - reset form
        setFormData({
          program_name: '',
          program_code: '',
          years: ''
        });
      }
      setIsProgramCodeDropdownOpen(false);
      setErrors({});
    }
  }, [isOpen, program]);

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

    if (!formData.program_name.trim()) {
      newErrors.program_name = 'Program name is required';
    }

    if (!formData.program_code) {
      newErrors.program_code = 'Program code is required';
    }

    if (!formData.years) {
      newErrors.years = 'Years is required';
    } else {
      const years = parseInt(formData.years);
      if (isNaN(years) || years < 1 || years > 10) {
        newErrors.years = 'Years must be a number between 1 and 10';
      }
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
      program_name: formData.program_name.trim(),
      program_code: formData.program_code,
      years: parseInt(formData.years)
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
                {program ? 'Edit Program' : 'Create Program'}
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
              {/* Program Name */}
              <div className="space-y-2">
                <Label htmlFor="program_name" className="text-sm font-medium text-gray-700">
                  Program Name *
                </Label>
                <Input
                  id="program_name"
                  type="text"
                  value={formData.program_name}
                  onChange={(e) => handleInputChange("program_name", e.target.value)}
                  placeholder="Enter program name"
                  disabled={isLoading}
                  className={`
                    w-full px-3 py-2 text-left bg-white border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                    liquid-morph
                    ${errors.program_name ? 'border-red-500' : 'border-gray-300'}
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                  `}
                />
                {errors.program_name && (
                  <p className="text-sm text-red-600">{errors.program_name}</p>
                )}
              </div>

              {/* Program Code */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Program Code *
                </Label>
                <div className="relative">
                  <motion.button
                    type="button"
                    onClick={() => setIsProgramCodeDropdownOpen(!isProgramCodeDropdownOpen)}
                    disabled={isLoading}
                    className={`
                      w-full px-3 py-2 text-left bg-white border rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)]
                      liquid-morph flex items-center justify-between
                      ${errors.program_code ? 'border-red-500' : 'border-gray-300'}
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                    `}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={formData.program_code ? 'text-gray-900' : 'text-gray-500'}>
                      {formData.program_code || 'Select a program code'}
                    </span>
                    <motion.div
                      animate={{ rotate: isProgramCodeDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isProgramCodeDropdownOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                      >
                        {programCodeOptions.map((option) => (
                          <motion.button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              handleInputChange('program_code', option.value);
                              setIsProgramCodeDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                            whileHover={{ backgroundColor: '#f9fafb' }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="font-medium text-gray-900">{option.label}</div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {errors.program_code && (
                  <p className="text-sm text-red-600">{errors.program_code}</p>
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
                      {program ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {program ? 'Update' : 'Create'}
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

export default ProgramModal;

