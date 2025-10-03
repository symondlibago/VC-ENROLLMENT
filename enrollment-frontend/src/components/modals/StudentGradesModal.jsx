import React, { useState, useEffect} from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // ✅ 1. ADDED IMPORTS
import { X, ChevronDown } from 'lucide-react'; 
import { gradeAPI } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

// ✅ 2. DEFINED MotionDropdown COMPONENT INLINE
const MotionDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    options.find(opt => opt.value === value) || { label: placeholder, value: '' }
  );

  useEffect(() => {
    setSelectedOption(options.find(opt => opt.value === value) || { label: placeholder, value: '' });
  }, [value, options, placeholder]);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-2 focus:ring-[var(--dominant-red)]/20 liquid-morph flex items-center justify-between min-w-[200px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-gray-900">{selectedOption.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
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
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value} type="button" onClick={() => handleSelect(option)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }} whileHover={{ backgroundColor: '#f9fafb', x: 4 }}
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


const StudentGradesModal = ({ isOpen, onClose, studentId, studentName }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ year: '', semester: '' });

  useEffect(() => {
    const fetchGrades = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        const response = await gradeAPI.getStudentGrades(studentId, { 
          year: filters.year || null, 
          semester: filters.semester || null 
        });
        if (response.success) {
          setGrades(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch grades:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchGrades();
    }
  }, [isOpen, studentId, filters]);

  // ✅ 3. SIMPLIFIED handler for the dropdown
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const getStatusBadge = (status) => {
    if (status === 'Passed') return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
    if (status === 'Failed') return <Badge variant="destructive">{status}</Badge>;
    return <Badge variant="outline">{status || 'In Progress'}</Badge>;
  };

  // ✅ 4. FORMATTED options for the dropdown
  const yearOptions = [
    { label: 'All Years', value: '' },
    { label: 'Grade 11', value: 'Grade 11' },
    { label: 'Grade 12', value: 'Grade 12' },
    { label: '1st Year', value: '1st Year' },
    { label: '2nd Year', value: '2nd Year' },
    { label: '3rd Year', value: '3rd Year' },
    { label: '4th Year', value: '4th Year' },
  ];

  const semesterOptions = [
    { label: 'All Semesters', value: '' },
    { label: '1st Semester', value: '1st Semester' },
    { label: '2nd Semester', value: '2nd Semester' },
  ];


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-red-800 text-white z-10 flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Grades for {studentName}</h2>
            <p className="text-sm text-red-100">
              View academic records. Use the filters to narrow down the results by year and semester.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:text-red-800 hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {/* ✅ 5. REPLACED <select> with <MotionDropdown> */}
          <div className="flex gap-4 my-4">
            <MotionDropdown
              value={filters.year}
              onChange={(value) => handleFilterChange('year', value)}
              options={yearOptions}
              placeholder="Filter by Year..."
            />
            <MotionDropdown
              value={filters.semester}
              onChange={(value) => handleFilterChange('semester', value)}
              options={semesterOptions}
              placeholder="Filter by Semester..."
            />
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <LoadingSpinner />
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3">Subject Code</th>
                    <th className="px-6 py-3">Descriptive Title</th>
                    <th className="px-6 py-3">Instructor</th>
                    <th className="px-2 py-3 text-center">Prelim</th>
                    <th className="px-2 py-3 text-center">Midterm</th>
                    <th className="px-2 py-3 text-center">Semi-Final</th>
                    <th className="px-2 py-3 text-center">Final</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.length > 0 ? (
                    grades.map((grade) => (
                      <tr key={grade.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono">{grade.subject_code}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{grade.descriptive_title}</td>
                        <td className="px-6 py-4">{grade.instructor_name}</td>
                        <td className="px-2 py-4 text-center">{grade.prelim_grade ?? '-'}</td>
                        <td className="px-2 py-4 text-center">{grade.midterm_grade ?? '-'}</td>
                        <td className="px-2 py-4 text-center">{grade.semifinal_grade ?? '-'}</td>
                        <td className="px-2 py-4 text-center font-bold">{grade.final_grade ?? '-'}</td>
                        <td className="px-6 py-4 text-center">{getStatusBadge(grade.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-gray-500">
                        No grades found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGradesModal;