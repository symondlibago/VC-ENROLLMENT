import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, ChevronDown, Search, X as ClearIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { subjectAPI } from '@/services/api';

// Helper component for the searchable prerequisite input
const SearchablePrerequisiteInput = ({ value, onChange, courseId, error, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSubjectName, setSelectedSubjectName] = useState('');

  // When the component loads with an existing value (editing mode)
  useEffect(() => {
    if (value) {
      setSelectedSubjectName(`${value.subject_code} - ${value.descriptive_title}`);
    } else {
      setSelectedSubjectName('');
    }
  }, [value]);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const response = await subjectAPI.searchSubjects(searchTerm, courseId);
      setResults(response.data);
      setIsDropdownOpen(true);
    }, 300); // Debounce to avoid excessive API calls

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, courseId]);

  const handleSelect = (subject) => {
    setSearchTerm('');
    setSelectedSubjectName(`${subject.subject_code} - ${subject.descriptive_title}`);
    onChange(subject.id); // Pass the ID up to the form state
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedSubjectName('');
    onChange(null); // Pass null up to the form state
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          value={selectedSubjectName || searchTerm}
          onChange={(e) => {
            if (selectedSubjectName) handleClear(); // Clear selection first if user starts typing again
            setSearchTerm(e.target.value);
          }}
          placeholder="Search by subject code or title..."
          disabled={disabled}
          className={`pl-10 ${error ? 'border-red-500' : 'border-gray-300'}`}
        />
        {value && (
          <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <ClearIcon size={16} />
          </button>
        )}
      </div>
      {isDropdownOpen && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((subject) => (
            <button
              key={subject.id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              onClick={() => handleSelect(subject)}
            >
              {subject.subject_code} - {subject.descriptive_title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


const SubjectModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  subject = null,
  course = null,
  programType = null,
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
    prerequisite_id: null,
    prerequisite: null,
  });

  // Validation state
  const [errors, setErrors] = useState({});
  
  // Year and semester options based on program type
  const getYearOptions = () => {
    switch (programType) {
      case 'SHS':
        return ['Grade 11', 'Grade 12'];
      case 'Bachelor':
      case 'Diploma':
      default:
        return ['1st Year', '2nd Year', '3rd Year', '4th Year', '1st Year Summer', '2nd Year Summer'];
    }
  };

  const getSemesterOptions = () => {
    return ['1st Semester', '2nd Semester'];
  };
  
  // Dropdown state
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2, ease: "easeInOut" } }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  // Initialize form data when subject or course changes
  useEffect(() => {
    if (isOpen) {
      const defaultYear = programType === 'SHS' ? 'Grade 11' : '1st Year';
      
      if (subject) {
        // Edit mode - populate form with subject data
        setFormData({
          subject_code: subject.subject_code || '',
          descriptive_title: subject.descriptive_title || '',
          lec_hrs: subject.lec_hrs || 0,
          lab_hrs: subject.lab_hrs || 0,
          total_units: subject.total_units || 0,
          year: subject.year || defaultYear,
          semester: subject.semester || '1st Semester',
          course_id: subject.course_id || (course ? course.id : ''),
          number_of_hours: subject.number_of_hours || 0,
          prerequisite_id: subject.prerequisite_id || null,
          prerequisite: subject.prerequisite || null,
        });
      } else {
        // Create mode - reset form
        setFormData({
          subject_code: '',
          descriptive_title: '',
          lec_hrs: 0,
          lab_hrs: 0,
          total_units: 0,
          year: defaultYear,
          semester: '1st Semester',
          course_id: course ? course.id : '',
          number_of_hours: 0,
          prerequisite_id: null,
          prerequisite: null,
        });
      }
      setErrors({});
    }
  }, [isOpen, subject, course, programType]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    const isNumericField = ['lec_hrs', 'lab_hrs', 'number_of_hours'].includes(field);
    const numericValue = isNumericField ? parseFloat(value) || 0 : value;

    setFormData(prev => {
      const newFormData = { ...prev, [field]: numericValue };
      if ((programType === 'Bachelor' || programType === 'Diploma') && (field === 'lec_hrs' || field === 'lab_hrs')) {
        const lec = field === 'lec_hrs' ? numericValue : prev.lec_hrs;
        const lab = field === 'lab_hrs' ? numericValue : prev.lab_hrs;
        newFormData.total_units = (Number(lec) || 0) + (Number(lab) || 0);
      }
      return newFormData;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form based on program type
  const validateForm = () => {
    const newErrors = {};
    if (!formData.subject_code.trim()) newErrors.subject_code = 'Subject code is required';
    if (!formData.descriptive_title.trim()) newErrors.descriptive_title = 'Descriptive title is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.semester) newErrors.semester = 'Semester is required';
    if (programType === 'SHS' && (!formData.number_of_hours || formData.number_of_hours <= 0)) {
      newErrors.number_of_hours = 'Number of hours is required and must be greater than 0';
    }
    if (!formData.course_id) newErrors.course_id = 'Course is required';
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

  const handleClose = () => !isLoading && onClose();

  const shouldShowField = (fieldName) => {
    if (!programType) return true; 
    switch (programType) {
      case 'Bachelor':
      case 'Diploma':
        return fieldName !== 'number_of_hours';
      case 'SHS': 
        return ['subject_code', 'descriptive_title', 'number_of_hours', 'year', 'semester'].includes(fieldName);
      default: 
        return true;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            variants={overlayVariants} initial="hidden" animate="visible" exit="exit" onClick={handleClose}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            variants={overlayVariants} initial="hidden" animate="visible" exit="exit"
          >
            <motion.div 
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
              variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b bg-red-800">
                <h2 className="text-xl font-bold text-white">
                  {subject ? 'Edit Subject' : 'Add Subject'}
                  {programType && <span className="text-sm font-normal text-white ml-2">({programType} Program)</span>}
                </h2>
                <Button variant="ghost" size="sm" onClick={handleClose} disabled={isLoading} className="text-white hover:text-red-800 hover:bg-white cursor-pointer">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {shouldShowField('subject_code') && (
                  <div className="space-y-2">
                    <Label htmlFor="subject_code" className="text-sm font-medium text-gray-700">Subject Code *</Label>
                    <Input id="subject_code" type="text" value={formData.subject_code} onChange={(e) => handleInputChange('subject_code', e.target.value)} placeholder="Enter subject code" disabled={isLoading} className={`${errors.subject_code ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.subject_code && <p className="text-sm text-red-600">{errors.subject_code}</p>}
                  </div>
                )}

                {shouldShowField('descriptive_title') && (
                  <div className="space-y-2">
                    <Label htmlFor="descriptive_title" className="text-sm font-medium text-gray-700">Descriptive Title *</Label>
                    <Input id="descriptive_title" type="text" value={formData.descriptive_title} onChange={(e) => handleInputChange('descriptive_title', e.target.value)} placeholder="Enter descriptive title" disabled={isLoading} className={`${errors.descriptive_title ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.descriptive_title && <p className="text-sm text-red-600">{errors.descriptive_title}</p>}
                  </div>
                )}

                {shouldShowField('number_of_hours') && (
                  <div className="space-y-2">
                    <Label htmlFor="number_of_hours" className="text-sm font-medium text-gray-700">Number of Hours *</Label>
                    <Input id="number_of_hours" type="number" min="0" step="0.5" value={formData.number_of_hours} onChange={(e) => handleInputChange('number_of_hours', e.target.value)} placeholder="0" disabled={isLoading} className={`${errors.number_of_hours ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.number_of_hours && <p className="text-sm text-red-600">{errors.number_of_hours}</p>}
                  </div>
                )}

                {(programType === 'Bachelor' || programType === 'Diploma') && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lec_hrs" className="text-sm font-medium text-gray-700">Lec Hrs</Label>
                      <Input id="lec_hrs" type="number" min="0" step="0.5" value={formData.lec_hrs} onChange={(e) => handleInputChange('lec_hrs', e.target.value)} placeholder="0" disabled={isLoading} className={`${errors.lec_hrs ? 'border-red-500' : 'border-gray-300'}`} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lab_hrs" className="text-sm font-medium text-gray-700">Lab Hrs</Label>
                      <Input id="lab_hrs" type="number" min="0" step="0.5" value={formData.lab_hrs} onChange={(e) => handleInputChange('lab_hrs', e.target.value)} placeholder="0" disabled={isLoading} className={`${errors.lab_hrs ? 'border-red-500' : 'border-gray-300'}`} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_units" className="text-sm font-medium text-gray-700">Units</Label>
                      <Input id="total_units" type="number" value={formData.total_units} placeholder="0" disabled className="bg-gray-100 cursor-not-allowed" />
                    </div>
                  </div>
                )}

                {shouldShowField('prerequisite_id') && (
                  <div className="space-y-2">
                    <Label htmlFor="prerequisite" className="text-sm font-medium text-gray-700">Pre-requisite (Optional)</Label>
                    <SearchablePrerequisiteInput
                      value={formData.prerequisite}
                      onChange={(id) => handleInputChange('prerequisite_id', id)}
                      courseId={formData.course_id}
                      disabled={isLoading}
                      error={errors.prerequisite_id}
                    />
                    {errors.prerequisite_id && <p className="text-sm text-red-600">{errors.prerequisite_id}</p>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {shouldShowField('year') && (
                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-sm font-medium text-gray-700">{programType === 'SHS' ? 'Grade' : 'Year'} *</Label>
                      <div className="relative">
                        <button type="button" className={`w-full px-3 py-2 text-left bg-white border rounded-lg flex items-center justify-between ${errors.year ? 'border-red-500' : 'border-gray-300'}`} onClick={() => !isLoading && setIsYearDropdownOpen(!isYearDropdownOpen)} disabled={isLoading}>
                          {formData.year} <ChevronDown className="w-4 h-4 ml-2" />
                        </button>
                        {isYearDropdownOpen && (
                          <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {getYearOptions().map((year) => (
                              <button key={year} type="button" className="w-full px-3 py-2 text-left hover:bg-gray-50" onClick={() => { handleInputChange('year', year); setIsYearDropdownOpen(false); }}>{year}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      {errors.year && <p className="text-sm text-red-600">{errors.year}</p>}
                    </div>
                  )}

                  {shouldShowField('semester') && (
                    <div className="space-y-2">
                      <Label htmlFor="semester" className="text-sm font-medium text-gray-700">Semester *</Label>
                      <div className="relative">
                        <button type="button" className={`w-full px-3 py-2 text-left bg-white border rounded-lg flex items-center justify-between ${errors.semester ? 'border-red-500' : 'border-gray-300'}`} onClick={() => !isLoading && setIsSemesterDropdownOpen(!isSemesterDropdownOpen)} disabled={isLoading}>
                          {formData.semester} <ChevronDown className="w-4 h-4 ml-2" />
                        </button>
                        {isSemesterDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {getSemesterOptions().map((semester) => (
                              <button key={semester} type="button" className="w-full px-3 py-2 text-left hover:bg-gray-50" onClick={() => { handleInputChange('semester', semester); setIsSemesterDropdownOpen(false); }}>{semester}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      {errors.semester && <p className="text-sm text-red-600">{errors.semester}</p>}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
                  <Button type="submit" disabled={isLoading} className="gradient-primary text-white min-w-[100px]">
                    {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{subject ? 'Updating...' : 'Creating...'}</> : <><Save className="w-4 h-4 mr-2" />{subject ? 'Update' : 'Create'}</>}
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