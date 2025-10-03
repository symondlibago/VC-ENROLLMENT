import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Edit, Save, XCircle, Loader2 } from 'lucide-react'; 
// Make sure authAPI is imported to get the user's role
import { gradeAPI, authAPI } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SuccessAlert from './SuccessAlert';

// MotionDropdown component remains the same...
const MotionDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = useMemo(() => 
    options.find(opt => opt.value === value) || { label: placeholder, value: '' },
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
        className="w-full px-3 py-1 text-left bg-white border border-gray-300 rounded-md focus:border-red-500 focus:ring-1 focus:ring-red-500 flex items-center justify-between"
      >
        <span className="text-gray-900 text-sm">{selectedOption.label}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value} type="button" onClick={() => handleSelect(option)}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const StudentGradesModal = ({ isOpen, onClose, studentId, studentName }) => {
  const [grades, setGrades] = useState([]);
  const [editedGrades, setEditedGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });
  const [filters, setFilters] = useState({ year: '', semester: '' });
  
  // STEP 1: Get the current user's data from the auth service.
  const user = authAPI.getUserData();

  // STEP 2: Create a boolean flag. This will be true only for 'Admin' or 'Registrar'.
  // This makes the code cleaner and easier to read.
  const canEdit = user && (user.role === 'Admin' || user.role === 'Registrar');

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
        setEditedGrades(JSON.parse(JSON.stringify(response.data))); // Deep copy for editing
      }
    } catch (error) {
      console.error("Failed to fetch grades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGrades();
    } else {
      // Reset state on close
      setIsEditing(false);
      setGrades([]);
      setEditedGrades([]);
    }
  }, [isOpen, studentId, filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleGradeDataChange = (gradeId, field, value) => {
    setEditedGrades(prev => prev.map(grade => {
      if (grade.id === gradeId) {
        const updatedGrade = { ...grade, [field]: value };
        
        if (field === 'final_grade' && !['INC', 'NFE', 'NFR', 'DA'].includes(updatedGrade.status)) {
            if (value !== null && value !== '') {
                updatedGrade.status = parseFloat(value) >= 75 ? 'Passed' : 'Failed';
            } else {
                updatedGrade.status = 'In Progress';
            }
        }
        
        if (field === 'status' && ['INC', 'NFE', 'NFR', 'DA'].includes(value)) {
            updatedGrade.final_grade = null;
        }

        return updatedGrade;
      }
      return grade;
    }));
  };
  
  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    // --- START OF CHANGE ---
    // 1. Filter for grades that have actually changed.
    // 2. Map the results to a new, clean array containing only the necessary data.
    const changedGradesPayload = editedGrades
      .filter(editedGrade => {
        const originalGrade = grades.find(g => g.id === editedGrade.id);
        if (!originalGrade) return false;
        return originalGrade.final_grade !== editedGrade.final_grade || originalGrade.status !== editedGrade.status;
      })
      .map(g => ({
        id: g.id,
        final_grade: g.final_grade,
        status: g.status,
      }));
    // --- END OF CHANGE ---

    if (changedGradesPayload.length === 0) {
        setAlert({ isVisible: true, message: "No changes to save.", type: 'info' });
        setIsSaving(false);
        setIsEditing(false);
        return;
    }

    try {
        // Send the new, cleaner payload to the API
        const response = await gradeAPI.updateStudentGrades(changedGradesPayload);
        if (response.success) {
            setAlert({ isVisible: true, message: 'Grades updated successfully!', type: 'success' });
            setIsEditing(false);
            fetchGrades(); // Refresh data
        }
    } catch (error) {
        setAlert({ isVisible: true, message: error.message || 'Failed to save changes.', type: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedGrades(JSON.parse(JSON.stringify(grades))); // Revert changes
  };

  const getStatusBadge = (status) => {
    if (status === 'Passed') return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
    if (status === 'Failed') return <Badge variant="destructive">{status}</Badge>;
    if (['INC', 'NFE', 'NFR', 'DA'].includes(status)) return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>;
    return <Badge variant="outline">{status || 'In Progress'}</Badge>;
  };
  
  const yearOptions = [ { label: 'All Years', value: '' }, { label: 'Grade 11', value: 'Grade 11' }, { label: 'Grade 12', value: 'Grade 12' }, { label: '1st Year', value: '1st Year' }, { label: '2nd Year', value: '2nd Year' }, { label: '3rd Year', value: '3rd Year' }, { label: '4th Year', value: '4th Year' }];
  const semesterOptions = [ { label: 'All Semesters', value: '' }, { label: '1st Semester', value: '1st Semester' }, { label: '2nd Semester', value: '2nd Semester' }];
  const statusOptions = [
      { label: 'In Progress', value: 'In Progress'},
      { label: 'Passed', value: 'Passed' },
      { label: 'Failed', value: 'Failed' },
      { label: 'INC (Incomplete)', value: 'INC' },
      { label: 'NFE (No Final Exam)', value: 'NFE' },
      { label: 'NFR (No Final Req.)', value: 'NFR' },
      { label: 'DA (Dropped)', value: 'DA' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <SuccessAlert isVisible={alert.isVisible} message={alert.message} type={alert.type} onClose={() => setAlert(prev => ({ ...prev, isVisible: false }))} />
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] flex flex-col"
          >
            <div className="sticky top-0 bg-red-800 text-white z-10 flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-semibold">Grades for {studentName}</h2>
                <p className="text-sm text-red-100">View and manage academic records.</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:text-red-800 hover:bg-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-grow overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                    <MotionDropdown value={filters.year} onChange={(value) => handleFilterChange('year', value)} options={yearOptions} placeholder="Filter by Year..." />
                    <MotionDropdown value={filters.semester} onChange={(value) => handleFilterChange('semester', value)} options={semesterOptions} placeholder="Filter by Semester..." />
                </div>
                {/* STEP 3: Conditionally render the "Edit Grades" button.
                  It will only show if 'canEdit' is true AND the user is not already editing.
                */}
                {canEdit && !isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit Grades
                    </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>
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
                        <th className="px-6 py-3 text-center font-bold">Final Grade</th>
                        <th className="px-6 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editedGrades.length > 0 ? (
                        editedGrades.map((grade) => (
                          <tr key={grade.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-2 font-mono">{grade.subject_code}</td>
                            <td className="px-6 py-2 font-medium text-gray-900">{grade.descriptive_title}</td>
                            <td className="px-6 py-2">{grade.instructor_name}</td>
                            <td className="px-2 py-2 text-center">{grade.prelim_grade ?? '-'}</td>
                            <td className="px-2 py-2 text-center">{grade.midterm_grade ?? '-'}</td>
                            <td className="px-2 py-2 text-center">{grade.semifinal_grade ?? '-'}</td>
                            <td className="px-2 py-2 text-center font-bold">
                               {/* The 'isEditing' state now depends on the role-protected button */}
                               {isEditing ? (
                                    <Input 
                                        type="number" 
                                        className="w-20 mx-auto text-center"
                                        value={grade.final_grade ?? ''}
                                        onChange={(e) => handleGradeDataChange(grade.id, 'final_grade', e.target.value === '' ? null : parseFloat(e.target.value))}
                                    />
                               ) : (grade.final_grade ?? '-')}
                            </td>
                            <td className="px-6 py-2 text-center">
                               {isEditing ? (
                                    <MotionDropdown 
                                        options={statusOptions}
                                        value={grade.status}
                                        onChange={(value) => handleGradeDataChange(grade.id, 'status', value)}
                                    />
                               ) : getStatusBadge(grade.status)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="8" className="text-center py-10 text-gray-500">No grades found.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            {/* The save/cancel footer also depends on the role-protected button being clicked */}
            {isEditing && (
                <div className="flex justify-end gap-4 p-4 border-t bg-gray-50">
                    <Button variant="ghost" onClick={handleCancel}>
                        <XCircle className="w-4 h-4 mr-2"/> Cancel
                    </Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2"/>}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StudentGradesModal;