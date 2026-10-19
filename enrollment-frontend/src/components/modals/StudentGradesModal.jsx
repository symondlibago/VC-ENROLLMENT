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
import { periodsFor, computeFinalGrade } from '@/lib/gradingPeriods';

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
        className="w-full px-3 py-1 text-left bg-white border border-gray-300 rounded-md focus:border-red-800 focus:ring-1 focus:ring-red-800 flex items-center justify-between"
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


const StudentGradesModal = ({ isOpen, onClose, studentId, studentName, courseName, year }) => {
  const [grades, setGrades] = useState([]);
  const [editedGrades, setEditedGrades] = useState([]);
  // Senior High is marked on three terms, college on four periods
  const periods = useMemo(
    () => periodsFor(year, editedGrades[0]?.year),
    [year, editedGrades]
  );
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });
  const [filters, setFilters] = useState({ year: '', semester: '' });
  
  const user = authAPI.getUserData();
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
        // A stored Passed/Failed/In Progress is brought back in line with the
        // marks on the row, so a subject whose terms are all in never shows as
        // still in progress. Remarks the instructor set are left alone.
        const settled = response.data.map((grade) => ({
          ...grade,
          status: computeAutoStatus(grade),
        }));

        setGrades(settled);
        setEditedGrades(JSON.parse(JSON.stringify(settled))); // Deep copy for editing
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
        // INC/NFE/NFR/DA only change the remark — the grades already entered are
        // kept, since an INC form has to show the student's rating.

        // If 'Credited' is selected, set grade to 1.0
        if (field === 'status' && value === 'Credited') {
            updatedGrade.final_grade = 1.0;
        }

        return updatedGrade;
      }
      return grade;
    }));
  };

  /**
   * The final grade is the mean of the periods the class is marked on — four
   * for college, three for Senior High. Both formulas were already an equal
   * weighting, so only the number of periods differs.
   */
  const calculateFinalGrade = (grade) => computeFinalGrade(grade, year, grade.year);

  // Helper for Equivalent Conversion based on your provided table
  const getEquivalent = (numericGrade) => {
    if (numericGrade === null) return '--';
    
    const g = Math.round(numericGrade); // Round to nearest whole number for mapping

    if (g >= 100) return "1.0";
    if (g === 99) return "1.1";
    if (g === 98) return "1.2";
    if (g === 97) return "1.25";
    if (g === 96) return "1.3";
    if (g === 95) return "1.4";
    if (g === 94) return "1.5";
    if (g === 93) return "1.6";
    if (g === 92) return "1.7";
    if (g === 91) return "1.75";
    if (g === 90) return "1.8";
    if (g === 89) return "1.9";
    if (g === 88) return "2.0";
    if (g === 87) return "2.1";
    if (g === 86) return "2.2";
    if (g === 85) return "2.25";
    if (g === 84) return "2.3";
    if (g === 83) return "2.4";
    if (g === 82) return "2.5";
    if (g === 81) return "2.6";
    if (g === 80) return "2.7";
    if (g === 79) return "2.75";
    if (g === 78) return "2.8";
    if (g === 77) return "2.9";
    if (g >= 75) return "3.0"; // 75-76%
    if (g === 74) return "3.1";
    if (g === 73) return "3.2";
    if (g === 72) return "3.25";
    if (g === 71) return "3.3";
    if (g === 70) return "3.4";
    return "5.0"; // 69% and below
  };

  const getGradeColorClass = (grade) => {
    if (grade === null || grade === undefined || grade === '') return 'text-gray-900';
    return parseFloat(grade) < 75 ? 'text-red-600' : 'text-green-600';
  };

  /**
   * A remark the instructor set wins; otherwise the status follows the marks.
   * The final grade is null until every period the class uses is filled in, so
   * that alone decides whether the subject is still in progress — Senior High
   * needs three terms, college four.
   */
  const computeAutoStatus = (grade) => {
    if (['INC', 'NFE', 'NFR', 'DA', 'Credited'].includes(grade.status)) {
      return grade.status;
    }

    const computedFinal = calculateFinalGrade(grade);
    if (computedFinal === null) return 'In Progress';

    return computedFinal >= 75 ? 'Passed' : 'Failed';
  };

  // Recompute the auto status only when the user finishes editing a grade cell
  // (on blur), so it doesn't flip while they are still typing the number.
  const handleGradeBlur = (gradeId) => {
    setEditedGrades(prev => prev.map(grade =>
      grade.id === gradeId ? { ...grade, status: computeAutoStatus(grade) } : grade
    ));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const changedGradesPayload = editedGrades
      .filter(editedGrade => {
        const originalGrade = grades.find(g => g.id === editedGrade.id);
        if (!originalGrade) return false;
        return (
          originalGrade.prelim_grade !== editedGrade.prelim_grade ||
          originalGrade.midterm_grade !== editedGrade.midterm_grade ||
          originalGrade.semifinal_grade !== editedGrade.semifinal_grade ||
          originalGrade.final_grade !== editedGrade.final_grade ||
          originalGrade.status !== editedGrade.status
        );
      })
      .map(g => ({
        id: g.id,
        prelim_grade: g.prelim_grade,
        midterm_grade: g.midterm_grade,
        semifinal_grade: g.semifinal_grade,
        final_grade: g.final_grade,
        status: g.status,
      }));

    if (changedGradesPayload.length === 0) {
        setAlert({ isVisible: true, message: "No changes to save.", type: 'info' });
        setIsSaving(false);
        setIsEditing(false);
        return;
    }

    try {
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
    if (status === 'Credited') return <Badge className="bg-blue-100 text-blue-800">{status}</Badge>;
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
      { label: 'Credited', value: 'Credited' },
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
            {/* Header */}
            <div className="sticky top-0 bg-red-800 text-white z-10 flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-semibold">Grades for {studentName}</h2>
                <p className="text-sm text-red-100">View and manage academic records.</p>
              </div>
              <Button onClick={onClose} className="p-1 bg-transparent cursor-pointer hover:text-red-800 hover:bg-white transition-colors">
                <X size={20} />
              </Button>
            </div>
            
            <div className="p-6 grow overflow-y-auto">
              {/* Filters and Edit Button */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                    <MotionDropdown value={filters.year} onChange={(value) => handleFilterChange('year', value)} options={yearOptions} placeholder="Filter by Year..." />
                    <MotionDropdown value={filters.semester} onChange={(value) => handleFilterChange('semester', value)} options={semesterOptions} placeholder="Filter by Semester..." />
                </div>
                {canEdit && !isEditing && (
                    <Button className="cursor-pointer" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit Grades
                    </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>
                ) : (
                  <table className="w-full text-sm text-left">
                    {/* Header */}
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3">Subject Code</th>
                        <th className="px-6 py-3">Descriptive Title</th>
                        <th className="px-6 py-3">Instructor</th>
                        {periods.map((period) => (
                          <th key={period.key} className="px-2 py-3 text-center">{period.label}</th>
                        ))}
                        <th className="px-4 py-3 text-center text-red-700">Final Grade</th>
                        <th className="px-4 py-3 text-center">Equivalent</th>
                        <th className="px-6 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editedGrades.map((grade) => {
                        const computedFinal = calculateFinalGrade(grade);
                        const equivalent = getEquivalent(computedFinal);

                        return (
                          <tr key={grade.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-2 font-mono">{grade.subject_code}</td>
                            <td className="px-6 py-2 font-medium">{grade.descriptive_title}</td>
                            <td className="px-6 py-2">{grade.instructor_name}</td>
                            {/* One cell per period the class is marked on —
                                four for college, three for Senior High. */}
                            {periods.map((period) => (
                              <td
                                key={period.key}
                                className={`px-2 py-2 text-center font-mono ${getGradeColorClass(grade[period.key])}`}
                              >
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    className="w-16 mx-auto text-center font-mono border-2 border-gray-300 bg-white shadow-sm focus:border-red-600 focus:ring-2 focus:ring-red-200"
                                    value={grade[period.key] ?? ''}
                                    onChange={(e) =>
                                      handleGradeDataChange(
                                        grade.id,
                                        period.key,
                                        e.target.value === '' ? null : parseFloat(e.target.value)
                                      )
                                    }
                                    onBlur={() => handleGradeBlur(grade.id)}
                                  />
                                ) : (
                                  grade[period.key] ?? '-'
                                )}
                              </td>
                            ))}

                            {/* Computed Final Grade (The % Result) - Now displays the rounded number without .toFixed(2) */}
                            <td className={`px-4 py-2 text-center font-bold text-gray-900 font-mono ${getGradeColorClass(computedFinal)}`}>
                              {computedFinal !== null ? computedFinal : '--'}
                            </td>

                            {/* Equivalent Grade (1.0 - 5.0) */}
                            <td className="px-4 py-2 text-center font-bold text-gray-900 font-mono">
                              {equivalent}
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
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            
            {/* Footer */}
            {isEditing && (
                <div className="flex justify-end gap-4 p-4 border-t bg-gray-50">
                    <Button className="cursor-pointer" variant="ghost" onClick={handleCancel}>
                        <XCircle className="w-4 h-4 mr-2"/> Cancel
                    </Button>
                    <Button className="cursor-pointer" onClick={handleSaveChanges} disabled={isSaving}>
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