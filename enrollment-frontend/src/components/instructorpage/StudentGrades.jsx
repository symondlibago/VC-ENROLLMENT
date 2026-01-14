import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, ChevronDown, BookCopy, Users, CheckCircle, Save, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { instructorAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import SuccessAlert from '../modals/SuccessAlert'; 
import ValidationErrorModal from '../modals/ValidationErrorModal'; 

const MotionDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = useMemo(() => 
    options.find(opt => opt.value === value)?.label || placeholder,
    [value, options, placeholder]
  );

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-200 rounded-lg focus:border-(--dominant-red) focus:ring-2 focus:ring-(--dominant-red)/20 liquid-morph flex items-center justify-between min-w-[200px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-gray-900">{selectedLabel}</span>
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
                key={option.value} type="button" onClick={() => handleSelect(option.value)}
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


const StudentGrades = () => {
  const [rosterData, setRosterData] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradingPeriods, setGradingPeriods] = useState({});
  const [alertState, setAlertState] = useState({ isVisible: false, message: '', type: 'success' });
  const [validationError, setValidationError] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    const fetchGradeableStudents = async () => {
      try {
        setLoading(true);
        const response = await instructorAPI.getGradeableStudents();
        if (response.success) {
          setRosterData(response.data);
          setGradingPeriods(response.grading_periods || {});
          if (response.data && response.data.length > 0) {
            setSelectedSubjectId(response.data[0].subject_id.toString());
          }
        } else {
             setAlertState({ isVisible: true, message: 'Failed to fetch student roster.', type: 'error' });
        }
      } catch (error) {
        setAlertState({ isVisible: true, message: 'An error occurred while fetching students.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchGradeableStudents();
  }, []);

  const isPeriodOpen = (periodName) => {
    const period = gradingPeriods[periodName];
    if (!period || !period.start_date || !period.end_date) return false;
    const now = new Date();
    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  };

  const subjectOptions = useMemo(() => 
    rosterData.map(subject => ({
      label: `${subject.subject_code} - ${subject.descriptive_title}`,
      value: subject.subject_id.toString()
    }))
  , [rosterData]);

  const { filteredStudents, totalStudentsInSubject, gradedStudentsCount } = useMemo(() => {
    if (!selectedSubjectId) {
        return { filteredStudents: [], totalStudentsInSubject: 0, gradedStudentsCount: 0 };
    }
    const subject = rosterData.find(s => s.subject_id.toString() === selectedSubjectId);
    if (!subject) {
        return { filteredStudents: [], totalStudentsInSubject: 0, gradedStudentsCount: 0 };
    }
    const studentsToDisplay = subject.students || [];
    const total = studentsToDisplay.length;
    const graded = studentsToDisplay.filter(student => student.grades?.status === 'Passed' || student.grades?.status === 'Failed').length;
    
    const filtered = studentsToDisplay.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return { filteredStudents: filtered, totalStudentsInSubject: total, gradedStudentsCount: graded };
  }, [rosterData, selectedSubjectId, searchTerm]);

  const handleGradeChange = (studentId, field, value) => {
    let numericValue = null;

    if (value !== '') {
        numericValue = parseFloat(value);
        
        if (isNaN(numericValue)) {
          return;
        }

        if (numericValue > 100) {
            numericValue = 100; 
        }
    }
    setRosterData(currentRoster => 
      currentRoster.map(subject => {
        if (subject.subject_id.toString() !== selectedSubjectId) {
          return subject;
        }
        const updatedStudents = subject.students.map(student => {
          if (student.id !== studentId) {
            return student;
          }
          return {
            ...student,
            grades: { ...student.grades, [field]: numericValue }
          };
        });
        return { ...subject, students: updatedStudents };
      })
    );
  };

  const getEquivalentGrade = (finalGrade) => {
    if (finalGrade === null || finalGrade === undefined) return '--';
    
    // Round to the nearest whole number for mapping
    const grade = Math.round(finalGrade);
  
    if (grade >= 100) return '1.0';
    if (grade === 99) return '1.1';
    if (grade === 98) return '1.2';
    if (grade === 97) return '1.25';
    if (grade === 96) return '1.3';
    if (grade === 95) return '1.4';
    if (grade === 94) return '1.5';
    if (grade === 93) return '1.6';
    if (grade === 92) return '1.7';
    if (grade === 91) return '1.75';
    if (grade === 90) return '1.8';
    if (grade === 89) return '1.9';
    if (grade === 88) return '2.0';
    if (grade === 87) return '2.1';
    if (grade === 86) return '2.2';
    if (grade === 85) return '2.25';
    if (grade === 84) return '2.3';
    if (grade === 83) return '2.4';
    if (grade === 82) return '2.5';
    if (grade === 81) return '2.6';
    if (grade === 80) return '2.7';
    if (grade === 79) return '2.75';
    if (grade === 78) return '2.8';
    if (grade === 77) return '2.9';
    if (grade === 76 || grade === 75) return '3.0';
    if (grade === 74) return '3.1';
    if (grade === 73) return '3.2';
    if (grade === 72) return '3.25';
    if (grade === 71) return '3.3';
    if (grade === 70) return '3.4';
    
    return '5.0'; // 69% and below
  };

const calculateFinalGrade = (student, subjectCode) => {
  const { prelim_grade: p, midterm_grade: m, semifinal_grade: s, final_grade: f } = student.grades || {};
  
  // Check if all grades are present before calculating
  if ([p, m, s, f].some(grade => grade === null || grade === undefined || grade === '')) return null;

  // FIX: Check if student is in DHT course or is Senior High (Grade 11/12)
  // We check student.courseName which is provided by the API in getGradeableStudents
  const isDHT = student.courseName?.includes('Diploma in Hospitality Technology') || 
                student.courseName?.includes('DHT') ||
                subjectCode?.includes('DHT');
                
  const isSHS = student.year?.includes('Grade 11') || student.year?.includes('Grade 12');

  if (isDHT || isSHS) {
    // Formula for DHT/SHS: (Prelim + Midterm + Semi + Final) / 4
    return (p + m + s + f) / 4;
  } else {
    // Standard College Formula: 20% Prelim + 20% Midterm + 20% Semi + 40% Final
    return (p * 0.20) + (m * 0.20) + (s * 0.20) + (f * 0.40);
  }
};
  const handleSubmitGrades = async () => {
    if (!selectedSubjectId) {
        setValidationError({ isOpen: true, message: 'Please select a specific subject before submitting grades.' });
        return;
    }
    setIsSubmitting(true);
    const gradesToSubmit = filteredStudents.map(student => ({
        student_id: student.id,
        subject_id: parseInt(selectedSubjectId),
        prelim_grade: student.grades?.prelim_grade,
        midterm_grade: student.grades?.midterm_grade,
        semifinal_grade: student.grades?.semifinal_grade,
        final_grade: student.grades?.final_grade,
    }));

    try {
        const response = await instructorAPI.bulkUpdateGrades(gradesToSubmit);
        if (response.success) {
            setAlertState({ isVisible: true, message: response.message, type: 'success' });
        } else {
            setAlertState({ isVisible: true, message: response.message || 'Failed to submit grades.', type: 'error' });
        }
    } catch (error) {
        setAlertState({ isVisible: true, message: error.message || 'An error occurred while submitting grades.', type: 'error' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" color="red" /></div>;
  }
  
  return (
    <motion.div className="p-6 space-y-6 max-w-7xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
       <SuccessAlert 
        isVisible={alertState.isVisible}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState({ ...alertState, isVisible: false })}
      />
      <ValidationErrorModal 
        isOpen={validationError.isOpen}
        message={validationError.message}
        onClose={() => setValidationError({ isOpen: false, message: '' })}
      />

      <motion.div variants={itemVariants}>
        <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
          <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
            <FileText className="w-8 h-8 text-(--dominant-red) mr-3" />
            Student Grades
          </h1>
          <p className="text-gray-600 text-lg">Input and manage grades for students in your classes.</p>
        </div>
      </motion.div>
      
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={itemVariants}>
        <Card className="shadow-sm"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">Total Subjects</p><p className="text-3xl font-bold heading-bold text-gray-900">{subjectOptions.length}</p></div><div className="bg-red-100 p-4 rounded-full"><BookCopy className="w-7 h-7 text-red-600" /></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">Students in Subject</p><p className="text-3xl font-bold heading-bold text-gray-900">{totalStudentsInSubject}</p></div><div className="bg-blue-100 p-4 rounded-full"><Users className="w-7 h-7 text-blue-600" /></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">Grades Finalized</p><p className="text-3xl font-bold heading-bold text-gray-900">{gradedStudentsCount}</p></div><div className="bg-green-100 p-4 rounded-full"><CheckCircle className="w-7 h-7 text-green-600" /></div></CardContent></Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search students by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border border-gray-300 focus:border-red-800 focus:ring-1 focus:ring-red-800 rounded-lg"/>
            </div>
            <div className="w-full md:w-auto min-w-[250px]">
              <MotionDropdown value={selectedSubjectId} onChange={setSelectedSubjectId} options={subjectOptions} placeholder="Select a subject..." />
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div className="overflow-x-auto" variants={itemVariants}>
        <Card>
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
              <th className="px-6 py-3">Student ID</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Prelim</th>
              <th className="px-6 py-3">Midterm</th>
              <th className="px-6 py-3">Semi-Final</th>
              <th className="px-6 py-3">Final</th>
              <th className="px-6 py-3 text-red-600">Final Grade</th>
              <th className="px-6 py-3">Equivalent</th>
              <th className="px-6 py-3">Status</th>
            </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  // Get the current subject code for formula selection
                  const subject = rosterData.find(s => s.subject_id.toString() === selectedSubjectId);
                  const computedFinal = calculateFinalGrade(student, subject?.subject_code);
                  const equivalent = getEquivalentGrade(computedFinal);

                  let statusBadge;
                  if (computedFinal !== null) {
                      statusBadge = computedFinal >= 75
                          ? <Badge className="bg-green-100 text-green-800">Passed</Badge> 
                          : <Badge variant="destructive">Failed</Badge>;
                  } else {
                      statusBadge = <Badge variant="outline">In Progress</Badge>;
                  }

                  return (
                    <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono">{student.studentId}</td>
                      <td className="px-6 py-4">{student.name}</td>
                      
                      {/* Grade Inputs (Updated max to 100) */}
                      {['prelim_grade', 'midterm_grade', 'semifinal_grade', 'final_grade'].map((field) => (
                        <td key={field} className="px-2 py-2">
                          <Input 
                            type="number" min="0" max="100" 
                            value={student.grades?.[field] ?? ''} 
                            onChange={(e) => handleGradeChange(student.id, field, e.target.value)}
                            className="w-16 border-gray-300 font-mono"
                            disabled={!isPeriodOpen(field.split('_')[0])}
                          />
                        </td>
                      ))}

                      {/* Computed Final Grade Column */}
                      <td className="px-6 py-4 font-bold text-gray-900 font-mono">
                        {computedFinal !== null ? computedFinal.toFixed(2) : '--'}
                      </td>

                      {/* Equivalent Column (Blank as requested) */}
                      <td className="px-6 py-4 font-mono text-gray-900 font-bold">{equivalent}</td>

                      <td className="px-6 py-4">{statusBadge}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
             {filteredStudents.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p>{!selectedSubjectId ? 'Please select a subject to begin grading.' : 'No students found for this subject or search.'}</p>
                </div>
             )}
        </Card>
      </motion.div>
      <motion.div className="flex justify-end" variants={itemVariants}>
        <Button onClick={handleSubmitGrades} disabled={isSubmitting || !selectedSubjectId} className="min-w-[150px]">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Submitting...' : 'Submit Grades'}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default StudentGrades;